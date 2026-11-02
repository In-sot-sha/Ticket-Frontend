import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont, type PDFImage } from 'pdf-lib';
import JSZip from 'jszip';
import QRCode from 'qrcode';

export interface ClientTicketItem {
  id: number;
  qrCode?: string | null;
  ticketTypeName?: string | null;
  guestName?: string | null;
}

export interface ClientOrderPassData {
  orderId: number | string;
  eventTitle: string;
  eventDate?: string | null;
  eventTime?: string | null;
  eventLocation?: string | null;
  eventImageUrl?: string | null;
  organizerName?: string | null;
  organizerLogoUrl?: string | null;
  accentColor?: string | null;
  ticketStyle?: string | null;
  tickets: ClientTicketItem[];
}

const ACCENT_HEX: Record<string, string> = {
  rose: '#d85060',
  gold: '#c49a1a',
  emerald: '#059669',
  purple: '#6d5a9a',
  midnight: '#1e293b',
  ocean: '#0284c7',
};

const LAYOUT_COPY: Record<string, { headline: string; sublabel: string; venueLabel: string }> = {
  classic: { headline: 'COME AND JOIN', sublabel: 'Admit one', venueLabel: 'LIVE AT' },
  boarding: { headline: "YOU'RE INVITED", sublabel: 'First class', venueLabel: 'VENUE' },
  stub: { headline: 'LIVE SHOW', sublabel: 'Admit one', venueLabel: 'LIVE AT' },
  cinema: { headline: 'NOW SHOWING', sublabel: 'Admit one', venueLabel: 'SCREEN' },
  folio: { headline: 'EXHIBITION', sublabel: 'Admit one', venueLabel: 'VENUE' },
};

function parseStyle(raw?: string | null): { layout: string; accentId: string } {
  const value = (raw || '').trim().toLowerCase();
  if (!value) return { layout: 'classic', accentId: 'rose' };
  const match = value.match(/^([a-z]+)-([a-z]+)$/);
  if (match) return { layout: match[1], accentId: match[2] };
  if (ACCENT_HEX[value]) return { layout: 'classic', accentId: value };
  return { layout: 'classic', accentId: 'rose' };
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace('#', '');
  if (raw.length < 6) return { r: 0.85, g: 0.31, b: 0.38 };
  return {
    r: parseInt(raw.slice(0, 2), 16) / 255,
    g: parseInt(raw.slice(2, 4), 16) / 255,
    b: parseInt(raw.slice(4, 6), 16) / 255,
  };
}

function inkOn(hex: string): { r: number; g: number; b: number } {
  const { r, g, b } = hexToRgb(hex);
  const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luma > 0.55 ? { r: 0.04, g: 0.04, b: 0.04 } : { r: 1, g: 1, b: 1 };
}

function resolveAccent(ticketStyle?: string | null, accentColor?: string | null): string {
  if (accentColor && /^#[0-9a-fA-F]{6}$/.test(accentColor.trim())) return accentColor.trim();
  const { accentId } = parseStyle(ticketStyle);
  return ACCENT_HEX[accentId] || ACCENT_HEX.rose;
}

function splitTitle(title: string): { first: string; rest: string } {
  const parts = (title || 'Event').trim().split(/\s+/);
  if (parts.length <= 1) return { first: parts[0] || 'Event', rest: '' };
  return { first: parts[0], rest: parts.slice(1).join(' ') };
}

function truncate(text: string, font: PDFFont, size: number, maxWidth: number): string {
  if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && font.widthOfTextAtSize(`${t}…`, size) > maxWidth) {
    t = t.slice(0, -1);
  }
  return `${t}…`;
}

async function convertBlobToJpegBytes(blob: Blob): Promise<{ bytes: Uint8Array; kind: 'jpg' } | null> {
  try {
    if (typeof window === 'undefined') return null;

    let bitmap: ImageBitmap | HTMLImageElement | null = null;
    if (typeof createImageBitmap === 'function') {
      try {
        bitmap = await createImageBitmap(blob);
      } catch {
        bitmap = null;
      }
    }

    if (!bitmap) {
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      const loaded = await new Promise<boolean>((resolve) => {
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
        img.src = url;
      });
      URL.revokeObjectURL(url);
      if (!loaded || !img.naturalWidth || !img.naturalHeight) return null;
      bitmap = img;
    }

    const width = 'width' in bitmap ? bitmap.width : (bitmap as HTMLImageElement).naturalWidth;
    const height = 'height' in bitmap ? bitmap.height : (bitmap as HTMLImageElement).naturalHeight;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(bitmap, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        async (jpegBlob) => {
          if (!jpegBlob) return resolve(null);
          const buf = new Uint8Array(await jpegBlob.arrayBuffer());
          resolve({ bytes: buf, kind: 'jpg' });
        },
        'image/jpeg',
        0.82,
      );
    });
  } catch (err) {
    console.warn('[clientTicketZip] convertBlobToJpegBytes error:', err);
    return null;
  }
}

async function fetchImageViaCanvas(url: string): Promise<{ bytes: Uint8Array; kind: 'jpg' } | null> {
  try {
    if (typeof window === 'undefined') return null;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    const loaded = await new Promise<boolean>((resolve) => {
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
    if (!loaded || !img.naturalWidth || !img.naturalHeight) return null;

    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        async (jpegBlob) => {
          if (!jpegBlob) return resolve(null);
          const buf = new Uint8Array(await jpegBlob.arrayBuffer());
          resolve({ bytes: buf, kind: 'jpg' });
        },
        'image/jpeg',
        0.82,
      );
    });
  } catch {
    return null;
  }
}

async function fetchImageBuffer(url?: string | null): Promise<{ bytes: Uint8Array; kind: 'png' | 'jpg' } | null> {
  if (!url?.trim()) return null;
  let cleanUrl = url.trim();

  // Cloudinary mobile optimization (force f_jpg)
  if (cleanUrl.includes('res.cloudinary.com') && cleanUrl.includes('/upload/') && !cleanUrl.includes('/upload/w_')) {
    cleanUrl = cleanUrl.replace('/upload/', '/upload/w_600,c_fill,q_75,f_jpg/');
  }

  // Unsplash: force fm=jpg (never auto=format which produces AVIF)
  if (cleanUrl.includes('images.unsplash.com')) {
    const base = cleanUrl.split('?')[0];
    cleanUrl = `${base}?w=600&q=75&fm=jpg&fit=crop`;
  }

  // Relative URLs
  if (cleanUrl.startsWith('/')) {
    cleanUrl = `https://api.partystorm.ng${cleanUrl}`;
  }

  try {
    const res = await fetch(cleanUrl, {
      headers: { Accept: 'image/jpeg,image/png' },
      signal: AbortSignal.timeout(6000),
    });
    if (res.ok) {
      const blob = await res.blob();
      const ct = (blob.type || res.headers.get('content-type') || '').toLowerCase();
      const buf = new Uint8Array(await blob.arrayBuffer());

      // Check for JPEG SOI marker (0xFF, 0xD8)
      if ((ct.includes('jpeg') || ct.includes('jpg')) && buf.length > 2 && buf[0] === 0xff && buf[1] === 0xd8) {
        return { bytes: buf, kind: 'jpg' };
      }

      // Check for PNG magic header (0x89, 0x50, 0x4E, 0x47)
      if (ct.includes('png') && buf.length > 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        return { bytes: buf, kind: 'png' };
      }

      // For any other format (AVIF, WebP, etc.), convert to JPEG via browser canvas
      const converted = await convertBlobToJpegBytes(blob);
      if (converted) return converted;
    }
  } catch (err) {
    console.warn('[clientTicketZip] fetchImageBuffer fetch failed, trying canvas fallback:', err);
  }

  // Fallback: try loading directly via HTML Image element + Canvas
  return await fetchImageViaCanvas(cleanUrl);
}

async function embedImageSafely(
  doc: PDFDocument,
  imageItem?: { bytes: Uint8Array; kind: 'png' | 'jpg' } | null,
): Promise<PDFImage | null> {
  if (!imageItem?.bytes || imageItem.bytes.length === 0) return null;
  try {
    if (imageItem.kind === 'jpg') {
      return await doc.embedJpg(imageItem.bytes);
    } else {
      return await doc.embedPng(imageItem.bytes);
    }
  } catch (primaryErr) {
    console.warn('[clientTicketZip] doc.embed error, attempting fallback conversion:', primaryErr);
    try {
      const blob = new Blob([imageItem.bytes as unknown as BlobPart]);
      const converted = await convertBlobToJpegBytes(blob);
      if (converted) {
        return await doc.embedJpg(converted.bytes);
      }
    } catch (fallbackErr) {
      console.warn('[clientTicketZip] fallback conversion also failed:', fallbackErr);
    }
    return null;
  }
}

function drawCoverImage(
  page: PDFPage,
  image: PDFImage | null,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  if (!image) {
    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      color: rgb(0.09, 0.09, 0.11),
    });
    return;
  }
  const scale = Math.max(w / image.width, h / image.height);
  const drawW = image.width * scale;
  const drawH = image.height * scale;
  const offsetX = x + (w - drawW) / 2;
  const offsetY = y + (h - drawH) / 2;
  page.drawImage(image, { x: offsetX, y: offsetY, width: drawW, height: drawH });
}

async function renderSingleTicketPdfDoc(
  ticket: ClientTicketItem,
  orderData: ClientOrderPassData,
  preloadedImages: {
    banner?: { bytes: Uint8Array; kind: 'png' | 'jpg' } | null;
    logo?: { bytes: Uint8Array; kind: 'png' | 'jpg' } | null;
  },
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  // Compact vertical portrait pass matching mobile view (380×510)
  const W = 380;
  const H = 510;
  const splitY = 320; // Compact top photo banner (190px) + bottom stub (320px)

  const page = doc.addPage([W, H]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const banner = await embedImageSafely(doc, preloadedImages.banner);
  const logo = await embedImageSafely(doc, preloadedImages.logo);

  const accentHex = resolveAccent(orderData.ticketStyle, orderData.accentColor);
  const accent = hexToRgb(accentHex);
  const onAccent = inkOn(accentHex);
  const { layout } = parseStyle(orderData.ticketStyle);
  const copy = LAYOUT_COPY[layout] || LAYOUT_COPY.classic;
  const split = splitTitle(orderData.eventTitle || 'Event');

  // 1. Top Section: Compact Photo & Event Details (190px height)
  drawCoverImage(page, banner, 0, splitY, W, H - splitY);

  page.drawRectangle({
    x: 0,
    y: splitY,
    width: W,
    height: H - splitY,
    color: rgb(0, 0, 0),
    opacity: 0.65,
  });
  page.drawRectangle({
    x: 0,
    y: splitY,
    width: W,
    height: (H - splitY) * 0.7,
    color: rgb(0, 0, 0),
    opacity: 0.35,
  });

  const pad = 20;
  let y = H - pad - 8;

  // Headline
  page.drawText(copy.headline, {
    x: pad,
    y,
    size: 8.5,
    font: fontBold,
    color: rgb(0.75, 0.75, 0.78),
  });

  // Host logo
  if (logo) {
    const logoSize = 28;
    const scale = Math.min(logoSize / logo.width, logoSize / logo.height);
    const lw = logo.width * scale;
    const lh = logo.height * scale;
    page.drawRectangle({
      x: W - pad - logoSize - 2,
      y: y - 6,
      width: logoSize + 4,
      height: logoSize + 4,
      color: rgb(1, 1, 1),
    });
    page.drawImage(logo, {
      x: W - pad - logoSize + (logoSize - lw) / 2,
      y: y - 5 + (logoSize - lh) / 2,
      width: lw,
      height: lh,
    });
  }

  y -= 26;

  // Event title
  const titleSize = 17;
  const maxTitleW = W - pad * 2 - (logo ? 34 : 0);
  const first = split.first.toUpperCase();
  const rest = split.rest ? split.rest.toUpperCase() : '';
  const firstW = fontBold.widthOfTextAtSize(first, titleSize);

  if (!rest) {
    page.drawText(truncate(first, fontBold, titleSize, maxTitleW), {
      x: pad,
      y,
      size: titleSize,
      font: fontBold,
      color: rgb(accent.r, accent.g, accent.b),
    });
  } else {
    const fullW = fontBold.widthOfTextAtSize(`${first} ${rest}`, titleSize);
    if (fullW <= maxTitleW) {
      page.drawText(first, {
        x: pad,
        y,
        size: titleSize,
        font: fontBold,
        color: rgb(accent.r, accent.g, accent.b),
      });
      page.drawText(` ${rest}`, {
        x: pad + firstW,
        y,
        size: titleSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    } else {
      page.drawText(truncate(first, fontBold, titleSize, maxTitleW), {
        x: pad,
        y,
        size: titleSize,
        font: fontBold,
        color: rgb(accent.r, accent.g, accent.b),
      });
      y -= 19;
      page.drawText(truncate(rest, fontBold, titleSize, maxTitleW), {
        x: pad,
        y,
        size: titleSize,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
    }
  }

  y -= 20;
  page.drawText(copy.venueLabel, {
    x: pad,
    y,
    size: 7,
    font: fontBold,
    color: rgb(0.65, 0.65, 0.68),
  });
  y -= 12;
  page.drawText(truncate((orderData.eventLocation || 'Venue TBA').toUpperCase(), fontBold, 9.5, W - pad * 2), {
    x: pad,
    y,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  // Date & Time anchored near the bottom of the photo section (above splitY)
  const dividerY = splitY + 46;
  const dateLabelY = splitY + 32;
  const dateValueY = splitY + 18;

  // Subtle divider line
  page.drawRectangle({
    x: pad,
    y: dividerY,
    width: W - pad * 2,
    height: 0.5,
    color: rgb(1, 1, 1),
    opacity: 0.2,
  });

  page.drawText('DATE', {
    x: pad,
    y: dateLabelY,
    size: 6.5,
    font: fontBold,
    color: rgb(0.7, 0.7, 0.72),
  });
  page.drawText(truncate((orderData.eventDate || 'TBA').toUpperCase(), fontBold, 9.5, orderData.eventTime ? 150 : W - pad * 2), {
    x: pad,
    y: dateValueY,
    size: 9.5,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  if (orderData.eventTime) {
    // Subtle vertical separator between DATE and TIME
    page.drawRectangle({
      x: pad + 160,
      y: dateValueY - 1,
      width: 0.5,
      height: 22,
      color: rgb(1, 1, 1),
      opacity: 0.2,
    });

    page.drawText('TIME', {
      x: pad + 175,
      y: dateLabelY,
      size: 6.5,
      font: fontBold,
      color: rgb(0.7, 0.7, 0.72),
    });
    page.drawText(truncate(orderData.eventTime.toUpperCase(), fontBold, 9.5, 120), {
      x: pad + 175,
      y: dateValueY,
      size: 9.5,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
  }

  // 2. Perforation divider
  for (let dx = 18; dx < W - 18; dx += 9) {
    page.drawRectangle({
      x: dx,
      y: splitY - 0.75,
      width: 4.5,
      height: 1.5,
      color: rgb(1, 1, 1),
      opacity: 0.35,
    });
  }
  page.drawCircle({ x: 0, y: splitY, size: 9, color: rgb(1, 1, 1) });
  page.drawCircle({ x: W, y: splitY, size: 9, color: rgb(1, 1, 1) });

  // 3. Bottom Stub (Accent color section)
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: splitY,
    color: rgb(accent.r, accent.g, accent.b),
  });
  page.drawRectangle({
    x: 0,
    y: 0,
    width: W,
    height: splitY,
    color: rgb(0, 0, 0),
    opacity: 0.05,
  });

  const stubCx = W / 2;
  const ink = rgb(onAccent.r, onAccent.g, onAccent.b);
  const badgeBg = onAccent.r > 0.5 ? rgb(0.04, 0.04, 0.04) : rgb(1, 1, 1);
  const badgeFg = onAccent.r > 0.5 ? rgb(1, 1, 1) : rgb(0.04, 0.04, 0.04);

  // Ticket type badge pill
  const badgeLabel = truncate(
    (ticket.ticketTypeName || 'General Admission').toUpperCase(),
    fontBold,
    8.5,
    W - 60,
  );
  const badgeW = fontBold.widthOfTextAtSize(badgeLabel, 8.5) + 24;
  const badgeH = 22;
  const badgeX = stubCx - badgeW / 2;
  const badgeY = splitY - 36;
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeW,
    height: badgeH,
    color: badgeBg,
  });
  page.drawCircle({ x: badgeX, y: badgeY + badgeH / 2, size: badgeH / 2, color: badgeBg });
  page.drawCircle({ x: badgeX + badgeW, y: badgeY + badgeH / 2, size: badgeH / 2, color: badgeBg });
  page.drawText(badgeLabel, {
    x: stubCx - fontBold.widthOfTextAtSize(badgeLabel, 8.5) / 2,
    y: badgeY + 7,
    size: 8.5,
    font: fontBold,
    color: badgeFg,
  });

  // QR Code
  const qrDataUrl = await QRCode.toDataURL(ticket.qrCode || `ticket-${ticket.id}`, {
    margin: 1,
    width: 320,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000', light: '#ffffff' },
  });
  const qrBytes = Uint8Array.from(atob(qrDataUrl.replace(/^data:image\/png;base64,/, '')), (c) => c.charCodeAt(0));
  const qrImage = await doc.embedPng(qrBytes);
  const qrPad = 10;
  const qrSize = 154;
  const qrBox = qrSize + qrPad * 2;
  const qrBoxX = stubCx - qrBox / 2;
  const qrBoxY = 76;
  page.drawRectangle({
    x: qrBoxX,
    y: qrBoxY,
    width: qrBox,
    height: qrBox,
    color: rgb(1, 1, 1),
  });
  page.drawImage(qrImage, {
    x: qrBoxX + qrPad,
    y: qrBoxY + qrPad,
    width: qrSize,
    height: qrSize,
  });

  // Notice & sublabel
  const scan = 'DO NOT SHARE TICKET';
  page.drawText(scan, {
    x: stubCx - fontBold.widthOfTextAtSize(scan, 8) / 2,
    y: 52,
    size: 8,
    font: fontBold,
    color: ink,
    opacity: 0.9,
  });
  const sub = copy.sublabel.toUpperCase();
  page.drawText(sub, {
    x: stubCx - fontBold.widthOfTextAtSize(sub, 9.5) / 2,
    y: 36,
    size: 9.5,
    font: fontBold,
    color: ink,
  });

  const serial = `TKT-${String(ticket.id).padStart(6, '0')}`;
  page.drawText(serial, {
    x: stubCx - font.widthOfTextAtSize(serial, 7.5) / 2,
    y: 18,
    size: 7.5,
    font,
    color: ink,
    opacity: 0.75,
  });

  return await doc.save();
}

/**
 * Generate all tickets in the client browser and download.
 * - If 1 ticket: downloads the standalone PDF directly (no zip).
 * - If > 1 tickets: zips separate single-page PDFs into a ZIP archive.
 * 100% client-side: immune to serverless timeouts and function execution limits.
 */
export async function downloadOrderTicketsZipClient(
  orderData: ClientOrderPassData,
  onProgress?: (info: { current: number; total: number; message: string }) => void,
): Promise<void> {
  const validTickets = orderData.tickets.filter((t) => Boolean(t.qrCode || t.id));
  const total = validTickets.length;

  if (total === 0) {
    throw new Error('No tickets found in this order to download.');
  }

  onProgress?.({ current: 0, total, message: 'Loading event graphics...' });

  const [banner, logo] = await Promise.all([
    fetchImageBuffer(orderData.eventImageUrl),
    fetchImageBuffer(orderData.organizerLogoUrl),
  ]);

  const preloadedImages = { banner, logo };

  const safeTitle = (orderData.eventTitle || 'ticket')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 30);

  // If order has only 1 ticket, download the single PDF directly (no zip needed)
  if (total === 1) {
    onProgress?.({ current: 1, total: 1, message: 'Generating ticket PDF...' });
    const ticket = validTickets[0];
    const pdfBytes = await renderSingleTicketPdfDoc(ticket, orderData, preloadedImages);
    const pdfBlob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });

    const guestName = (ticket.guestName || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .slice(0, 20);
    const filename = `${safeTitle}-TKT-${String(ticket.id).padStart(6, '0')}${guestName ? `-${guestName}` : ''}.pdf`;

    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    return;
  }

  const zip = new JSZip();

  // Render in parallel batches of 5 for smooth browser responsiveness
  const batchSize = 5;
  for (let i = 0; i < validTickets.length; i += batchSize) {
    const chunk = validTickets.slice(i, i + batchSize);
    const renderedChunk = await Promise.all(
      chunk.map(async (ticket, chunkIdx) => {
        const ticketIdx = i + chunkIdx;
        const pdfBytes = await renderSingleTicketPdfDoc(ticket, orderData, preloadedImages);
        const guestName = (ticket.guestName || '')
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .slice(0, 20);
        const filename = `ticket-${String(ticketIdx + 1).padStart(2, '0')}-TKT-${String(ticket.id).padStart(6, '0')}${guestName ? `-${guestName}` : ''}.pdf`;
        return { filename, pdfBytes };
      })
    );

    for (const r of renderedChunk) {
      zip.file(r.filename, r.pdfBytes);
    }

    const currentCount = Math.min(i + batchSize, total);
    onProgress?.({
      current: currentCount,
      total,
      message: `Rendered ${currentCount} of ${total} tickets...`,
    });
  }

  onProgress?.({ current: total, total, message: 'Compressing into ZIP...' });

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipFilename = `${safeTitle}-tickets-separate-${total}.zip`;

  // Trigger browser download
  const url = window.URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = zipFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

export const downloadOrderTicketsClient = downloadOrderTicketsZipClient;


/** High-quality DOM → PNG. Prefer modern-screenshot (SVG foreignObject); html2canvas is fallback. */

import { domToCanvas } from 'modern-screenshot';

type CaptureOptions = {
  backgroundColor?: string | null;
  scale?: number;
  sanitize?: boolean;
  width?: number;
  height?: number;
};

const SNAPSHOT_STYLE: Partial<CSSStyleDeclaration> = {
  transform: 'none',
  opacity: '1',
  left: '0px',
  top: '0px',
  right: 'auto',
  bottom: 'auto',
  position: 'relative',
  margin: '0px',
  inset: 'auto',
  clipPath: 'none',
};

function waitForImages(root: HTMLElement) {
  return Promise.all(
    [...root.querySelectorAll('img')].map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        const timer = window.setTimeout(done, 2500);
        const finish = () => {
          window.clearTimeout(timer);
          done();
        };
        img.addEventListener('load', finish, { once: true });
        img.addEventListener('error', finish, { once: true });
      });
    })
  );
}

function resetCloneBox(cloned: HTMLElement) {
  cloned.style.position = 'relative';
  cloned.style.left = '0';
  cloned.style.top = '0';
  cloned.style.right = 'auto';
  cloned.style.bottom = 'auto';
  cloned.style.opacity = '1';
  cloned.style.transform = 'none';
  cloned.style.inset = 'auto';
  cloned.style.margin = '0';
  cloned.style.clipPath = 'none';
}

function paintTicketBadge(el: HTMLElement) {
  const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toUpperCase();
  if (!text) return;

  const cs = getComputedStyle(el);
  const fontFamily = cs.fontFamily || '"Plus Jakarta Sans", sans-serif';
  const fontWeight = cs.fontWeight || '700';
  const fontSize = 10;
  const font = `${fontWeight} ${fontSize}px ${fontFamily}`;
  const padX = 12;
  const height = 22;
  const measure = document.createElement('canvas').getContext('2d');
  if (!measure) return;
  measure.font = font;
  const width = Math.max(72, Math.ceil(measure.measureText(text).width + padX * 2));

  const dpr = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.scale(dpr, dpr);

  const fill =
    cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
      ? cs.backgroundColor
      : '#0a0a0a';
  ctx.fillStyle = fill;
  const radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.arcTo(width, 0, width, height, radius);
  ctx.arcTo(width, height, 0, height, radius);
  ctx.arcTo(0, height, 0, 0, radius);
  ctx.arcTo(0, 0, width, 0, radius);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = cs.color || '#ffffff';
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent || fontSize * 0.8;
  const descent = metrics.actualBoundingBoxDescent || fontSize * 0.2;
  ctx.fillText(text, width / 2, (height - ascent - descent) / 2 + ascent);

  const img = document.createElement('img');
  img.src = canvas.toDataURL('image/png');
  img.width = width;
  img.height = height;
  img.alt = text;
  img.style.display = 'block';
  img.style.width = `${width}px`;
  img.style.height = `${height}px`;
  img.style.margin = '0';
  img.style.flexShrink = '0';
  el.replaceWith(img);
}

function sanitizeClone(cloned: HTMLElement) {
  resetCloneBox(cloned);
  cloned.style.transformOrigin = 'top left';
  cloned.querySelectorAll<HTMLElement>('[data-ticket-badge]').forEach((el) => {
    paintTicketBadge(el);
  });
  cloned.querySelectorAll<HTMLElement>('[data-ticket-photo]').forEach((el) => {
    el.style.display = 'flex';
    el.style.flexDirection = 'column';
    el.style.justifyContent = 'flex-start';
    el.style.alignItems = 'flex-start';
    el.style.textAlign = 'left';
    el.style.height = '100%';
  });
  cloned.querySelectorAll('*').forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    node.style.letterSpacing = '0px';
    node.style.wordSpacing = '0px';
    node.style.textShadow = 'none';
    if (node.style.display === '-webkit-box' || node.className.includes?.('line-clamp')) {
      node.style.display = 'block';
      node.style.overflow = 'visible';
      node.style.webkitLineClamp = 'unset';
    }
  });
}

async function captureWithModern(element: HTMLElement, options?: CaptureOptions) {
  const canvas = await domToCanvas(element, {
    scale: options?.scale ?? 2,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
    width: options?.width,
    height: options?.height,
    style: SNAPSHOT_STYLE,
    timeout: 10000,
    fetch: {
      requestInit: { mode: 'cors', credentials: 'omit' },
      bypassingCache: true,
    },
  });
  if (!canvas || canvas.width < 2 || canvas.height < 2) {
    throw new Error('empty screenshot');
  }
  return canvas;
}

async function captureWithHtml2Canvas(element: HTMLElement, options?: CaptureOptions) {
  const html2canvas = (await import('html2canvas')).default;
  const width = options?.width ?? Math.max(element.scrollWidth, element.offsetWidth, 1);
  const height = options?.height ?? Math.max(element.scrollHeight, element.offsetHeight, 1);

  return html2canvas(element, {
    scale: options?.scale ?? 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
    scrollX: 0,
    scrollY: 0,
    width,
    height,
    windowWidth: width,
    windowHeight: height,
    onclone: (_doc, cloned) => {
      try {
        resetCloneBox(cloned);
        if (options?.sanitize !== false) sanitizeClone(cloned);
      } catch {
        /* still export */
      }
    },
  });
}

export async function captureElementPng(
  element: HTMLElement,
  options?: CaptureOptions
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(element);

  try {
    return await captureWithModern(element, options);
  } catch {
    return captureWithHtml2Canvas(element, options);
  }
}

export async function downloadCanvasPng(canvas: HTMLCanvasElement, filename: string) {
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((next) => resolve(next), 'image/png')
  );
  const href = blob ? URL.createObjectURL(blob) : canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = href;
  link.download = filename;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
  if (blob) window.setTimeout(() => URL.revokeObjectURL(href), 1500);
}

export async function downloadElementPng(
  element: HTMLElement,
  filename: string,
  options?: CaptureOptions
) {
  const canvas = await captureElementPng(element, options);
  await downloadCanvasPng(canvas, filename);
}

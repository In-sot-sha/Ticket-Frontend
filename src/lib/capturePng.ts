/** Rasterize a DOM node to PNG without CSS transform / tracking artifacts. */

function waitForImages(root: HTMLElement) {
  return Promise.all(
    [...root.querySelectorAll('img')].map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        const timer = window.setTimeout(done, 4000);
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

/** Pills only. Never replace in-flow labels — html2canvas then paints them over siblings. */
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
  img.style.margin = '0 auto';
  img.style.flexShrink = '0';
  el.replaceWith(img);
}

function sanitizeClone(cloned: HTMLElement) {
  cloned.style.transform = 'none';
  cloned.style.transformOrigin = 'top left';
  cloned.querySelectorAll<HTMLElement>('[data-ticket-badge]').forEach((el) => {
    if (el instanceof HTMLElement) paintTicketBadge(el);
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

export async function captureElementPng(
  element: HTMLElement,
  options?: { backgroundColor?: string | null; scale?: number; sanitize?: boolean }
): Promise<HTMLCanvasElement> {
  if (document.fonts?.ready) await document.fonts.ready;
  await waitForImages(element);

  const html2canvas = (await import('html2canvas')).default;
  return html2canvas(element, {
    scale: options?.scale ?? 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
    backgroundColor: options?.backgroundColor ?? '#ffffff',
    scrollX: 0,
    scrollY: 0,
    windowWidth: Math.max(element.scrollWidth, element.offsetWidth, 1),
    windowHeight: Math.max(element.scrollHeight, element.offsetHeight, 1),
    onclone: (_doc, cloned) => {
      if (options?.sanitize === false) return;
      try {
        sanitizeClone(cloned);
      } catch {
        /* flyer/ticket capture should still succeed */
      }
    },
  });
}

export async function downloadElementPng(
  element: HTMLElement,
  filename: string,
  options?: { backgroundColor?: string | null; scale?: number; sanitize?: boolean }
) {
  const canvas = await captureElementPng(element, options);
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

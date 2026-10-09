/**
 * iOS removes Safari's pull-to-refresh once the app is on the home screen.
 * These screens also scroll inside <main>, so the window never overscrolls.
 * A downward pull from the top of that scroller reloads the page.
 */
export function installIosPullToRefresh() {
  const nav = navigator as Navigator & { standalone?: boolean };
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const standalone =
    window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true;
  if (!ios || !standalone) return;

  const threshold = 72;
  const pill = document.createElement('div');
  pill.setAttribute('aria-hidden', 'true');
  pill.style.cssText = [
    'position:fixed',
    'left:0',
    'right:0',
    'top:0',
    'z-index:60',
    'display:flex',
    'justify-content:center',
    'pointer-events:none',
    'padding-top:max(env(safe-area-inset-top), 8px)',
    'transform:translateY(-120%)',
    'transition:transform 180ms ease-out',
  ].join(';');
  const label = document.createElement('span');
  label.textContent = 'Pull to refresh';
  label.style.cssText = [
    'border-radius:999px',
    'background:#fff',
    'color:#be123c',
    'border:1px solid #fecdd3',
    'box-shadow:0 1px 2px rgba(0,0,0,.06)',
    'font:700 11px/1 system-ui,sans-serif',
    'letter-spacing:.04em',
    'text-transform:uppercase',
    'padding:6px 10px',
  ].join(';');
  pill.appendChild(label);
  document.body.appendChild(pill);

  let startY = 0;
  let startX = 0;
  let pulling = false;
  let ready = false;
  let scroller: HTMLElement | null = null;

  const reset = () => {
    pulling = false;
    ready = false;
    scroller = null;
    pill.style.transition = 'transform 180ms ease-out';
    pill.style.transform = 'translateY(-120%)';
  };

  const blocked = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest(
      'input, textarea, select, video, canvas, [role="dialog"], [role="menu"], aside, [contenteditable="true"]',
    );

  const pageScroller = (target: EventTarget | null) => {
    if (target instanceof Element) {
      const inside = target.closest('main');
      if (inside instanceof HTMLElement) return inside;
    }
    const main = document.querySelector('main');
    if (main instanceof HTMLElement) return main;
    return (document.scrollingElement as HTMLElement | null) ?? document.documentElement;
  };

  document.addEventListener(
    'touchstart',
    (event) => {
      if (event.touches.length !== 1 || blocked(event.target)) {
        reset();
        return;
      }
      const next = pageScroller(event.target);
      if (next.scrollTop > 1) {
        reset();
        return;
      }
      scroller = next;
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
      pulling = true;
      ready = false;
    },
    { passive: true },
  );

  document.addEventListener(
    'touchmove',
    (event) => {
      if (!pulling || !scroller || event.touches.length !== 1) return;
      if (scroller.scrollTop > 1) {
        reset();
        return;
      }
      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      if (dy <= 0 || Math.abs(dx) > Math.abs(dy)) {
        if (Math.abs(dx) > 12) reset();
        return;
      }
      if (dy < 10) return;
      event.preventDefault();
      const dark = document.documentElement.classList.contains('dark');
      label.style.background = dark ? '#171717' : '#fff';
      label.style.color = dark ? '#fb7185' : '#be123c';
      label.style.borderColor = dark ? '#3f3f46' : '#fecdd3';
      ready = dy >= threshold;
      label.textContent = ready ? 'Release to refresh' : 'Pull to refresh';
      const travel = Math.min(dy, 110);
      pill.style.transition = 'none';
      pill.style.transform = `translateY(${travel - 48}px)`;
    },
    { passive: false, capture: true },
  );

  document.addEventListener('touchend', () => {
    if (ready) {
      label.textContent = 'Refreshing';
      window.location.reload();
      return;
    }
    reset();
  });

  document.addEventListener('touchcancel', reset);
}

/** Dismiss the static HTML boot screen in index.html once the app is ready. */
export function dismissAppBoot() {
  const el = document.getElementById('app-boot');
  if (!el) return;

  el.classList.add('app-boot--hide');
  window.setTimeout(() => {
    el.remove();
  }, 220);
}

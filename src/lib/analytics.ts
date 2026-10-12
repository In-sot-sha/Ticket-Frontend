/** Google Analytics 4 — gtag is loaded from index.html (G-3G1RLJL6EG). */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const GA_MEASUREMENT_ID = 'G-3G1RLJL6EG';

export function isAnalyticsEnabled(): boolean {
  return typeof window !== 'undefined' && typeof window.gtag === 'function';
}

/** SPA page view after in-app navigations (initial load is sent by index.html). */
export function trackPageView(path: string, title?: string): void {
  if (!isAnalyticsEnabled()) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
    send_to: GA_MEASUREMENT_ID,
  });
}

/** Optional custom events (e.g. booking started). */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!isAnalyticsEnabled()) return;
  window.gtag('event', eventName, { ...params, send_to: GA_MEASUREMENT_ID });
}

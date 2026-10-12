/** Google Analytics 4 (gtag). Enabled when VITE_GA_MEASUREMENT_ID is set. */

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

const MEASUREMENT_ID = (
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_GA_MEASUREMENT_ID
    ? String(import.meta.env.VITE_GA_MEASUREMENT_ID).trim()
    : ''
);

let initialized = false;

export function isAnalyticsEnabled(): boolean {
  return Boolean(MEASUREMENT_ID);
}

export function getGaMeasurementId(): string {
  return MEASUREMENT_ID;
}

/** Load gtag.js once and configure GA4 without an automatic first page_view. */
export function initAnalytics(): void {
  if (initialized || !MEASUREMENT_ID || typeof window === 'undefined') return;
  initialized = true;

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', MEASUREMENT_ID, {
    send_page_view: false,
    anonymize_ip: true,
  });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(MEASUREMENT_ID)}`;
  document.head.appendChild(script);
}

/** Send a SPA page view (call on React Router location changes). */
export function trackPageView(path: string, title?: string): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
    page_location: window.location.href,
  });
}

/** Optional custom events (e.g. booking started). */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean | undefined>,
): void {
  if (!MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) return;
  window.gtag('event', eventName, params);
}

import { getApiBaseUrl } from '../services/api';

function apiOrigin(): string {
  const base = getApiBaseUrl();
  if (base.startsWith('/')) {
    return typeof window !== 'undefined' ? window.location.origin : '';
  }
  return base.replace(/\/api\/?$/, '');
}

/** Resolve event image URLs (relative paths or mismatched localhost ports). */
export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const base = new URL(apiOrigin());
      const parsed = new URL(url);
      if (
        (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') &&
        base.hostname !== 'localhost' &&
        base.hostname !== '127.0.0.1'
      ) {
        return `${base.origin}${parsed.pathname}${parsed.search}`;
      }
      if (
        parsed.hostname === 'localhost' &&
        base.hostname === 'localhost' &&
        parsed.port &&
        base.port &&
        parsed.port !== base.port
      ) {
        parsed.port = base.port;
        return parsed.toString();
      }
    } catch {
      /* use original */
    }
    return url;
  }
  const origin = apiOrigin();
  return `${origin}${url.startsWith('/') ? '' : '/'}${url}`;
}

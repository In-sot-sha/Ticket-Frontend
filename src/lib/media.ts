const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:33333/api';

function apiOrigin(): string {
  return apiBase.replace(/\/api\/?$/, '');
}

/** Resolve event image URLs (relative paths or mismatched localhost ports). */
export function resolveImageUrl(url?: string | null): string | null {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const base = new URL(apiOrigin());
      const parsed = new URL(url);
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

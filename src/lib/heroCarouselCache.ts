const STORAGE_KEY = 'ps_hero_carousel_v1';

export type CachedHeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  cta: string;
  link: string;
  image: string;
  tag: string;
  /** Event end (or start) ISO date — cache entry is dropped once this is reached. */
  expiresAt?: string;
};

function isExpired(slide: CachedHeroSlide, now = Date.now()) {
  if (!slide.expiresAt) return false;
  const t = new Date(slide.expiresAt).getTime();
  if (Number.isNaN(t)) return false;
  return t <= now;
}

export function readHeroCarouselCache(): CachedHeroSlide[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    const fresh = parsed.filter((s: CachedHeroSlide) => !isExpired(s));
    if (fresh.length !== parsed.length) {
      if (fresh.length === 0) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
    }
    return fresh;
  } catch {
    return [];
  }
}

export function writeHeroCarouselCache(slides: CachedHeroSlide[]) {
  try {
    const fresh = slides.filter((s) => !isExpired(s));
    if (fresh.length === 0) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(fresh));
  } catch {
    // quota / private mode
  }
}

export function clearHeroCarouselCache() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

export function slidesFingerprint(slides: CachedHeroSlide[]) {
  return slides
    .map((s) => `${s.id}|${s.title}|${s.image}|${s.link}|${s.expiresAt || ''}`)
    .join('::');
}

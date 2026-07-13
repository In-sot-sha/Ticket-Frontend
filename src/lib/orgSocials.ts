export type OrgSocialLinks = {
  instagram?: string;
  twitter?: string;
  facebook?: string;
  tiktok?: string;
};

export const EMPTY_ORG_SOCIALS: OrgSocialLinks = {
  instagram: '',
  twitter: '',
  facebook: '',
  tiktok: '',
};

export function parseOrgSocials(raw?: string | null): OrgSocialLinks {
  if (!raw?.trim()) return { ...EMPTY_ORG_SOCIALS };

  const trimmed = raw.trim();
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return {
        instagram: parsed.instagram || '',
        twitter: parsed.twitter || parsed.x || '',
        facebook: parsed.facebook || '',
        tiktok: parsed.tiktok || '',
      };
    }
  } catch {
    // Legacy plain-text value (e.g. "@brand")
  }

  return { ...EMPTY_ORG_SOCIALS, instagram: trimmed };
}

export function serializeOrgSocials(links: OrgSocialLinks): string | undefined {
  const cleaned: OrgSocialLinks = {};
  if (links.instagram?.trim()) cleaned.instagram = links.instagram.trim();
  if (links.twitter?.trim()) cleaned.twitter = links.twitter.trim();
  if (links.facebook?.trim()) cleaned.facebook = links.facebook.trim();
  if (links.tiktok?.trim()) cleaned.tiktok = links.tiktok.trim();

  if (Object.keys(cleaned).length === 0) return undefined;
  return JSON.stringify(cleaned);
}

export function buildSocialUrl(platform: keyof OrgSocialLinks, value: string): string {
  const v = value.trim();
  if (!v) return '';
  if (v.startsWith('http://') || v.startsWith('https://')) return v;

  const handle = v.replace(/^@/, '');
  switch (platform) {
    case 'instagram':
      return `https://instagram.com/${handle}`;
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'facebook':
      return v.includes('facebook.com')
        ? (v.startsWith('http') ? v : `https://${v}`)
        : `https://facebook.com/${handle}`;
    case 'tiktok':
      return `https://tiktok.com/@${handle}`;
    default:
      return v;
  }
}

export function hasAnySocial(links: OrgSocialLinks): boolean {
  return !!(links.instagram || links.twitter || links.facebook || links.tiktok);
}

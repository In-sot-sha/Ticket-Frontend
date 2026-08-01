/** PartyStorm public support / contact channels — update here to keep Help, Contact, Footer in sync. */

export const SUPPORT_EMAIL = 'support@partystorm.ng';

/** Legal / privacy notices (may alias to support inbox) */
export const LEGAL_EMAIL = 'support@partystorm.ng';
export const PRIVACY_EMAIL = 'support@partystorm.ng';

/** Display form, e.g. on Contact page */
export const SUPPORT_PHONE_DISPLAY = '+234 801 234 5678';

/** E.164 for tel: links */
export const SUPPORT_PHONE_E164 = '+2348012345678';

/** Digits only for wa.me (no + or spaces) */
export const SUPPORT_WHATSAPP = '2348012345678';

export const SUPPORT_INSTAGRAM_URL = 'https://www.instagram.com/partyst0rm/';
export const SUPPORT_INSTAGRAM_HANDLE = '@partyst0rm';

export const SUPPORT_ADDRESS =
  'Floor 1, 2G6V+C4F, Sani Abacha Way, Fagge, Kano 700211, Nigeria';

export const SUPPORT_HOURS = 'Mon – Fri, 9:00 AM – 6:00 PM WAT';

export function whatsappHref(prefill?: string): string {
  const base = `https://wa.me/${SUPPORT_WHATSAPP}`;
  if (!prefill?.trim()) return base;
  return `${base}?text=${encodeURIComponent(prefill.trim())}`;
}

export function mailtoHref(subject?: string): string {
  if (!subject?.trim()) return `mailto:${SUPPORT_EMAIL}`;
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject.trim())}`;
}

export function telHref(): string {
  return `tel:${SUPPORT_PHONE_E164}`;
}

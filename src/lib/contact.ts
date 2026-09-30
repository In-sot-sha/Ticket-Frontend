/** PartyStorm public support / contact channels — update here to keep Help, Contact, Footer in sync. */

export const SUPPORT_EMAIL = 'partystormevents@gmail.com';

/** Legal / privacy notices (may alias to support inbox) */
export const LEGAL_EMAIL = 'partystormevents@gmail.com';
export const PRIVACY_EMAIL = 'partystormevents@gmail.com';

/** Display form, e.g. on Contact page */
export const SUPPORT_PHONE_DISPLAY = '+234 703 015 2798';

/** E.164 for tel: links */
export const SUPPORT_PHONE_E164 = '+2347030152798';

/** Digits only for wa.me (no + or spaces) */
export const SUPPORT_WHATSAPP = '2347030152798';

export const SUPPORT_INSTAGRAM_URL =
  'https://www.instagram.com/partystorm.ng?stkn=MXgzbmM4eWs1Mnd0ZQ%3D%3D&utm_source=qr';
export const SUPPORT_INSTAGRAM_HANDLE = '@partystorm.ng';

export const SUPPORT_TIKTOK_URL =
  'https://www.tiktok.com/@partystorm.ng?_r=1&_t=ZS-9A8yFo517oL';
export const SUPPORT_TIKTOK_HANDLE = '@partystorm.ng';

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

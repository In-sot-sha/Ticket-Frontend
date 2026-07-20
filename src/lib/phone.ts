/** Shared NG phone helpers for auth + ticketing forms */

export const isValidEmail = (email: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

export const normalizePhone = (phone: string): string | null => {
  if (!phone || typeof phone !== 'string') return null;
  const trimmed = phone.trim();
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');
  if (!digits) return null;

  if (digits.startsWith('234') && digits.length === 13) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `+234${digits.slice(1)}`;
  }
  if (digits.length === 10 && /^[789]/.test(digits)) {
    return `+234${digits}`;
  }
  if (hasPlus && digits.length >= 10 && digits.length <= 15) {
    return `+${digits}`;
  }
  return null;
};

export const isValidPhone = (phone: string) => normalizePhone(phone) !== null;

/** Parse "6:00 PM" or "11:30 AM" into 24h hours and minutes */
export function parseTime12(time12: string): { hours: number; minutes: number } | null {
  const match = time12.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  const period = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (period === 'AM') {
    if (hours === 12) hours = 0;
  } else if (hours !== 12) {
    hours += 12;
  }
  return { hours, minutes };
}

export function formatTime12(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export function fromTime24String(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return '6:00 PM';
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return formatTime12(d);
}

export function combineDateAndTime12(dateStr: string, time12: string): Date | null {
  if (!dateStr) return null;
  const parsed = parseTime12(time12);
  if (!parsed) return null;
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  return d;
}

export const HOURS_12 = Array.from({ length: 12 }, (_, i) => String(i + 1));
export const MINUTES = ['00', '15', '30', '45'];
export const PERIODS = ['AM', 'PM'] as const;

export function splitTime12(time12: string): { hour: string; minute: string; period: 'AM' | 'PM' } {
  const parsed = parseTime12(time12);
  if (!parsed) return { hour: '6', minute: '00', period: 'PM' };
  const d = new Date();
  d.setHours(parsed.hours, parsed.minutes, 0, 0);
  const formatted = formatTime12(d);
  const m = formatted.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return { hour: '6', minute: '00', period: 'PM' };
  return { hour: m[1], minute: m[2], period: m[3].toUpperCase() as 'AM' | 'PM' };
}

export function joinTime12(hour: string, minute: string, period: 'AM' | 'PM'): string {
  return `${hour}:${minute} ${period}`;
}

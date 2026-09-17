/** Event-local calendar days (Africa/Lagos) for multi-day passes. */

export const EVENT_TZ = 'Africa/Lagos';

export function ymdInZone(date: Date, timeZone = EVENT_TZ): string {
  if (isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function ymdFromUnknown(value?: string | Date | null): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  return ymdInZone(new Date(value));
}

export function eventDayList(start?: string | Date | null, end?: string | Date | null): string[] {
  const first = ymdFromUnknown(start);
  const last = ymdFromUnknown(end) || first;
  if (!first) return [];
  const days: string[] = [];
  const cursor = new Date(`${first}T12:00:00+01:00`);
  const stop = new Date(`${last}T12:00:00+01:00`);
  if (isNaN(cursor.getTime()) || isNaN(stop.getTime())) return first ? [first] : [];
  while (cursor.getTime() <= stop.getTime() && days.length < 31) {
    days.push(ymdInZone(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days.length ? days : [first];
}

export function shortDayChip(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00+01:00`);
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric' });
}

export function longDayLabel(ymd: string): string {
  const d = new Date(`${ymd}T12:00:00+01:00`);
  return d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** Buyer-facing one-liner. Empty when the event is a single day. */
export function ticketValidityLine(
  validOn: string | Date | null | undefined,
  eventStart?: string | Date | null,
  eventEnd?: string | Date | null
): string {
  const days = eventDayList(eventStart, eventEnd);
  if (days.length <= 1) return '';
  const day = ymdFromUnknown(validOn);
  if (day) return `Only valid ${longDayLabel(day)}.`;
  return days.length === 2 ? 'Both days · one entry each day' : 'All days · one entry each day';
}

export function passDateAndNote(opts: {
  validOn?: string | Date | null;
  eventStart?: string | Date | null;
  eventEnd?: string | Date | null;
}): { dateIso: string; note: string; dateLabel?: string } {
  const days = eventDayList(opts.eventStart, opts.eventEnd);
  const day = ymdFromUnknown(opts.validOn);
  if (day) {
    return {
      dateIso: `${day}T12:00:00+01:00`,
      note: days.length > 1 ? `Only valid ${longDayLabel(day)}.` : '',
    };
  }
  const start = days[0] || ymdFromUnknown(opts.eventStart);
  if (days.length > 1) {
    return {
      dateIso: start ? `${start}T12:00:00+01:00` : String(opts.eventStart || ''),
      dateLabel: `${longDayLabel(days[0])} – ${longDayLabel(days[days.length - 1])}`,
      note: 'Valid every event day. One entry per day.',
    };
  }
  return {
    dateIso: start ? `${start}T12:00:00+01:00` : String(opts.eventStart || ''),
    note: '',
  };
}

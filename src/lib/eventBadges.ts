export type EventUrgencyBadge = {
  text: string;
  className: string;
};

type EventBadgeInput = {
  date?: string | null;
  endDate?: string | null;
  ticketsAvailable?: number;
  hasTicketTypes?: boolean;
  maxBadges?: number;
};

export function isEventPast(date?: string | null, endDate?: string | null): boolean {
  const end = new Date(endDate || date || '');
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

/** Urgency / status badges for event cards and detail pages. */
export function getEventUrgencyBadges({
  date,
  endDate,
  ticketsAvailable,
  hasTicketTypes = false,
  maxBadges = 2,
}: EventBadgeInput): EventUrgencyBadge[] {
  if (isEventPast(date, endDate)) {
    return [
      {
        text: 'Ended',
        className: 'bg-neutral-900/90 text-white dark:bg-neutral-100 dark:text-neutral-900',
      },
    ];
  }

  if (!date) return [];

  const badges: EventUrgencyBadge[] = [];
  const eventDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    badges.push({ text: 'Closes today', className: 'bg-rose-500 text-white' });
  } else if (diffDays === 1) {
    badges.push({ text: 'Closes tomorrow', className: 'bg-rose-500 text-white' });
  } else if (diffDays > 1 && diffDays <= 7) {
    badges.push({ text: 'Sales end soon', className: 'bg-rose-500 text-white' });
  }

  const left = ticketsAvailable;
  if (typeof left === 'number') {
    if (left === 0 && hasTicketTypes) {
      badges.push({
        text: 'Sold out',
        className: 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-neutral-900',
      });
    } else if (left > 0 && left <= 15) {
      badges.push({ text: 'Almost full', className: 'bg-amber-500 text-white' });
    } else if (left > 0 && left <= 50) {
      badges.push({ text: 'Going fast', className: 'bg-indigo-600 text-white' });
    }
  }

  return badges.slice(0, maxBadges);
}

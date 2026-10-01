export type EventUrgencyBadge = {
  text: string;
  className: string;
};

type EventBadgeInput = {
  date?: string | null;
  endDate?: string | null;
  ticketsAvailable?: number | null;
  ticketsUnlimited?: boolean;
  hasTicketTypes?: boolean;
  maxBadges?: number;
};

/** Organizers save unlimited inventory as null or 0. */
export function isUnlimitedTicketQuantity(quantity: number | null | undefined) {
  return quantity == null || Number(quantity) <= 0;
}

export function eventHasUnlimitedTickets(
  ticketTypes?: Array<{ quantity?: number | null; isPaused?: boolean }> | null
) {
  const onSale = (ticketTypes || []).filter((ticket) => !ticket.isPaused);
  const pool = onSale.length ? onSale : ticketTypes || [];
  return pool.some((ticket) => isUnlimitedTicketQuantity(ticket.quantity));
}

export function isEventPast(date?: string | null, endDate?: string | null): boolean {
  const effectiveEnd = (endDate && endDate.trim()) || (date && date.trim()) || '';
  const end = new Date(effectiveEnd);
  return !Number.isNaN(end.getTime()) && end.getTime() < Date.now();
}

/** Urgency / status badges for event cards and detail pages. */
export function getEventUrgencyBadges({
  date,
  endDate,
  ticketsAvailable,
  ticketsUnlimited = false,
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

  const effectiveCloseStr = (endDate && endDate.trim()) || (date && date.trim());
  if (!effectiveCloseStr) return [];

  const closingDate = new Date(effectiveCloseStr);
  if (Number.isNaN(closingDate.getTime())) return [];

  const badges: EventUrgencyBadge[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closingDay = new Date(closingDate);
  closingDay.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (closingDay.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) {
    badges.push({ text: 'Closes today', className: 'bg-rose-500 text-white' });
  } else if (diffDays === 1) {
    badges.push({ text: 'Closes tomorrow', className: 'bg-rose-500 text-white' });
  } else if (diffDays > 1 && diffDays <= 7 && !ticketsUnlimited) {
    badges.push({ text: 'Sales end soon', className: 'bg-rose-500 text-white' });
  }

  const left = ticketsAvailable;
  if (!ticketsUnlimited && typeof left === 'number') {
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

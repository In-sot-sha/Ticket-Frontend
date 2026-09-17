/** Safe numeric ticket price (Prisma/JSON may send string or null). */
export function ticketUnitPrice(price: unknown): number {
  const n = Number(price);
  return Number.isFinite(n) ? n : 0;
}

export function isFreeTicketPrice(price: unknown): boolean {
  return ticketUnitPrice(price) === 0;
}

export function formatTicketPrice(price: unknown): string {
  const n = ticketUnitPrice(price);
  return n === 0 ? 'Free' : `₦${n.toLocaleString()}`;
}

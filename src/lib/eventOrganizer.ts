export type EventPhase = 'draft' | 'upcoming' | 'live' | 'past';

export interface EventStats {
  ticketsSold: number;
  ticketsCheckedIn: number;
  actualRevenue: number;
  expectedRevenue: number;
  capacity: number;
  ticketInventory: number;
  sellThroughPercent: number;
  ticketTypeStats?: Array<{
    id: number;
    name: string;
    price: number;
    quantity: number | null;
    sold: number;
    checkedIn: number;
    revenue: number;
    expectedRevenue: number;
  }>;
}

export interface OrganizerEvent {
  id: number;
  title: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  locationType?: string;
  imageUrl?: string;
  isPublished?: boolean;
  capacity?: number;
  phase?: EventPhase;
  revenue?: number;
  attendees?: number;
  stats?: EventStats;
  ticketTypes?: Array<{ id: number; name: string; price: number; quantity: number | null }>;
  allowVendors?: boolean;
  vendorSettings?: {
    allowVendors: boolean;
    stallTypes: Array<{
      id: string;
      name: string;
      price: number;
      maxStalls: number;
      description?: string;
    }>;
    allowedRoles: string[];
    approvalMode: 'auto' | 'manual' | 'vetted';
    applicationDeadline: number;
  };
}

export function getEventPhase(event: {
  isPublished?: boolean;
  phase?: EventPhase | string;
  startDate?: string;
  endDate?: string;
}): EventPhase {
  if (event.phase && event.phase in PHASE_LABELS) return event.phase as EventPhase;
  if (!event.isPublished) return 'draft';
  if (!event.startDate || !event.endDate) return 'draft';
  const now = new Date();
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  if (now < start) return 'upcoming';
  if (now <= end) return 'live';
  return 'past';
}

export const PHASE_LABELS: Record<EventPhase, string> = {
  draft: 'Draft',
  upcoming: 'Upcoming',
  live: 'Live now',
  past: 'Past',
};

export const PHASE_STYLES: Record<EventPhase, string> = {
  draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  upcoming: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
  live: 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300',
  past: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400',
};

export function formatNaira(amount: number) {
  return `₦${Math.round(amount).toLocaleString()}`;
}

export interface OrganizerAnalyticsSummary {
  totalEvents: number;
  publishedEvents: number;
  draftEvents: number;
  upcomingEvents: number;
  liveEvents: number;
  pastEvents: number;
  ticketsSold: number;
  ticketsCheckedIn: number;
  actualRevenue: number;
  expectedRevenue: number;
  remainingPotential: number;
  sellThroughPercent: number;
  checkInRate: number;
}

export interface MonthlyAnalytics {
  month: string;
  ticketsSold: number;
  revenue: number;
  events: number;
}

export interface TopEventRow {
  id: number;
  title: string;
  startDate: string;
  phase: string;
  ticketsSold: number;
  ticketsCheckedIn: number;
  revenue: number;
  expectedRevenue: number;
}

export interface SaleTransaction {
  id: number;
  eventId: number;
  eventTitle: string;
  ticketType: string;
  amount: number;
  buyerName: string;
  date: string;
  status: 'sold' | 'checked_in';
}

export interface OrganizerAnalytics {
  summary: OrganizerAnalyticsSummary;
  monthly: MonthlyAnalytics[];
  topEvents: TopEventRow[];
  revenueByEvent: Array<{
    id: number;
    title: string;
    revenue: number;
    expectedRevenue: number;
    ticketsSold: number;
    phase: string;
  }>;
  recentSales: SaleTransaction[];
}

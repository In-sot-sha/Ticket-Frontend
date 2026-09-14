import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  MapPin,
  Plus,
  TrendingUp,
  ChevronRight,
  Layers,
  Scan,
  BarChart3,
  Pencil,
  Eye,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { useOrganizerEvents } from '../hooks/queries/useEvents';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../lib/eventOrganizer';

const EventsDashboard = () => {
  // Use React Query hook to fetch organizer's events with caching
  const { data: events = [], isLoading, error } = useOrganizerEvents();

  const totalEvents = events.length;
  const totalSold = events.reduce((sum: number, e: OrganizerEvent) => sum + (e.stats?.ticketsSold ?? e.attendees ?? 0), 0);
  const totalRevenue = events.reduce((sum: number, e: OrganizerEvent) => sum + (e.stats?.actualRevenue ?? e.revenue ?? 0), 0);
  const totalExpected = events.reduce((sum: number, e: OrganizerEvent) => sum + (e.stats?.expectedRevenue ?? 0), 0);

  if (error) {
    return (
      <div>
        <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
              Your <span className="text-rose-500">Events</span>
            </h1>
            <p className="text-[11px] sm:text-xs text-neutral-500 mt-0.5">{totalEvents} total events</p>
          </div>
          <Link to="/organizer/events/create">
            <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs h-8 px-3.5" size="sm">
              <Plus className="h-4 w-4 mr-1.5" />
              <span>Create event</span>
            </Button>
          </Link>
        </div>

        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Failed to load events</p>
          <p className="text-xs text-red-500 dark:text-red-300 mt-2">{error instanceof Error ? error.message : 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-6 text-neutral-900 dark:text-neutral-100">
      {/* Header Bar — Styled like Host Dashboard */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Your <span className="text-rose-500">Events</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Manage your created events, ticket inventory, and live sales metrics.
          </p>
        </div>
        <Link to="/organizer/events/create">
          <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-2xs text-xs h-8 px-3.5">
            <Plus className="h-4 w-4 mr-1.5" />
            <span>Create event</span>
          </Button>
        </Link>
      </div>

      {/* Compact Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
        {[
          {
            label: 'Total Events',
            value: totalEvents,
            blurb: 'Created events',
            icon: <Layers className="h-3.5 w-3.5" />,
            badgeBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
          },
          {
            label: 'Tickets Sold',
            value: totalSold,
            blurb: 'Total attendees',
            icon: <Ticket className="h-3.5 w-3.5" />,
            badgeBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
          },
          {
            label: 'Revenue Earned',
            value: totalRevenue,
            blurb: 'Actual sales earnings',
            isCurrency: true,
            icon: <TrendingUp className="h-3.5 w-3.5" />,
            badgeBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
          },
          {
            label: 'Expected Revenue',
            value: totalExpected,
            blurb: 'Full venue capacity',
            isCurrency: true,
            icon: <Calendar className="h-3.5 w-3.5" />,
            badgeBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 sm:p-3 shadow-2xs flex flex-col justify-between gap-1.5"
          >
            {/* Top Row: Icon Badge & Label */}
            <div className="flex items-center justify-between gap-1.5">
              <div className={`p-1.5 rounded-lg shrink-0 ${stat.badgeBg}`}>
                {stat.icon}
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-400 truncate">
                {stat.label}
              </span>
            </div>

            {/* Bottom Row: Metric Value & Blurb */}
            <div className="min-w-0">
              {isLoading ? (
                <Skeleton className="h-6 w-16 mb-0.5" />
              ) : (
                <p className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-white font-mono">
                  {stat.isCurrency ? formatNaira(stat.value) : String(stat.value)}
                </p>
              )}
              <p className="text-[10px] text-neutral-400 truncate">
                {stat.blurb}
              </p>
            </div>
          </div>
        ))}
      </div>



      {/* Your Listings Grid Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Your Listings</h2>
          <span className="text-xs font-bold text-neutral-500">{events.length} event(s)</span>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/10 p-8 text-center">
            <p className="text-xs text-neutral-500 mb-3">No events created yet.</p>
            <Link to="/organizer/events/create" className="text-xs font-bold text-rose-500 hover:underline">
              + Create your first event
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {isLoading
              ? [...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex h-36"
                  >
                    <Skeleton className="w-28 sm:w-44 md:w-48 h-full shrink-0" />
                    <div className="p-3.5 flex-1 flex flex-col justify-between">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  </div>
                ))
              : events.map((event: OrganizerEvent) => (
                  <CompactEventCard key={event.id} event={event} />
                ))}
          </div>
        )}
      </div>
    </div>
  );
};

function CompactEventCard({ event }: { event: OrganizerEvent }) {
  const cover = resolveImageUrl(event.imageUrl);
  const stats = event.stats;
  const sold = stats?.ticketsSold ?? event.attendees ?? 0;
  const earned = stats?.actualRevenue ?? event.revenue ?? 0;
  const pct = stats?.sellThroughPercent ?? 0;
  const eventPath = `/organizer/events/${event.slug || event.id}`;

  return (
    <div className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-rose-400 dark:hover:border-rose-700 hover:shadow-2xs transition-all flex flex-row h-36 sm:h-40">
      {/* Image Container on Left (Larger & Scaling on Laptop) */}
      <Link to={eventPath} className="w-28 sm:w-40 md:w-44 lg:w-48 shrink-0 bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden block">
        {cover ? (
          <img
            src={cover}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-rose-50 dark:bg-rose-950/20">
            <Calendar className="h-6 w-6 text-rose-300" />
          </div>
        )}
        {/* Sell-through indicator bar at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div className="h-full bg-rose-500" style={{ width: `${pct}%` }} />
        </div>
      </Link>

      {/* Content Area on Right */}
      <div className="flex-1 p-3 sm:p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-center justify-between gap-1.5 mb-1">
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-rose-500 truncate">
              {event.category || 'Event'}
            </span>
            <div className="shrink-0 scale-90 sm:scale-100 origin-right">
              <EventPhaseBadge event={event} />
            </div>
          </div>

          <Link to={eventPath}>
            <h3 className="font-bold text-xs sm:text-base text-neutral-900 dark:text-white line-clamp-1 group-hover:text-rose-500 transition-colors">
              {event.title}
            </h3>
          </Link>

          <div className="mt-1 space-y-0.5">
            <p className="text-[11px] sm:text-xs text-neutral-500 flex items-center gap-1 truncate">
              <Calendar className="h-3 w-3 shrink-0 text-neutral-400" />
              <span>{new Date(event.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </p>
            {event.location && (
              <p className="text-[11px] sm:text-xs text-neutral-500 flex items-center gap-1 truncate">
                <MapPin className="h-3 w-3 shrink-0 text-neutral-400" />
                <span className="truncate">{event.location}</span>
              </p>
            )}
          </div>
        </div>

        {/* Bottom Row: Stats & Action Buttons (Rounded-full, Larger on Laptop) */}
        <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="text-[10px] sm:text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              <strong className="text-neutral-900 dark:text-white font-bold">{sold}</strong> sold
            </span>
            <span className="text-[10px] sm:text-xs font-bold text-rose-500 truncate">
              {formatNaira(earned)}
            </span>
          </div>

          {/* Rounded-full View Button */}
          <div className="flex items-center shrink-0">
            <Link to={`/organizer/events/${event.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="rounded-full text-[10px] sm:text-xs font-semibold h-7 sm:h-8 px-3 sm:px-4 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500"
              >
                <Eye className="h-3 w-3 sm:h-3.5 sm:w-3.5 mr-1 text-rose-500" />
                <span>View</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventsDashboard;

import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Plus,
  Eye,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { useOrganizerEvents } from '../hooks/queries/useEvents';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, getEventPhase, OrganizerEvent, type EventPhase } from '../lib/eventOrganizer';

const PHASE_ORDER: EventPhase[] = ['live', 'upcoming', 'draft', 'past'];

const EventsDashboard = () => {
  const { data: events = [], isLoading, error } = useOrganizerEvents();

  const groups = useMemo(() => {
    const buckets: Record<EventPhase, OrganizerEvent[]> = {
      live: [],
      upcoming: [],
      draft: [],
      past: [],
    };
    for (const event of events) {
      buckets[getEventPhase(event)].push(event);
    }
    for (const phase of PHASE_ORDER) {
      buckets[phase].sort(
        (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
      );
    }
    return PHASE_ORDER
      .map((phase) => ({ phase, events: buckets[phase] }))
      .filter((group) => group.events.length > 0);
  }, [events]);

  const countLabel = `${events.length} event${events.length === 1 ? '' : 's'}`;

  if (error) {
    return (
      <div className="w-full pb-6">
        <PageHead countLabel="" />
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Failed to load events</p>
          <p className="text-xs text-red-500 dark:text-red-300 mt-2">{error instanceof Error ? error.message : 'Please try again later'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full pb-6 text-neutral-900 dark:text-neutral-100">
      <PageHead countLabel={isLoading ? '' : countLabel} />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden flex h-32"
            >
              <Skeleton className="w-28 sm:w-40 h-full shrink-0" />
              <div className="p-3.5 flex-1 flex flex-col justify-between">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-10 text-center">
          <p className="text-sm font-bold text-neutral-900 dark:text-white">No events yet</p>
          <p className="text-xs text-neutral-500 mt-1 mb-4">Create one to start selling tickets.</p>
          <Link to="/organizer/events/create">
            <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs h-9 px-4">
              <Plus className="h-4 w-4 mr-1.5" />
              Create event
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {groups.flatMap((group) => group.events).map((event) => (
            <CompactEventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

function PageHead({ countLabel }: { countLabel: string }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
          Your <span className="text-rose-500">Events</span>
        </h1>
        {countLabel ? (
          <p className="text-xs text-neutral-500 mt-1">{countLabel}</p>
        ) : null}
      </div>
      <Link to="/organizer/events/create" className="shrink-0">
        <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0 text-xs h-9 px-4">
          <Plus className="h-4 w-4 mr-1.5" />
          Create event
        </Button>
      </Link>
    </div>
  );
}

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

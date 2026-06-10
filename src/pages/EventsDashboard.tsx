import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  MapPin,
  Plus,
  TrendingUp,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../lib/eventOrganizer';

const EventsDashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await api.events.getOrganizerEvents({ limit: 50 });
        setEvents(response.data?.events ?? []);
      } catch (err: unknown) {
        console.error('Error fetching events:', err);
        setError((err as Error).message || 'Failed to load events');
      } finally {
        setLoading(false);
      }
    };

    if (user) fetchEvents();
  }, [user]);

  const totalEvents = events.length;
  const totalSold = events.reduce((sum, e) => sum + (e.stats?.ticketsSold ?? e.attendees ?? 0), 0);
  const totalRevenue = events.reduce((sum, e) => sum + (e.stats?.actualRevenue ?? e.revenue ?? 0), 0);
  const totalExpected = events.reduce((sum, e) => sum + (e.stats?.expectedRevenue ?? 0), 0);

  if (loading) {
    return (
      <div className="py-6 flex justify-center items-center">
        <div className="text-lg">Loading events...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-6 flex justify-center items-center">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold">
            Your <span className="text-rose-500">Events</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-0.5">{totalEvents} total</p>
        </div>
        <Link to="/organizer/events/create">
          <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Create event
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Events', value: String(totalEvents), icon: <Calendar className="h-5 w-5" /> },
          { label: 'Tickets sold', value: String(totalSold), icon: <Ticket className="h-5 w-5" /> },
          { label: 'Revenue earned', value: formatNaira(totalRevenue), icon: <TrendingUp className="h-5 w-5" /> },
          { label: 'Expected (max)', value: formatNaira(totalExpected), icon: <TrendingUp className="h-5 w-5" /> },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
          >
            <div className="flex justify-between items-center text-rose-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 dark:border-neutral-700 p-12 text-center">
          <p className="text-neutral-500 mb-4">No events yet.</p>
          <Link to="/organizer/events/create" className="text-rose-500 hover:underline font-medium">
            Create your first event
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
};

function EventCard({ event }: { event: OrganizerEvent }) {
  const cover = resolveImageUrl(event.imageUrl);
  const stats = event.stats;
  const sold      = stats?.ticketsSold     ?? event.attendees ?? 0;
  const checkedIn = stats?.ticketsCheckedIn ?? 0;
  const earned    = stats?.actualRevenue   ?? event.revenue   ?? 0;
  const expected  = stats?.expectedRevenue ?? 0;
  const pct       = stats?.sellThroughPercent ?? 0;

  return (
    <Link
      to={`/organizer/events/${event.id}`}
      className="group rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-rose-300 dark:hover:border-rose-800 hover:shadow-md transition-all"
    >
      {/* Cover image */}
      <div className="aspect-[2/1] bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-8 w-8 text-neutral-300" />
          </div>
        )}
        <div className="absolute top-2.5 right-2.5">
          <EventPhaseBadge event={event} />
        </div>
        {/* Sell-through strip at bottom of image */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div
            className="h-full bg-rose-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="p-3.5 sm:p-4">
        {/* Title */}
        <h3 className="font-bold text-sm leading-tight line-clamp-1 group-hover:text-rose-500 transition-colors mb-2">
          {event.title}
        </h3>

        {/* Date + location */}
        <div className="space-y-1 mb-3">
          <p className="text-xs text-neutral-500 flex items-center gap-1.5">
            <Calendar className="h-3 w-3 shrink-0" />
            {new Date(event.startDate).toLocaleDateString('en-NG', {
              month: 'short', day: 'numeric', year: 'numeric',
            })}
          </p>
          {event.location && (
            <p className="text-xs text-neutral-500 flex items-center gap-1.5 truncate">
              <MapPin className="h-3 w-3 shrink-0" />
              {event.location}
            </p>
          )}
        </div>

        {/* Stats 2×2 grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-3 border-t border-neutral-100 dark:border-neutral-800 text-xs">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Sold</p>
            <p className="font-bold text-neutral-900 dark:text-white">{sold}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Checked in</p>
            <p className="font-bold flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-rose-500" />{checkedIn}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Earned</p>
            <p className="font-bold text-rose-500">{formatNaira(earned)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Potential</p>
            <p className="font-bold text-neutral-600 dark:text-neutral-400">{formatNaira(expected)}</p>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-3 flex items-center justify-end">
          <span className="text-[11px] font-bold text-rose-500 flex items-center gap-0.5">
            View details <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}

export default EventsDashboard;

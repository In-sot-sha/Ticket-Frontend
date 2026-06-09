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
  const sold = stats?.ticketsSold ?? event.attendees ?? 0;
  const checkedIn = stats?.ticketsCheckedIn ?? 0;
  const earned = stats?.actualRevenue ?? event.revenue ?? 0;
  const expected = stats?.expectedRevenue ?? 0;

  return (
    <Link
      to={`/organizer/events/${event.id}`}
      className="group rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden hover:border-rose-300 hover:shadow-md transition-all"
    >
      <div className="aspect-[2/1] bg-neutral-100 dark:bg-neutral-800 relative overflow-hidden">
        {cover ? (
          <img src={cover} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-300">
            <Calendar className="h-10 w-10" />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <EventPhaseBadge event={event} />
        </div>
      </div>

      <div className="p-4">
        <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-rose-500 transition-colors">
          {event.title}
        </h3>
        <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
          <Calendar className="h-3 w-3 shrink-0" />
          {new Date(event.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
        {event.location && (
          <p className="text-xs text-neutral-500 mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            {event.location}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-neutral-100 dark:border-neutral-800">
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Sold</p>
            <p className="text-sm font-bold">{sold}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Checked in</p>
            <p className="text-sm font-bold flex items-center gap-1">
              <UserCheck className="h-3 w-3 text-rose-500" />
              {checkedIn}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Earned</p>
            <p className="text-sm font-bold text-rose-500">{formatNaira(earned)}</p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Expected</p>
            <p className="text-sm font-bold">{formatNaira(expected)}</p>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-rose-500 font-medium">View details</span>
          <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-0.5 transition-all" />
        </div>
      </div>
    </Link>
  );
}

export default EventsDashboard;

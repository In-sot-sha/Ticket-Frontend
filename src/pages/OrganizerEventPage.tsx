import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Ticket,
  Users,
  TrendingUp,
  UserCheck,
  Pencil,
  ExternalLink,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Spinner } from '../components/ui/Spinner';
import { api } from '../services/api';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../lib/eventOrganizer';

const OrganizerEventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    api.events
      .getOrganizerEventById(Number(id))
      .then((res) => setEvent(res.data))
      .catch(() => setError('Could not load event.'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="py-12 text-center">
        <p className="text-rose-500 mb-4">{error || 'Event not found'}</p>
        <Link to="/organizer/events">
          <Button variant="outline" className="rounded-full">Back to events</Button>
        </Link>
      </div>
    );
  }

  const stats = event.stats;
  const cover = resolveImageUrl(event.imageUrl);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const statCards = [
    {
      label: 'Tickets sold',
      value: String(stats?.ticketsSold ?? event.attendees ?? 0),
      sub: stats ? `of ${stats.ticketInventory} available` : undefined,
      icon: <Ticket className="h-5 w-5" />,
    },
    {
      label: 'Checked in',
      value: String(stats?.ticketsCheckedIn ?? 0),
      sub: stats?.ticketsSold ? `${Math.round(((stats.ticketsCheckedIn ?? 0) / stats.ticketsSold) * 100) || 0}% of sold` : 'No sales yet',
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      label: 'Revenue earned',
      value: formatNaira(stats?.actualRevenue ?? event.revenue ?? 0),
      sub: 'From ticket sales',
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      label: 'Expected revenue',
      value: formatNaira(stats?.expectedRevenue ?? 0),
      sub: stats ? `${stats.sellThroughPercent}% sold` : 'If all tickets sell',
      icon: <Users className="h-5 w-5" />,
    },
  ];

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between gap-4">
        <Link
          to="/organizer/events"
          className="flex items-center gap-2 text-sm text-neutral-500 hover:text-rose-500 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All events
        </Link>
        <div className="flex gap-2">
          <Link to={`/events/${event.id}`} target="_blank">
            <Button variant="outline" size="sm" className="rounded-full text-xs">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Public page
            </Button>
          </Link>
          <Link to={`/organizer/events/create/${event.id}`}>
            <Button size="sm" className="rounded-full text-xs bg-rose-500 hover:bg-rose-600 text-white border-0">
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 mb-8">
        {cover && (
          <div className="aspect-[3/1] max-h-48 overflow-hidden">
            <img src={cover} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <h1 className="text-xl md:text-2xl font-bold">{event.title}</h1>
            <EventPhaseBadge event={event} />
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-neutral-500">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {start.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
              {' · '}
              {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' – '}
              {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
            </span>
            {event.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div
            key={card.label}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4"
          >
            <div className="flex items-center justify-between text-rose-500 mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{card.label}</span>
              {card.icon}
            </div>
            <p className="text-xl font-bold">{card.value}</p>
            {card.sub && <p className="text-[11px] text-neutral-500 mt-1">{card.sub}</p>}
          </div>
        ))}
      </div>

      {stats?.ticketTypeStats && stats.ticketTypeStats.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-semibold">Sales by ticket type</h2>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {stats.ticketTypeStats.map((tt) => (
              <div key={tt.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <p className="font-medium text-sm">{tt.name}</p>
                  <p className="text-xs text-neutral-500 mt-0.5">
                    {tt.price === 0 ? 'Free' : formatNaira(tt.price)} · {tt.quantity ?? 0} available
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div>
                    <span className="text-neutral-400 text-xs block">Sold</span>
                    <span className="font-semibold">{tt.sold}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Checked in</span>
                    <span className="font-semibold">{tt.checkedIn}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Earned</span>
                    <span className="font-semibold text-rose-500">{formatNaira(tt.revenue)}</span>
                  </div>
                  <div>
                    <span className="text-neutral-400 text-xs block">Potential</span>
                    <span className="font-semibold">{formatNaira(tt.expectedRevenue)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerEventPage;

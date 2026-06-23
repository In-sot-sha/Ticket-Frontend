import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket as TicketIcon,
  CreditCard,
  Plus,
  Eye,
  BarChart3,
  Users,
  ChevronRight,
  Scan,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/skeleton';
import { useAuth } from '../context/AuthContext';
import { useOrganizerEvents } from '../hooks/queries/useEvents';
import { resolveImageUrl } from '../lib/media';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../lib/eventOrganizer';

const OrganizerDashboard = () => {
  const { user } = useAuth();
  
  // Use React Query hooks for data fetching with caching
  const { data: events = [], isLoading, error } = useOrganizerEvents();

  const liveEvents = events.filter((e: OrganizerEvent) => e.phase === 'live' || e.phase === 'upcoming').length;
  const totalTickets = events.reduce((sum: number, e: OrganizerEvent) => sum + (e.stats?.ticketsSold ?? e.attendees ?? 0), 0);
  const totalRevenue = events.reduce((sum: number, e: OrganizerEvent) => sum + (e.stats?.actualRevenue ?? e.revenue ?? 0), 0);

  const formatEventDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-NG', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

  const hasError = error && !isLoading;

  return (
    <div className=" sm:py-2 sm:px-2 max-w-7xl mx-auto  text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4 sm:pb-6">
        <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
          Hosting <span className="text-rose-500">Dashboard</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Welcome back, {user?.firstName}! Manage your events in one place.
        </p>
      </div>

      {/* Stats — 2 columns on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-8">
        {[
          { label: 'Live Events', value: liveEvents, icon: <Calendar className="h-4 w-4" />, change: `${events.length} total` },
          { label: 'Tickets Sold', value: totalTickets, icon: <TicketIcon className="h-4 w-4" />, change: 'All events' },
          { label: 'Total Events', value: events.length, icon: <Users className="h-4 w-4" />, change: 'Incl. drafts' },
          { label: 'Revenue', value: totalRevenue, icon: <CreditCard className="h-4 w-4" />, change: 'Ticket sales' },
        ].map((stat, i) => (
          <div
            key={i}
            className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-3 sm:p-5 bg-white dark:bg-neutral-900 shadow-sm"
          >
            <div className="flex justify-between items-center text-neutral-400 dark:text-neutral-500 mb-1.5 sm:mb-2">
              <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider leading-tight">{stat.label}</span>
              {stat.icon}
            </div>
            {isLoading ? (
              <>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-2 w-32" />
              </>
            ) : hasError ? (
              <p className="text-xs text-red-500 font-semibold">Unable to load</p>
            ) : (
              <>
                <p className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight">
                  {stat.label === 'Revenue' ? `₦${stat.value.toLocaleString()}` : String(stat.value)}
                </p>
                <p className="text-[10px] font-semibold text-neutral-450 dark:text-neutral-500 mt-1 leading-tight">{stat.change}</p>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-extrabold tracking-tight">Your Listings</h2>
            <Link to="events" className="text-xs font-bold text-rose-500 hover:underline">
              View all
            </Link>
          </div>

          <div className="border border-neutral-150 dark:border-neutral-900 rounded-2xl overflow-hidden divide-y divide-neutral-150 dark:divide-neutral-900">
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <div key={i} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <Skeleton className="w-16 h-16 rounded-xl shrink-0" />
                    <div className="flex-1 space-y-2 min-w-0">
                      <Skeleton className="h-4 w-40 mb-1" />
                      <Skeleton className="h-3 w-48 mb-2" />
                      <Skeleton className="h-3 w-56" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <Skeleton className="h-9 w-20 rounded-full" />
                    <Skeleton className="h-9 w-16 rounded-full" />
                  </div>
                </div>
              ))
            ) : hasError ? (
              <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20">
                <p className="text-sm text-rose-600 dark:text-rose-400 font-semibold">Failed to load events</p>
                <p className="text-xs text-rose-500 dark:text-rose-300 mt-1">{error instanceof Error ? error.message : 'Please try again later'}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-neutral-500 mb-4">No events yet. Create your first listing!</p>
                <Link to="events/create">
                  <Button className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0">
                    <Plus className="h-4 w-4 mr-2" />
                    Create event
                  </Button>
                </Link>
              </div>
            ) : (
              events.slice(0, 5).map((event: OrganizerEvent) => {
                const cover = resolveImageUrl(event.imageUrl);
                const sold = event.stats?.ticketsSold ?? event.attendees ?? 0;
                const earned = event.stats?.actualRevenue ?? event.revenue ?? 0;
                return (
                  <div
                    key={event.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-neutral-900 hover:bg-neutral-50/50 dark:hover:bg-neutral-850/50 transition-colors"
                  >
                    <Link to={`/organizer/events/${event.id}`} className="flex items-center gap-4 flex-1 min-w-0">
                      {cover ? (
                        <img
                          src={cover}
                          alt={event.title}
                          className="w-16 h-16 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h3 className="font-bold text-sm leading-tight text-neutral-900 dark:text-white truncate">{event.title}</h3>
                        <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                          {formatEventDate(event.startDate)} · {event.location || (event.locationType === 'online' ? 'Online' : 'TBD')}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1.5">
                          <EventPhaseBadge event={event} />
                          <span className="text-[10px] text-neutral-500">
                            {sold} sold · {formatNaira(earned)}
                          </span>
                        </div>
                      </div>
                    </Link>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <Link to={`/organizer/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold px-4">
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Stats
                        </Button>
                      </Link>
                      <Link to={`/organizer/events/create/${event.id}`}>
                        <Button size="sm" className="rounded-full text-xs font-semibold px-4 bg-rose-500 hover:bg-rose-600 text-white border-0">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-extrabold tracking-tight">Quick actions</h2>

          <div className="grid grid-cols-1 gap-4">
            <Link
              to="events/create"
              className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-neutral-900"
            >
              <div className="h-10 w-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center mb-3">
                <Plus className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Create new event</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                Pick a template and publish in minutes
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

            {/* Scan Tickets shortcut */}
            <Link to="scan" className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 dark:hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-neutral-900">
              <div className="h-10 w-10 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full flex items-center justify-center mb-3">
                <Scan className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Scan Tickets</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">Verify attendee tickets at the gate</p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>


            <Link
              to="events"
              className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-neutral-900"
            >
              <div className="h-10 w-10 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">Manage events</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                Edit, publish, or view your listings
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>

            <Link
              to="analytics"
              className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-5 hover:border-rose-500/50 hover:shadow-sm transition-all group relative bg-white dark:bg-neutral-900"
            >
              <div className="h-10 w-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-sm">View analytics</h3>
              <p className="text-xs text-neutral-450 dark:text-neutral-500 mt-0.5">
                Track sales and attendance
              </p>
              <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-300 group-hover:text-rose-500 group-hover:translate-x-1 transition-all" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

const Dashboard = ({ context }: { context?: 'user' | 'organizer' | 'vendor' }) => {
  return <OrganizerDashboard />;
};

export default Dashboard;

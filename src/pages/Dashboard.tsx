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
    <div className="max-w-7xl mx-auto space-y-4 text-neutral-900 dark:text-neutral-100 pb-6">
      {/* Streamlined Header Bar */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800 pb-2 mb-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Hosting <span className="text-rose-500">Dashboard</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Welcome back, {user?.firstName || 'Host'}! Overview of your events & sales.
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
            label: 'Live Events',
            value: liveEvents,
            blurb: `${events.length} total events`,
            icon: <Calendar className="h-3.5 w-3.5" />,
            badgeBg: 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400',
          },
          {
            label: 'Tickets Sold',
            value: totalTickets,
            blurb: 'Across all listings',
            icon: <TicketIcon className="h-3.5 w-3.5" />,
            badgeBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400',
          },
          {
            label: 'Total Events',
            value: events.length,
            blurb: 'Includes draft pages',
            icon: <Users className="h-3.5 w-3.5" />,
            badgeBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400',
          },
          {
            label: 'Total Revenue',
            value: totalRevenue,
            blurb: 'Actual sales earned',
            isCurrency: true,
            icon: <CreditCard className="h-3.5 w-3.5" />,
            badgeBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400',
          },
        ].map((stat, i) => (
          <div
            key={i}
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
              ) : hasError ? (
                <p className="text-xs text-rose-500 font-semibold">Error</p>
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

      {/* Main Content Split: Listings Left (2 Cols on Laptop), Quick Actions Right (1 Col on Laptop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 items-start">
        {/* Left Column: Your Listings (Bigger & More Spaced on Laptop) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Your Listings</h2>
            <Link to="events" className="text-xs font-bold text-rose-500 hover:underline">
              View all ({events.length})
            </Link>
          </div>

          <div className="border border-neutral-200/80 dark:border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            {isLoading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <Skeleton className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl shrink-0" />
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-16 rounded-full shrink-0" />
                </div>
              ))
            ) : hasError ? (
              <div className="p-6 text-center bg-rose-50/50 dark:bg-rose-950/20">
                <p className="text-xs font-bold text-rose-600 dark:text-rose-400">Failed to load events</p>
                <p className="text-[11px] text-rose-500 mt-0.5">{error instanceof Error ? error.message : 'Please try again later'}</p>
              </div>
            ) : events.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-xs sm:text-sm text-neutral-500 mb-3">No events created yet.</p>
                <Link to="/organizer/events/create">
                  <Button size="sm" className="rounded-full bg-rose-500 hover:bg-rose-600 text-white text-xs px-4">
                    <Plus className="h-3.5 w-3.5 mr-1" />
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
                    className="p-3.5 sm:p-4 flex items-center justify-between gap-3 hover:bg-neutral-50/60 dark:hover:bg-neutral-800/40 transition-colors min-w-0"
                  >
                    <Link to={`/organizer/events/${event.id}`} className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                      {cover ? (
                        <img
                          src={cover}
                          alt={event.title}
                          className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-neutral-100 dark:border-neutral-800 shrink-0"
                        />
                      ) : (
                        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-neutral-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center">
                          <Calendar className="h-6 w-6 text-neutral-400" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-xs sm:text-sm md:text-base text-neutral-900 dark:text-white truncate">{event.title}</h3>
                          <div className="shrink-0 scale-90 origin-left">
                            <EventPhaseBadge event={event} />
                          </div>
                        </div>
                        <p className="text-[11px] sm:text-xs text-neutral-450 dark:text-neutral-500 mt-0.5 truncate">
                          {formatEventDate(event.startDate)} · {event.location || (event.locationType === 'online' ? 'Online' : 'TBD')}
                        </p>
                        <p className="text-[10px] sm:text-xs font-semibold text-neutral-500 mt-0.5">
                          <strong className="text-neutral-800 dark:text-neutral-200">{sold}</strong> sold · <span className="text-rose-500 font-bold">{formatNaira(earned)}</span>
                        </p>
                      </div>
                    </Link>

                    <div className="flex items-center shrink-0">
                      <Link to={`/organizer/events/${event.id}`}>
                        <Button variant="outline" size="sm" className="rounded-full text-xs font-semibold h-8 px-3.5 sm:px-4 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500">
                          <Eye className="h-3.5 w-3.5 mr-1 text-rose-500" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Quick Actions (More rounded, Bigger on Laptops) */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Quick Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5 sm:gap-3">
            <Link
              to="/organizer/events/create"
              className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 lg:p-4.5 hover:border-rose-400 dark:hover:border-rose-700 shadow-2xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-rose-50 text-rose-500 dark:bg-rose-950/40 shrink-0">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">Create Event</p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 truncate">New event page</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-rose-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="scan"
              className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 lg:p-4.5 hover:border-purple-400 dark:hover:border-purple-700 shadow-2xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-purple-50 text-purple-500 dark:bg-purple-950/40 shrink-0">
                  <Scan className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">Scan Gate</p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 truncate">Verify tickets</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-purple-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="events"
              className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 lg:p-4.5 hover:border-blue-400 dark:hover:border-blue-700 shadow-2xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-blue-50 text-blue-500 dark:bg-blue-950/40 shrink-0">
                  <Calendar className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">Manage Events</p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 truncate">View all listings</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-blue-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <Link
              to="analytics"
              className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4 lg:p-4.5 hover:border-emerald-400 dark:hover:border-emerald-700 shadow-2xs transition-all flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-500 dark:bg-emerald-950/40 shrink-0">
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">Analytics</p>
                  <p className="text-[11px] sm:text-xs text-neutral-400 truncate">Sales breakdown</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-neutral-300 group-hover:text-emerald-500 shrink-0 transition-transform group-hover:translate-x-0.5" />
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

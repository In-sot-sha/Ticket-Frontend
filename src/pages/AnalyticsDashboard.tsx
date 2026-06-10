import React from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Ticket,
  UserCheck,
  TrendingUp,
  BarChart3,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';

const AnalyticsDashboard = () => {
  const { data, loading, error } = useOrganizerAnalytics();

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="py-12 text-center text-rose-500">{error || 'No data available'}</div>
    );
  }

  const { summary, monthly, topEvents, recentSales } = data;
  const maxTickets = Math.max(...monthly.map((m) => m.ticketsSold), 1);
  const maxEvents = Math.max(...monthly.map((m) => m.events), 1);

  const stats = [
    {
      title: 'Total events',
      value: String(summary.totalEvents),
      sub: `${summary.liveEvents} live · ${summary.upcomingEvents} upcoming`,
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: 'Tickets sold',
      value: summary.ticketsSold.toLocaleString(),
      sub: `${summary.sellThroughPercent}% of potential revenue`,
      icon: <Ticket className="h-5 w-5" />,
    },
    {
      title: 'Revenue earned',
      value: formatNaira(summary.actualRevenue),
      sub: `${formatNaira(summary.expectedRevenue)} max potential`,
      icon: <TrendingUp className="h-5 w-5" />,
    },
    {
      title: 'Checked in',
      value: summary.ticketsCheckedIn.toLocaleString(),
      sub: `${summary.checkInRate}% of sold tickets`,
      icon: <UserCheck className="h-5 w-5" />,
    },
  ];

  return (
    <div className="pb-8 px-1">
      <div className="mb-5">
        <h1 className="text-xl sm:text-2xl font-bold">
          <span className="text-rose-500">Analytics</span>
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Real insights from your ticket sales</p>
      </div>

      {/* Stats — 2 cols on mobile, 4 on lg */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-5"
          >
            <div className="flex justify-between items-center text-rose-500 mb-2 sm:mb-3">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-neutral-400 leading-tight">{stat.title}</span>
              {stat.icon}
            </div>
            <p className="text-xl sm:text-2xl font-bold">{stat.value}</p>
            <p className="text-[10px] sm:text-xs text-neutral-500 mt-1 leading-tight">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* Bar chart — scrollable horizontally on small screens */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <BarChart3 className="h-5 w-5 text-rose-500" />
            <h2 className="text-sm font-semibold">Last 6 months</h2>
          </div>
          <div className="overflow-x-auto -mx-2 px-2">
            <div className="min-w-[280px]">
              <div className="h-44 sm:h-52 flex items-end gap-1 sm:gap-2 justify-between border-b border-neutral-100 dark:border-neutral-800 pb-2">
                {monthly.map((m) => (
                  <div key={m.month} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                    <div className="flex items-end gap-0.5 h-36 sm:h-40 w-full justify-center">
                      <div
                        className="w-2.5 sm:w-3 rounded-t bg-rose-200 dark:bg-rose-900/50"
                        style={{ height: `${(m.events / maxEvents) * 100}%`, minHeight: m.events ? 4 : 0 }}
                        title={`${m.events} events`}
                      />
                      <div
                        className="w-2.5 sm:w-3 rounded-t bg-rose-500"
                        style={{ height: `${(m.ticketsSold / maxTickets) * 100}%`, minHeight: m.ticketsSold ? 4 : 0 }}
                        title={`${m.ticketsSold} tickets`}
                      />
                    </div>
                    <span className="text-[8px] sm:text-[9px] text-neutral-400 truncate w-full text-center">{m.month}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 sm:gap-4 mt-3 text-xs text-neutral-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-200 dark:bg-rose-900/50 shrink-0" /> Events
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-rose-500 shrink-0" /> Tickets sold
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6">
          <h2 className="text-sm font-semibold mb-4">Top events by revenue</h2>
          {topEvents.length === 0 ? (
            <p className="text-sm text-neutral-500">No sales yet. Publish an event to start tracking.</p>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {topEvents.map((event, i) => (
                <Link
                  key={event.id}
                  to={`/organizer/events/${event.id}`}
                  className="flex items-center justify-between gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    <span className="text-xs font-bold text-rose-500 w-4 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-rose-500">{event.title}</p>
                      <p className="text-xs text-neutral-500 truncate">
                        {new Date(event.startDate).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                        {' · '}{event.ticketsSold} sold
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-rose-500">{formatNaira(event.revenue)}</p>
                    <EventPhaseBadge event={event} className="mt-1" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-6">
        <h2 className="text-sm font-semibold mb-4">Recent ticket sales</h2>
        {recentSales.length === 0 ? (
          <p className="text-sm text-neutral-500">No ticket purchases recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {recentSales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-start justify-between gap-3 sm:gap-4 pb-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 last:pb-0"
              >
                <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                  <div className="p-1.5 sm:p-2 rounded-full bg-rose-50 dark:bg-rose-950/30 text-rose-500 shrink-0">
                    <Ticket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm leading-snug">
                      <span className="font-medium">{sale.buyerName}</span>
                      {' · '}
                      <span className="font-medium">{sale.ticketType}</span>
                      {' · '}
                      <Link to={`/organizer/events/${sale.eventId}`} className="font-medium text-rose-500 hover:underline truncate">
                        {sale.eventTitle}
                      </Link>
                    </p>
                    <p className="text-[10px] sm:text-xs text-neutral-500 mt-0.5">
                      {new Date(sale.date).toLocaleString('en-NG')}
                      {sale.status === 'checked_in' && ' · Checked in'}
                    </p>
                  </div>
                </div>
                <span className="text-xs sm:text-sm font-semibold text-rose-500 shrink-0">
                  {sale.amount === 0 ? 'Free' : formatNaira(sale.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
        <Link
          to="/organizer/events"
          className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium mt-4 hover:underline"
        >
          View all events <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;

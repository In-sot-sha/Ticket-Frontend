import React from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  BarChart3,
  Ticket,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '../components/ui/Spinner';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';

const FinanceDashboard = () => {
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

  const { summary, revenueByEvent, recentSales, monthly } = data;
  const maxRevenue = Math.max(...monthly.map((m) => m.revenue), 1);

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Finance <span className="text-rose-500">Dashboard</span>
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ticket revenue across all your events</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Revenue earned</span>
            <TrendingUp className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold text-rose-500">{formatNaira(summary.actualRevenue)}</p>
          <p className="text-xs text-neutral-500 mt-1">From {summary.ticketsSold} tickets sold</p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Max potential</span>
            <BarChart3 className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold">{formatNaira(summary.expectedRevenue)}</p>
          <p className="text-xs text-neutral-500 mt-1">If every ticket sells</p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Still available</span>
            <CreditCard className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold">{formatNaira(summary.remainingPotential)}</p>
          <p className="text-xs text-neutral-500 mt-1">{summary.sellThroughPercent}% of potential reached</p>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
          <div className="flex justify-between items-center mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Avg per event</span>
            <Calendar className="h-5 w-5 text-rose-500" />
          </div>
          <p className="text-2xl font-bold">
            {formatNaira(summary.publishedEvents > 0 ? summary.actualRevenue / summary.publishedEvents : 0)}
          </p>
          <p className="text-xs text-neutral-500 mt-1">{summary.publishedEvents} published events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link
          to="/organizer/events"
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-rose-300 transition-colors group"
        >
          <Calendar className="h-6 w-6 text-rose-500 mb-3" />
          <h3 className="font-semibold text-sm group-hover:text-rose-500">Manage events</h3>
          <p className="text-xs text-neutral-500 mt-1">View per-event sales breakdown</p>
        </Link>
        <Link
          to="/organizer/analytics"
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-rose-300 transition-colors group"
        >
          <BarChart3 className="h-6 w-6 text-rose-500 mb-3" />
          <h3 className="font-semibold text-sm group-hover:text-rose-500">Analytics</h3>
          <p className="text-xs text-neutral-500 mt-1">Trends and top performers</p>
        </Link>
        <Link
          to="/organizer/events/create"
          className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 hover:border-rose-300 transition-colors group"
        >
          <Ticket className="h-6 w-6 text-rose-500 mb-3" />
          <h3 className="font-semibold text-sm group-hover:text-rose-500">Create event</h3>
          <p className="text-xs text-neutral-500 mt-1">Add a new revenue stream</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Monthly revenue</h2>
          <div className="h-44 flex items-end gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
            {monthly.map((m) => (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full max-w-[2rem] rounded-t bg-rose-500 mx-auto"
                  style={{ height: `${(m.revenue / maxRevenue) * 100}%`, minHeight: m.revenue ? 4 : 0 }}
                  title={formatNaira(m.revenue)}
                />
                <span className="text-[9px] text-neutral-400 truncate w-full text-center">{m.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Revenue by event</h2>
          {revenueByEvent.length === 0 ? (
            <p className="text-sm text-neutral-500">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {revenueByEvent.slice(0, 8).map((e) => (
                <Link
                  key={e.id}
                  to={`/organizer/events/${e.id}`}
                  className="flex items-center justify-between gap-2 py-2 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:text-rose-500"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <span className="text-sm truncate">{e.title}</span>
                    <EventPhaseBadge event={e} />
                  </div>
                  <span className="text-sm font-semibold shrink-0">{formatNaira(e.revenue)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Recent income</h2>
          <span className="text-xs text-neutral-500">Ticket purchases</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Event</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Ticket</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Buyer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentSales.map((tx) => (
                  <tr key={tx.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-6 py-3 text-sm">
                      <Link to={`/organizer/events/${tx.eventId}`} className="font-medium hover:text-rose-500">
                        {tx.eventTitle}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{tx.ticketType}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{tx.buyerName}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">
                      {new Date(tx.date).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-6 py-3 text-sm font-semibold text-right text-rose-500">
                      {tx.amount === 0 ? 'Free' : `+${formatNaira(tx.amount)}`}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-neutral-100 dark:border-neutral-800">
          <Link to="/organizer/analytics" className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium hover:underline">
            Full analytics <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

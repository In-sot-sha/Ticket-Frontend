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
import { Skeleton } from '../components/ui/skeleton';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';

const FinanceDashboard = () => {
  const { data, loading, error } = useOrganizerAnalytics();

  if (error || (!loading && !data)) {
    return (
      <div className="pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Finance <span className="text-rose-500">Dashboard</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ticket revenue across all your events</p>
        </div>

        {/* Show stats structure with error message */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
              <div className="flex justify-between items-center mb-3">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-5 w-5 rounded-full" />
              </div>
              <p className="text-xs text-red-500 font-semibold">Failed to load</p>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center mb-6">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Unable to load finance data</p>
          <p className="text-xs text-red-500 dark:text-red-300 mt-2">{error || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { summary = {}, revenueByEvent = [], recentSales = [], monthly = [] } = data || {};
  const summaryData = summary as any;
  const maxRevenue = Math.max(...(monthly?.map((m: any) => m.revenue) || [1]), 1);

  return (
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="text-xl sm:text-3xl font-bold">
          Finance <span className="text-rose-500">Dashboard</span>
        </h1>
        <p className="text-sm text-neutral-500 mt-1">Ticket revenue across all your events</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          {
            title: 'Revenue earned',
            value: summaryData.actualRevenue || 0,
            sub: `From ${summaryData.ticketsSold || 0} tickets sold`,
            icon: <TrendingUp className="h-5 w-5 text-rose-500" />,
          },
          {
            title: 'Max potential',
            value: summaryData.expectedRevenue || 0,
            sub: 'If every ticket sells',
            icon: <BarChart3 className="h-5 w-5 text-rose-500" />,
          },
          {
            title: 'Still available',
            value: summaryData.remainingPotential || 0,
            sub: `${summaryData.sellThroughPercent || 0}% of potential reached`,
            icon: <CreditCard className="h-5 w-5 text-rose-500" />,
          },
          {
            title: 'Avg per event',
            value: (summaryData.publishedEvents || 0) > 0 ? summaryData.actualRevenue / summaryData.publishedEvents : 0,
            sub: `${summaryData.publishedEvents || 0} published events`,
            icon: <Calendar className="h-5 w-5 text-rose-500" />,
          },
        ].map((stat) => (
          <div key={stat.title} className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">{stat.title}</span>
              {stat.icon}
            </div>
            {loading ? (
              <>
                <Skeleton className="h-7 w-32 mb-2" />
                <Skeleton className="h-2 w-40" />
              </>
            ) : (
              <>
                <p className="text-2xl font-bold">{formatNaira(stat.value)}</p>
                <p className="text-xs text-neutral-500 mt-1">{stat.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Quick actions */}
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
        {/* Monthly revenue chart */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Monthly revenue</h2>
          {loading ? (
            <div className="flex items-end gap-2 justify-between h-44 pb-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${40 + Math.random() * 60}%` }} />
              ))}
            </div>
          ) : (
            <div className="h-44 flex items-end gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
              {monthly.map((m: any) => (
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
          )}
        </div>

        {/* Revenue by event */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Revenue by event</h2>
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : revenueByEvent.length === 0 ? (
            <p className="text-sm text-neutral-500">No revenue recorded yet.</p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {revenueByEvent.slice(0, 8).map((e: any) => (
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

      {/* Recent income table */}
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
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentSales.map((tx: any) => (
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

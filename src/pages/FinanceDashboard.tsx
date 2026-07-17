import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  Calendar,
  BarChart3,
  Ticket,
  ChevronRight,
  Banknote,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';
import { api } from '../services/api';

const FinanceDashboard = () => {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useOrganizerAnalytics();

  // Ledger state
  const [ledgerData, setLedgerData] = useState<any>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState('');

  // Withdrawal form state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLedger = () => {
    setLedgerLoading(true);
    api.finance.getBalance()
      .then((res) => {
        setLedgerData(res.data);
        setLedgerError('');
      })
      .catch((err) => {
        console.error('Failed to load balance ledger:', err);
        setLedgerError(err?.response?.data?.message || 'Failed to load balance ledger');
      })
      .finally(() => setLedgerLoading(false));
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setFormMsg({ type: 'error', text: 'Please enter a valid amount.' });
      return;
    }

    setSubmitting(true);
    setFormMsg(null);
    try {
      const res = await api.finance.requestPayout(amount);
      setFormMsg({ type: 'success', text: res.data.message || 'Withdrawal request submitted successfully.' });
      setPayoutAmount('');
      fetchLedger(); // Reload ledger balance and payouts list
    } catch (err: any) {
      setFormMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Error processing payout request. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (analyticsError || ledgerError) {
    return (
      <div className="pb-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            Finance <span className="text-rose-500">Dashboard</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ticket revenue across all your events</p>
        </div>

        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 p-6 text-center mb-6">
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Unable to load finance data</p>
          <p className="text-xs text-red-500 dark:text-red-300 mt-2">{analyticsError || ledgerError || 'No data available'}</p>
        </div>
      </div>
    );
  }

  const { summary = {}, revenueByEvent = [], recentSales = [], monthly = [] } = analyticsData || {};
  const summaryData = summary as any;
  const maxRevenue = Math.max(...(monthly?.map((m: any) => m.revenue) || [1]), 1);

  return (
    <div className="pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">
            Finance <span className="text-rose-500">Dashboard</span>
          </h1>
          <p className="text-sm text-neutral-500 mt-1">Ticket revenue across all your events</p>
        </div>
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
            {analyticsLoading ? (
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

      {/* Ledger & Withdrawal Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Available Balance & Request Withdrawal Form */}
        <div className="lg:col-span-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Banknote className="h-4 w-4 text-rose-500" />
                Available Balance Ledger
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-md">
                Settled Funds Only
              </span>
            </div>

            {ledgerLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <div className="grid grid-cols-3 gap-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <p className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white">
                    {formatNaira(ledgerData?.availableBalance || 0)}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">
                    Settled revenue available for immediate withdrawal to your configured bank account.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Total Earnings</span>
                    <p className="text-base font-bold text-neutral-850 dark:text-white mt-0.5">{formatNaira(ledgerData?.totalEarnings || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Already Paid Out</span>
                    <p className="text-base font-bold text-neutral-850 dark:text-white mt-0.5">{formatNaira(ledgerData?.totalPaidOut || 0)}</p>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase font-bold text-neutral-400">Pending Requests</span>
                    <p className="text-base font-bold text-neutral-850 dark:text-white mt-0.5">{formatNaira(ledgerData?.totalPending || 0)}</p>
                  </div>
                </div>
              </>
            )}
          </div>

          {!ledgerLoading && (
            <div className="border-t border-neutral-100 dark:border-neutral-850 pt-5">
              {/* Form lock verification */}
              {!ledgerData?.bankSettings?.payoutAccountNumber ? (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 flex gap-3 items-start">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">Bank credentials missing</p>
                    <p className="text-[11px] text-amber-600/90 dark:text-amber-500/80 mt-0.5">
                      Please configure your settlement bank credentials in the settings dashboard first.
                    </p>
                    <Link to="/organizer/organizer-settings?tab=payouts" className="inline-block mt-2 text-[11px] font-bold text-amber-700 hover:underline">
                      Go to Settlement Settings &rarr;
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestPayout} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">₦</span>
                      <input
                        type="number"
                        min="500"
                        step="any"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Enter withdrawal amount (e.g. 50000)"
                        disabled={submitting || (ledgerData?.availableBalance || 0) < 500}
                        className="w-full pl-8 pr-4 py-3 bg-neutral-50 dark:bg-gray-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={submitting || !payoutAmount || (ledgerData?.availableBalance || 0) < parseFloat(payoutAmount)}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-extrabold text-xs uppercase tracking-wider shadow-md hover:from-rose-600 hover:to-pink-700 transition-colors disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center gap-2 shrink-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing...
                        </>
                      ) : (
                        'Submit Request'
                      )}
                    </button>
                  </div>

                  {formMsg && (
                    <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                      formMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-950/20 text-red-500'
                    }`}>
                      {formMsg.type === 'success' ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                      {formMsg.text}
                    </div>
                  )}
                </form>
              )}
            </div>
          )}
        </div>

        {/* Bank Credentials Snapshot */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-rose-500" />
                Settlement Details
              </h2>
              <Link to="/organizer/profile" className="text-[11px] font-bold text-rose-500 hover:underline">
                Settings
              </Link>
            </div>

            {ledgerLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : !ledgerData?.bankSettings?.payoutAccountNumber ? (
              <p className="text-xs text-neutral-500 mt-2">No bank settlement account configured.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Settlement Bank</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    {ledgerData.bankSettings.payoutBankName}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account Number</p>
                  <p className="text-sm font-mono font-bold text-neutral-900 dark:text-white mt-0.5">
                    {ledgerData.bankSettings.payoutAccountNumber}
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-100 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
                  <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Account Holder Name</p>
                  <p className="text-sm font-bold text-neutral-900 dark:text-white mt-0.5">
                    {ledgerData.bankSettings.payoutAccountName}
                  </p>
                </div>
              </div>
            )}
          </div>

          {!ledgerLoading && ledgerData?.bankSettings?.payoutAccountNumber && (
            <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-850">
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Payout Schedule</span>
              <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-300 mt-0.5 uppercase">
                {ledgerData.bankSettings.payoutSchedule || 'MANUAL'}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Monthly revenue chart */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Monthly revenue</h2>
          {analyticsLoading ? (
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
          {analyticsLoading ? (
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

      {/* Payout History Ledger logs */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Withdrawal History</h2>
          <span className="text-xs text-neutral-500">Payout requests to settlement accounts</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Reference</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Settlement Bank</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Account</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ledgerLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-24" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-32" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-28" /></td>
                    <td className="px-6 py-3"><Skeleton className="h-4 w-20" /></td>
                    <td className="px-6 py-3 text-right"><Skeleton className="h-4 w-20 ml-auto" /></td>
                  </tr>
                ))
              ) : !ledgerData?.payouts?.length ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No withdrawals requested yet.
                  </td>
                </tr>
              ) : (
                ledgerData.payouts.map((po: any) => (
                  <tr key={po.id} className="hover:bg-neutral-50/50 dark:hover:bg-neutral-800/30">
                    <td className="px-6 py-3 text-sm text-neutral-500">
                      {new Date(po.createdAt).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono text-neutral-850 dark:text-white">{po.reference}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{po.bankName}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{po.accountNumber}</td>
                    <td className="px-6 py-3 text-sm">
                      <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                        po.status === 'PAID'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                          : po.status === 'PENDING'
                          ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-500'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'
                      }`}>
                        {po.status === 'PAID' ? 'COMPLETED' : po.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-right text-neutral-850 dark:text-white">
                      {formatNaira(po.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
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
              {analyticsLoading ? (
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

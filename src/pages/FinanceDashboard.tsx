import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CreditCard,
  TrendingUp,
  ChevronRight,
  Banknote,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle,
  Percent,
  Shield,
} from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import EventPhaseBadge from '../components/organizer/EventPhaseBadge';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';
import { api } from '../services/api';

type LedgerData = {
  totalEarnings: number;
  grossSales?: number;
  platformFees?: number;
  processingFees?: number;
  totalPaidOut: number;
  totalPending: number;
  availableBalance: number;
  settlementMode?: string;
  payouts: any[];
  bankSettings: {
    payoutBankName: string | null;
    payoutAccountNumber: string | null;
    payoutAccountName: string | null;
    payoutSchedule: string | null;
    absorbFee?: boolean;
    paystackConnected?: boolean;
  };
};

const FinanceDashboard = () => {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useOrganizerAnalytics();

  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState('');

  const [payoutAmount, setPayoutAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchLedger = () => {
    setLedgerLoading(true);
    api.finance
      .getBalance()
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
      setFormMsg({
        type: 'success',
        text: res.data.message || 'Withdrawal request submitted successfully.',
      });
      setPayoutAmount('');
      fetchLedger();
    } catch (err: any) {
      setFormMsg({
        type: 'error',
        text: err?.response?.data?.message || 'Error processing payout request. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const { summary = {}, revenueByEvent = [], recentSales = [], monthly = [] } = analyticsData || {};
  const summaryData = summary as any;
  const maxRevenue = Math.max(...(monthly?.map((m: any) => m.revenue) || [1]), 1);
  const bank = ledgerData?.bankSettings;
  const isSplit = ledgerData?.settlementMode === 'PAYSTACK_SPLIT' || bank?.paystackConnected;

  return (
    <div className="pb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-white">
            Finance <span className="text-rose-500">Dashboard</span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 mt-1">
            Real-time earnings, platform fees, Paystack bank settlement, and withdrawal ledger
          </p>
        </div>
        <Link
          to="/organizer/organizer-settings?tab=payouts"
          className="inline-flex items-center gap-1 text-xs font-bold text-rose-500 hover:text-rose-600 bg-rose-50 dark:bg-rose-950/30 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 transition-colors shrink-0"
        >
          Bank & Payment Split Settings →
        </Link>
      </div>

      {(analyticsError || ledgerError) && (
        <div className="mb-6 rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
          <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
              Some finance data could not load
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {[analyticsError, ledgerError].filter(Boolean).join(' · ')}
            </p>
          </div>
        </div>
      )}

      {/* Money summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          {
            title: 'Your net earnings',
            value: ledgerData?.totalEarnings ?? summaryData.actualRevenue ?? 0,
            sub: 'After PartyStorm fee',
            icon: <TrendingUp className="h-4 w-4 text-rose-500" />,
            loading: ledgerLoading && analyticsLoading,
          },
          {
            title: 'Gross sales',
            value: ledgerData?.grossSales ?? summaryData.actualRevenue ?? 0,
            sub: 'Ticket / booth face value',
            icon: <CreditCard className="h-4 w-4 text-rose-500" />,
            loading: ledgerLoading,
          },
          {
            title: 'Platform fees',
            value: ledgerData?.platformFees ?? 0,
            sub: '6% · min ₦100 · max ₦2,000',
            icon: <Percent className="h-4 w-4 text-rose-500" />,
            loading: ledgerLoading,
          },
          {
            title: 'Available to withdraw',
            value: ledgerData?.availableBalance ?? 0,
            sub: isSplit ? 'Ledger for non-split sales' : 'Settled funds',
            icon: <Banknote className="h-4 w-4 text-rose-500" />,
            loading: ledgerLoading,
          },
        ].map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4 sm:p-5 hover:border-rose-300/50 dark:hover:border-rose-900/40 transition-colors shadow-xs"
          >
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {stat.title}
              </span>
              <div className="p-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/30">
                {stat.icon}
              </div>
            </div>
            {stat.loading ? (
              <>
                <Skeleton className="h-7 w-28 mb-2" />
                <Skeleton className="h-2 w-36" />
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                  {formatNaira(stat.value)}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">{stat.sub}</p>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Settlement + withdraw */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2 text-neutral-900 dark:text-white">
              <Banknote className="h-4 w-4 text-rose-500" />
              Balance & Withdrawals
            </h2>
            <span
              className={`text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full border ${
                isSplit
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-500 border-rose-200 dark:border-rose-800'
              }`}
            >
              {isSplit ? 'Paystack Direct Split' : 'Platform Ledger'}
            </span>
          </div>

          {ledgerLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-48" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : ledgerError ? (
            <p className="text-sm text-neutral-500">Ledger unavailable right now.</p>
          ) : (
            <>
              <p className="text-3xl font-extrabold">{formatNaira(ledgerData?.availableBalance || 0)}</p>
              <p className="text-xs text-neutral-500 mt-1 mb-4">
                {isSplit
                  ? 'With Paystack settlement connected, most ticket money settles to your bank automatically. This balance covers sales that still sit on the platform ledger.'
                  : 'Settled revenue available for withdrawal to your bank account.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50">
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400">Total net</span>
                  <p className="text-base font-bold mt-0.5">
                    {formatNaira(ledgerData?.totalEarnings || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400">Paid out</span>
                  <p className="text-base font-bold mt-0.5">
                    {formatNaira(ledgerData?.totalPaidOut || 0)}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-neutral-400">Pending</span>
                  <p className="text-base font-bold mt-0.5">
                    {formatNaira(ledgerData?.totalPending || 0)}
                  </p>
                </div>
              </div>

              {!bank?.payoutAccountNumber ? (
                <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-950/20 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-700 dark:text-amber-400">
                      Bank details missing
                    </p>
                    <p className="text-[11px] text-amber-600 dark:text-amber-500 mt-0.5">
                      Add your settlement account so payouts (and Paystack split) can work.
                    </p>
                    <Link
                      to="/organizer/organizer-settings?tab=payouts"
                      className="inline-block mt-2 text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Go to payout settings →
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleRequestPayout} className="space-y-3 border-t border-neutral-100 dark:border-neutral-800 pt-5">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-neutral-400">
                        ₦
                      </span>
                      <input
                        type="number"
                        min="500"
                        step="any"
                        value={payoutAmount}
                        onChange={(e) => setPayoutAmount(e.target.value)}
                        placeholder="Withdrawal amount"
                        disabled={submitting || (ledgerData?.availableBalance || 0) < 500}
                        className="w-full pl-8 pr-4 py-3 bg-neutral-50 dark:bg-gray-950 border border-neutral-200 dark:border-neutral-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={
                        submitting ||
                        !payoutAmount ||
                        (ledgerData?.availableBalance || 0) < parseFloat(payoutAmount || '0')
                      }
                      className="px-6 py-3 rounded-xl bg-rose-500 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-rose-600 disabled:opacity-40 flex items-center justify-center gap-2 shrink-0"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Processing…
                        </>
                      ) : (
                        'Request payout'
                      )}
                    </button>
                  </div>
                  {formMsg && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                        formMsg.type === 'success'
                          ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600'
                          : 'bg-red-50 dark:bg-red-950/20 text-red-500'
                      }`}
                    >
                      {formMsg.type === 'success' ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                      {formMsg.text}
                    </div>
                  )}
                </form>
              )}
            </>
          )}
        </div>

        {/* Bank / Paystack card */}
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-rose-500" />
              Settlement
            </h2>
            <Link
              to="/organizer/organizer-settings?tab=payouts"
              className="text-[11px] font-bold text-rose-500 hover:underline"
            >
              Edit
            </Link>
          </div>

          {ledgerLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Bank</p>
                <p className="text-sm font-bold mt-0.5">
                  {bank?.payoutBankName || 'Not set'}
                </p>
                <p className="text-xs font-mono text-neutral-500 mt-1">
                  {bank?.payoutAccountNumber || '—'}
                </p>
                <p className="text-xs text-neutral-600 dark:text-neutral-300 mt-0.5">
                  {bank?.payoutAccountName || '—'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-bold text-neutral-400 uppercase flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Paystack
                </p>
                <p className="text-sm font-bold mt-0.5">
                  {bank?.paystackConnected ? 'Subaccount connected' : 'Not connected yet'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  {bank?.paystackConnected
                    ? 'Splits settle to your bank after payment.'
                    : 'Save complete bank details in settings to enable automatic settlement.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
                <p className="text-[10px] font-bold text-neutral-400 uppercase">Checkout fees</p>
                <p className="text-sm font-bold mt-0.5">
                  {bank?.absorbFee ? 'You absorb fees' : 'Buyers pay Fee (default)'}
                </p>
                <p className="text-[11px] text-neutral-500 mt-1">
                  PartyStorm 6% (₦100–₦2,000) + Paystack processing. Platform fees are non-refundable.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Monthly revenue</h2>
          {analyticsLoading ? (
            <div className="flex items-end gap-2 h-44 pb-2">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="flex-1 rounded-t h-24" />
              ))}
            </div>
          ) : analyticsError ? (
            <p className="text-sm text-neutral-500 py-8 text-center">Chart unavailable</p>
          ) : (
            <div className="h-44 flex items-end gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-2">
              {(monthly.length ? monthly : [{ month: '—', revenue: 0 }]).map((m: any) => (
                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full max-w-[2rem] rounded-t bg-rose-500 mx-auto"
                    style={{
                      height: `${(m.revenue / maxRevenue) * 100}%`,
                      minHeight: m.revenue ? 4 : 0,
                    }}
                    title={formatNaira(m.revenue)}
                  />
                  <span className="text-[9px] text-neutral-400 truncate w-full text-center">
                    {m.month}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-6">
          <h2 className="text-sm font-semibold mb-4">Revenue by event</h2>
          {analyticsLoading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          ) : analyticsError || revenueByEvent.length === 0 ? (
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

      {/* Payout history */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden mb-8">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Withdrawal history</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Reference
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Bank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {ledgerLoading ? (
                [...Array(3)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3" colSpan={5}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : !ledgerData?.payouts?.length ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No withdrawals requested yet.
                  </td>
                </tr>
              ) : (
                ledgerData.payouts.map((po: any) => (
                  <tr key={po.id}>
                    <td className="px-6 py-3 text-sm text-neutral-500">
                      {new Date(po.createdAt).toLocaleDateString('en-NG')}
                    </td>
                    <td className="px-6 py-3 text-sm font-mono">{po.reference}</td>
                    <td className="px-6 py-3 text-sm text-neutral-500">{po.bankName}</td>
                    <td className="px-6 py-3 text-sm">
                      <span
                        className={`inline-block px-2.5 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                          po.status === 'PAID'
                            ? 'bg-emerald-50 text-emerald-600'
                            : po.status === 'PENDING'
                              ? 'bg-amber-50 text-amber-500'
                              : 'bg-neutral-100 text-neutral-500'
                        }`}
                      >
                        {po.status === 'PAID' ? 'COMPLETED' : po.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm font-bold text-right">
                      {formatNaira(po.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent income */}
      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
          <h2 className="text-sm font-semibold">Recent income</h2>
          <span className="text-xs text-neutral-500">Ticket purchases</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Ticket
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Buyer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase">
                  Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-neutral-500 uppercase">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {analyticsLoading ? (
                [...Array(4)].map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-3" colSpan={5}>
                      <Skeleton className="h-4 w-full" />
                    </td>
                  </tr>
                ))
              ) : analyticsError || recentSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-neutral-500">
                    No transactions yet
                  </td>
                </tr>
              ) : (
                recentSales.map((tx: any) => (
                  <tr key={tx.id}>
                    <td className="px-6 py-3 text-sm">
                      <Link
                        to={`/organizer/events/${tx.eventId}`}
                        className="font-medium hover:text-rose-500"
                      >
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
          <Link
            to="/organizer/analytics"
            className="inline-flex items-center gap-1 text-xs text-rose-500 font-medium hover:underline"
          >
            Full analytics <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

export default FinanceDashboard;

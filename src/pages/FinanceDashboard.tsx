import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Skeleton } from '../components/ui/skeleton';
import { useOrganizerAnalytics } from '../hooks/useOrganizerAnalytics';
import { formatNaira } from '../lib/eventOrganizer';
import { api } from '../services/api';

type LedgerData = {
  totalEarnings: number;
  settlementMode?: string;
  bankSettings: {
    payoutBankName: string | null;
    payoutAccountNumber: string | null;
    payoutAccountName: string | null;
    paystackConnected?: boolean;
  };
};

type BankPayout = {
  id: number;
  status: string;
  amount: number;
  settlementDate: string | null;
};

type SettlementHit = { status: string; settlementDate: string | null };

function nextBusinessDay(fromIso: string) {
  let cursor = new Date(fromIso);
  for (let i = 0; i < 8; i += 1) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const day = new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'short' }).format(cursor);
    if (day !== 'Sat' && day !== 'Sun') return cursor;
  }
  return cursor;
}

function formatSettleDay(date: Date) {
  return date.toLocaleDateString('en-NG', {
    timeZone: 'Africa/Lagos',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function paymentBankLabel(tx: { date: string; channel?: string; paymentReference?: string | null }, hit?: SettlementHit) {
  if (tx.channel && tx.channel !== 'Online') return null;
  if (hit?.status === 'success') {
    const when = hit.settlementDate ? formatSettleDay(new Date(hit.settlementDate)) : '';
    return when ? `Paid out ${when}` : 'Paid out';
  }
  if (hit?.status === 'failed') return 'Payout failed';
  if (hit) return 'On the way to your bank';
  return `Settles ${formatSettleDay(nextBusinessDay(tx.date))}`;
}

const FinanceDashboard = () => {
  const { data: analyticsData, loading: analyticsLoading, error: analyticsError } = useOrganizerAnalytics();
  const [ledgerData, setLedgerData] = useState<LedgerData | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [ledgerError, setLedgerError] = useState('');
  const [payouts, setPayouts] = useState<BankPayout[]>([]);
  const [byReference, setByReference] = useState<Record<string, SettlementHit>>({});
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [payoutsError, setPayoutsError] = useState('');

  useEffect(() => {
    api.finance
      .getBalance()
      .then((res) => {
        setLedgerData(res.data);
        setLedgerError('');
      })
      .catch((err) => {
        setLedgerError(err?.response?.data?.message || 'Could not load payouts');
      })
      .finally(() => setLedgerLoading(false));

    api.finance
      .getSettlements()
      .then((res) => {
        setPayouts(res.data?.payouts || []);
        setByReference(res.data?.byReference || {});
        setPayoutsError('');
      })
      .catch((err) => {
        setPayoutsError(err?.response?.data?.message || 'Could not load bank payouts');
      })
      .finally(() => setPayoutsLoading(false));
  }, []);

  const paidSales = ((analyticsData?.recentSales ?? []) as any[]).filter(
    (tx) => Number(tx.amount) > 0,
  );
  const bank = ledgerData?.bankSettings;
  const connected = Boolean(bank?.paystackConnected);
  const bankLabel = [bank?.payoutBankName, bank?.payoutAccountNumber].filter(Boolean).join(' · ');

  return (
    <div className="pb-6">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h1 className="text-lg font-bold tracking-tight text-neutral-900 dark:text-white">
          Payments <span className="text-rose-500">and payouts</span>
        </h1>
        <Link
          to="/organizer/organizer-settings?tab=payouts"
          className="text-[11px] font-semibold text-rose-500 hover:underline"
        >
          Edit bank
        </Link>
      </div>

      {(analyticsError || ledgerError || payoutsError) && (
        <p className="mb-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {[analyticsError, ledgerError, payoutsError].filter(Boolean).join(' · ')}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Your earnings</p>
          {ledgerLoading ? (
            <Skeleton className="h-6 w-24 mt-1" />
          ) : (
            <p className="text-3xl font-bold tabular-nums text-neutral-900 dark:text-white">
              {formatNaira(ledgerData?.totalEarnings || 0)}
            </p>
          )}
          <p className="text-xs text-neutral-500 mt-0.5">From your paid sales</p>
        </div>

        <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Bank</p>
          {ledgerLoading ? (
            <Skeleton className="h-6 w-36 mt-1" />
          ) : connected && bankLabel ? (
            <>
              <p className="text-base font-bold text-neutral-900 dark:text-white truncate">{bankLabel}</p>
              <p className="text-xs text-neutral-500 truncate mt-0.5">{bank?.payoutAccountName}</p>
            </>
          ) : (
            <Link
              to="/organizer/organizer-settings?tab=payouts"
              className="text-sm font-semibold text-rose-500 hover:underline"
            >
              Connect a bank account
            </Link>
          )}
        </div>
      </div>

      <div className="mb-3 overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
        <div className="border-b border-neutral-100 px-4 py-3 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">Payouts</h2>
          <p className="text-xs text-neutral-500">Paystack sends these to your bank the next business day.</p>
        </div>
        {payoutsLoading ? (
          <div className="space-y-2 p-4">
            {[...Array(2)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : payouts.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">
            {connected
              ? 'No bank payout yet. Paid sales show here after Paystack sends them.'
              : 'Connect a bank account to receive payouts.'}
          </p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {payouts.map((payout) => {
              const paid = payout.status === 'success';
              const failed = payout.status === 'failed';
              return (
                <div key={payout.id} className="flex items-center gap-4 px-4 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-semibold text-neutral-900 dark:text-white">
                      {paid ? 'Paid to your bank' : failed ? 'Payout failed' : 'On the way to your bank'}
                    </p>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {payout.settlementDate
                        ? formatSettleDay(new Date(payout.settlementDate))
                        : 'Date pending'}
                    </p>
                  </div>
                  <p className="shrink-0 text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {formatNaira(payout.amount)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-lg border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <h2 className="text-sm font-semibold">Payments</h2>
        </div>
        {analyticsLoading ? (
          <div className="p-4 space-y-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : analyticsError || paidSales.length === 0 ? (
          <p className="px-4 py-6 text-sm text-neutral-500">No paid sales yet.</p>
        ) : (
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {paidSales.map((tx) => {
              const bankNote = paymentBankLabel(
                tx,
                tx.paymentReference ? byReference[tx.paymentReference] : undefined,
              );
              return (
              <div key={tx.id} className="flex items-start gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {tx.buyerName}
                    </p>
                    <span className="rounded-full bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 text-[11px] font-semibold text-neutral-600 dark:text-neutral-300">
                      {tx.channel || 'Online'}
                    </span>
                    {tx.status === 'checked_in' && (
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                        Checked in
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-300 truncate mt-0.5">
                    <Link to={`/organizer/events/${tx.eventId}`} className="hover:text-rose-500">
                      {tx.eventTitle}
                    </Link>
                    {' · '}
                    {tx.ticketType}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {new Date(tx.date).toLocaleString('en-NG', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                    {bankNote ? ` · ${bankNote}` : ''}
                  </p>
                </div>
                <p className="text-base font-bold text-rose-500 shrink-0 tabular-nums">
                  {formatNaira(tx.amount)}
                </p>
              </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FinanceDashboard;

import React, { useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  Wallet,
  Percent,
  Receipt,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminTransactions, useAdminRevenue } from '../../hooks/queries/useAdmin';
import { formatNaira } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'PAID', 'PENDING', 'REFUNDED'] as const;

const AdminTransactionsPage = () => {
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data, isLoading } = useAdminTransactions({
    status: status === 'all' ? undefined : status,
    page,
  });

  const summary = revenue?.summary;
  const transactions = data?.transactions ?? [];
  const pagination = data?.pagination;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PAID: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600',
      PENDING: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600',
      REFUNDED: 'bg-red-50 dark:bg-red-950/30 text-red-600',
    };
    return map[s] ?? 'bg-neutral-100 text-neutral-600';
  };

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Transactions & <span className="text-rose-500">Revenue</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          All ticket orders and your {summary?.platformFeePercent ?? 5}% platform earnings.
        </p>
      </div>

      {revenueLoading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
          {[
            { label: 'Platform earnings', value: formatNaira(summary.platformRevenue), icon: Wallet, accent: true, sub: `${summary.platformFeePercent}% per ticket` },
            { label: 'Total GMV', value: formatNaira(summary.totalGmv), icon: TrendingUp, sub: `${summary.totalOrders} paid orders` },
            { label: 'Processing fees', value: formatNaira(summary.processingFees), icon: Percent, sub: 'Payment gateway costs' },
            { label: 'Organizer share', value: formatNaira(summary.organizerPayouts), icon: CreditCard, sub: 'Net to hosts' },
          ].map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.label} className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-3 sm:p-5 bg-white dark:bg-neutral-900 shadow-sm">
                <div className="flex justify-between items-center text-neutral-400 mb-1.5">
                  <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">{card.label}</span>
                  <Icon className={`h-4 w-4 ${card.accent ? 'text-rose-500' : ''}`} />
                </div>
                <p className={`text-xl sm:text-2xl font-black tracking-tight ${card.accent ? 'text-rose-500' : ''}`}>{card.value}</p>
                <p className="text-[10px] text-neutral-500 mt-1">{card.sub}</p>
              </div>
            );
          })}
        </div>
      )}

      {revenue?.monthly?.length > 0 && (
        <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 p-5 mb-8">
          <h2 className="text-sm font-extrabold mb-4">Monthly platform earnings</h2>
          <div className="flex items-end gap-2 h-32 overflow-x-auto pb-2">
            {revenue.monthly.map((m: any) => {
              const max = Math.max(...revenue.monthly.map((x: any) => x.platformFee), 1);
              const h = Math.max(8, (m.platformFee / max) * 100);
              return (
                <div key={m.month} className="flex flex-col items-center gap-1 min-w-[48px]">
                  <div className="w-8 bg-rose-500 rounded-t-md" style={{ height: `${h}%` }} />
                  <span className="text-[9px] text-neutral-400 font-medium">{m.month.slice(5)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => { setStatus(f); setPage(1); }}
            className={cn(
              'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors',
              status === f ? 'bg-rose-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
            )}
          >
            {f === 'all' ? 'All' : f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Event / Buyer</div>
            <div className="col-span-2">Gross</div>
            <div className="col-span-2">Platform fee</div>
            <div className="col-span-2">Net to host</div>
            <div className="col-span-2">Status / Date</div>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {transactions.length === 0 ? (
              <p className="px-5 py-12 text-sm text-neutral-500 text-center">No transactions yet</p>
            ) : (
              transactions.map((tx: any) => (
                <div key={tx.id} className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center text-sm">
                  <div className="md:col-span-1 flex items-center gap-2 text-neutral-400">
                    <Receipt className="h-4 w-4 md:hidden" />
                    #{tx.id}
                  </div>
                  <div className="md:col-span-3 min-w-0">
                    <p className="font-bold truncate">{tx.event?.title ?? '—'}</p>
                    <p className="text-xs text-neutral-500 truncate">
                      {tx.buyer?.name ?? 'Guest'} · {tx.ticketCount} ticket{tx.ticketCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="md:col-span-2 font-semibold">{formatNaira(tx.totalAmount)}</div>
                  <div className="md:col-span-2 font-semibold text-rose-500">{formatNaira(tx.platformFee)}</div>
                  <div className="md:col-span-2 text-neutral-600">{formatNaira(tx.netAmount)}</div>
                  <div className="md:col-span-2 flex flex-col gap-1">
                    <span className={cn('text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit', statusBadge(tx.status))}>
                      {tx.status}
                    </span>
                    <span className="text-[10px] text-neutral-400">
                      {new Date(tx.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-100 dark:border-neutral-800">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-xs text-neutral-500">Page {page} of {pagination.pages}</span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminTransactionsPage;

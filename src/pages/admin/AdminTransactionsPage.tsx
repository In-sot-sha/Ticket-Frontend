import React, { useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  Wallet,
  Percent,
  Receipt,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Landmark,
  User,
  Clock
} from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import {
  useAdminTransactions,
  useAdminRevenue,
  useAdminPayouts,
  useApprovePayout,
  useRejectPayout
} from '../../hooks/queries/useAdmin';
import { formatNaira } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'PAID', 'PENDING', 'REFUNDED'] as const;

const AdminTransactionsPage = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState<string>('all');

  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data, isLoading: transactionsLoading } = useAdminTransactions({
    status: status === 'all' ? undefined : status,
    page,
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useAdminPayouts(
    payoutStatus === 'all' ? undefined : payoutStatus
  );

  const approvePayoutMutation = useApprovePayout();
  const rejectPayoutMutation = useRejectPayout();

  const handleApprove = async (id: number) => {
    if (!window.confirm('Are you sure you want to approve this payout? This will trigger the Paystack Transfer API to send funds directly to the organizer\'s bank account.')) {
      return;
    }
    try {
      await approvePayoutMutation.mutateAsync(id);
      alert('Payout approved and transfer processed successfully!');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error processing payout approval.');
    }
  };

  const handleReject = async (id: number) => {
    if (!window.confirm('Are you sure you want to reject this payout request? The funds will be restored to the organizer\'s balance.')) {
      return;
    }
    try {
      await rejectPayoutMutation.mutateAsync(id);
      alert('Payout request rejected and balance restored.');
    } catch (err: any) {
      alert(err.response?.data?.message || err.message || 'Error rejecting payout.');
    }
  };

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
          Monitor payments, platform revenue, and process organizer payout requests via Paystack.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-800 mb-6">
        <button
          onClick={() => setActiveTab('transactions')}
          className={cn(
            "py-2.5 px-4 font-bold text-sm border-b-2 transition-all",
            activeTab === 'transactions'
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          )}
        >
          Transactions & Revenue
        </button>
        <button
          onClick={() => setActiveTab('payouts')}
          className={cn(
            "py-2.5 px-4 font-bold text-sm border-b-2 transition-all flex items-center gap-1.5",
            activeTab === 'payouts'
              ? "border-rose-500 text-rose-500"
              : "border-transparent text-neutral-500 hover:text-neutral-700"
          )}
        >
          Payout Requests
          {payouts.filter((p: any) => p.status === 'PENDING').length > 0 && (
            <span className="bg-rose-500 text-white rounded-full text-[10px] px-1.5 py-0.5 font-extrabold">
              {payouts.filter((p: any) => p.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'transactions' ? (
        <>
          {revenueLoading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : summary && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { label: 'Platform earnings', value: formatNaira(summary.platformRevenue), icon: Wallet, accent: true, sub: `${summary.platformFeePercent}% per order` },
                { label: 'Total GMV', value: formatNaira(summary.totalGmv), icon: TrendingUp, sub: `${summary.totalOrders} paid payments` },
                { label: 'Processing fees', value: formatNaira(summary.processingFees), icon: Percent, sub: 'Gateway processing costs' },
                { label: 'Organizer share', value: formatNaira(summary.organizerPayouts), icon: CreditCard, sub: 'Net to event hosts' },
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

          {transactionsLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <div className="col-span-1">#</div>
                <div className="col-span-2">Type</div>
                <div className="col-span-3">Event / Buyer</div>
                <div className="col-span-2">Gross</div>
                <div className="col-span-2">Platform fee</div>
                <div className="col-span-2">Net to host / Status</div>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {transactions.length === 0 ? (
                  <p className="px-5 py-12 text-sm text-neutral-500 text-center">No transactions yet</p>
                ) : (
                  transactions.map((tx: any) => (
                    <div key={tx.id} className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center text-sm">
                      <div className="md:col-span-1 flex items-center gap-2 text-neutral-400">
                        <Receipt className="h-4 w-4 md:hidden" />
                        #{tx.txId}
                      </div>
                      <div className="md:col-span-2">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase",
                          tx.type === 'VENDOR' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-455'
                        )}>
                          {tx.type}
                        </span>
                      </div>
                      <div className="md:col-span-3 min-w-0">
                        <p className="font-bold truncate">{tx.event?.title ?? '—'}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {tx.buyer?.name ?? 'Guest'} · {tx.detail}
                        </p>
                      </div>
                      <div className="md:col-span-2 font-semibold">{formatNaira(tx.totalAmount)}</div>
                      <div className="md:col-span-2 font-semibold text-rose-500">{formatNaira(tx.platformFee)}</div>
                      <div className="md:col-span-2 flex flex-col gap-1">
                        <span className="font-semibold text-neutral-600 dark:text-neutral-300">{formatNaira(tx.netAmount)}</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit', statusBadge(tx.status))}>
                            {tx.status}
                          </span>
                          <span className="text-[9px] text-neutral-400">
                            {new Date(tx.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
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
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setPayoutStatus(f)}
                className={cn(
                  'px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors',
                  payoutStatus === f ? 'bg-rose-500 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600'
                )}
              >
                {f === 'all' ? 'All' : f}
              </button>
            ))}
          </div>

          {payoutsLoading ? (
            <div className="flex justify-center py-16"><Spinner /></div>
          ) : (
            <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
              <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                <div className="col-span-1">Ref</div>
                <div className="col-span-3">Organization / Host</div>
                <div className="col-span-2">Amount</div>
                <div className="col-span-3">Bank Details</div>
                <div className="col-span-3 text-right">Actions / Status</div>
              </div>
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {payouts.length === 0 ? (
                  <p className="px-5 py-12 text-sm text-neutral-500 text-center">No payouts found</p>
                ) : (
                  payouts.map((p: any) => (
                    <div key={p.id} className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-3 md:items-center text-sm">
                      <div className="md:col-span-1 text-xs text-neutral-400 font-mono">
                        {p.reference || `#${p.id}`}
                      </div>
                      <div className="md:col-span-3">
                        <p className="font-bold">{p.organization?.name ?? 'Unknown Organization'}</p>
                        {p.organization?.owner && (
                          <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                            <User className="h-3 w-3 shrink-0" />
                            {p.organization.owner.firstName} {p.organization.owner.lastName}
                          </p>
                        )}
                      </div>
                      <div className="md:col-span-2 font-semibold text-rose-500 text-base">
                        {formatNaira(p.amount)}
                      </div>
                      <div className="md:col-span-3">
                        <div className="flex items-start gap-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                          <Landmark className="h-3.5 w-3.5 mt-0.5 text-neutral-400 shrink-0" />
                          <div>
                            <p className="font-semibold text-neutral-800 dark:text-neutral-200">{p.bankName}</p>
                            <p className="font-mono mt-0.5">{p.accountNumber}</p>
                            <p className="text-[10px] text-neutral-500 mt-0.5 italic truncate max-w-[180px]" title={p.accountName}>{p.accountName}</p>
                          </div>
                        </div>
                      </div>
                      <div className="md:col-span-3 flex flex-col md:items-end gap-2">
                        {p.status === 'PENDING' ? (
                          <div className="flex items-center gap-2">
                            <button
                              disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                              onClick={() => handleApprove(p.id)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm active:scale-95 disabled:opacity-50 transition-all"
                            >
                              <Check className="h-3.5 w-3.5" /> Approve
                            </button>
                            <button
                              disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                              onClick={() => handleReject(p.id)}
                              className="px-3 py-1.5 bg-rose-55 text-rose-600 hover:bg-rose-100 rounded-lg text-xs font-bold flex items-center gap-1 active:scale-95 disabled:opacity-50 transition-all"
                            >
                              <X className="h-3.5 w-3.5" /> Reject
                            </button>
                          </div>
                        ) : (
                          <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit', statusBadge(p.status))}>
                            {p.status}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(p.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminTransactionsPage;

import React, { useState } from 'react';
import {
  CreditCard,
  TrendingUp,
  Wallet,
  Percent,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/skeleton';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
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
      <PageHeader
        title="Transactions &"
        accent="Revenue"
        description="Monitor payments, platform revenue, and process organizer payout requests via Paystack."
        actions={
          <Select
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'transactions' | 'payouts')}
          >
            <SelectTrigger className="w-[200px] h-10 rounded-xl">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactions">Transactions & revenue</SelectItem>
              <SelectItem value="payouts">
                Payout requests
                {payouts.filter((p: any) => p.status === 'PENDING').length
                  ? ` (${payouts.filter((p: any) => p.status === 'PENDING').length})`
                  : ''}
              </SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {activeTab === 'transactions' ? (
        <>
          {revenueLoading ? (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8">
              {[
                { label: 'Platform earnings', icon: Wallet },
                { label: 'Total GMV', icon: TrendingUp },
                { label: 'Processing fees', icon: Percent },
                { label: 'Organizer share', icon: CreditCard },
              ].map((card) => {
                const Icon = card.icon;
                return (
                  <div
                    key={card.label}
                    className="border border-neutral-150 dark:border-neutral-900 rounded-2xl p-3 sm:p-5 bg-white dark:bg-neutral-900 shadow-sm"
                  >
                    <div className="flex justify-between items-center text-neutral-400 mb-1.5">
                      <span className="text-[9px] sm:text-xs font-bold uppercase tracking-wider">
                        {card.label}
                      </span>
                      <Icon className="h-4 w-4" />
                    </div>
                    <Skeleton className="h-7 w-24 rounded-lg" />
                    <Skeleton className="h-3 w-28 mt-2 rounded-md" />
                  </div>
                );
              })}
            </div>
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

          {transactionsLoading ? (
            <DataTableSkeleton rows={6} columns={5} />
          ) : (
            <>
              <DataTable
                columns={[
                  {
                    id: 'id',
                    header: '#',
                    cell: (tx) => <span className="text-neutral-400 text-xs">#{tx.txId}</span>,
                  },
                  {
                    id: 'type',
                    header: 'Type',
                    cell: (tx) => (
                      <span className={cn(
                        'px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase',
                        tx.type === 'VENDOR'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                      )}>
                        {tx.type}
                      </span>
                    ),
                  },
                  {
                    id: 'event',
                    header: 'Event / Buyer',
                    cell: (tx) => (
                      <div className="min-w-0">
                        <p className="font-bold text-sm truncate">{tx.event?.title ?? '—'}</p>
                        <p className="text-xs text-neutral-500 truncate">
                          {tx.buyer?.name ?? 'Guest'} · {tx.detail}
                        </p>
                      </div>
                    ),
                  },
                  {
                    id: 'gross',
                    header: 'Gross',
                    cell: (tx) => <span className="font-semibold text-sm">{formatNaira(tx.totalAmount)}</span>,
                  },
                  {
                    id: 'fee',
                    header: 'Platform fee',
                    cell: (tx) => <span className="font-semibold text-sm text-rose-500">{formatNaira(tx.platformFee)}</span>,
                  },
                  {
                    id: 'net',
                    header: 'Net / Status',
                    cell: (tx) => (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-sm">{formatNaira(tx.netAmount)}</span>
                        <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full w-fit', statusBadge(tx.status))}>
                          {tx.status}
                        </span>
                      </div>
                    ),
                  },
                ] as DataTableColumn<any>[]}
                rows={transactions}
                getRowId={(tx) => tx.id}
                pageSize={Math.max(transactions.length, 1)}
                hideSearch
                toolbar={
                  <Select
                    value={status}
                    onValueChange={(v) => {
                      setStatus(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[150px] h-10 rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUS_FILTERS.map((f) => (
                        <SelectItem key={f} value={f}>
                          {f === 'all' ? 'All statuses' : f}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
                emptyTitle="No transactions yet"
                emptyDescription="Paid orders will show up here."
              />
              {pagination && pagination.pages > 1 && (
                <div className="flex items-center justify-between px-1 py-3">
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
            </>
          )}
        </>
      ) : (
        <>
          {payoutsLoading ? (
            <DataTableSkeleton rows={6} columns={5} />
          ) : (
            <DataTable
              columns={[
                {
                  id: 'ref',
                  header: 'Ref',
                  cell: (p) => (
                    <span className="text-xs text-neutral-400 font-mono">{p.reference || `#${p.id}`}</span>
                  ),
                },
                {
                  id: 'org',
                  header: 'Organization',
                  cell: (p) => (
                    <div>
                      <p className="font-bold text-sm">{p.organization?.name ?? 'Unknown'}</p>
                      {p.organization?.owner && (
                        <p className="text-xs text-neutral-500">
                          {p.organization.owner.firstName} {p.organization.owner.lastName}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'amount',
                  header: 'Amount',
                  cell: (p) => (
                    <span className="font-semibold text-rose-500">{formatNaira(p.amount)}</span>
                  ),
                },
                {
                  id: 'bank',
                  header: 'Bank',
                  cell: (p) => (
                    <div className="text-xs">
                      <p className="font-semibold">{p.bankName}</p>
                      <p className="font-mono text-neutral-500">{p.accountNumber}</p>
                    </div>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (p) =>
                    p.status === 'PENDING' ? (
                      <div className="flex items-center gap-2">
                        <button
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                          onClick={() => handleApprove(p.id)}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <Check className="h-3.5 w-3.5" /> Approve
                        </button>
                        <button
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                          onClick={() => handleReject(p.id)}
                          className="px-3 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className={cn('text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full', statusBadge(p.status))}>
                        {p.status}
                      </span>
                    ),
                },
              ] as DataTableColumn<any>[]}
              rows={payouts}
              getRowId={(p) => p.id}
              pageSize={12}
              hideSearch
              toolbar={
                <Select value={payoutStatus} onValueChange={setPayoutStatus}>
                  <SelectTrigger className="w-[150px] h-10 rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTERS.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f === 'all' ? 'All statuses' : f}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              }
              emptyTitle="No payouts found"
              emptyDescription="Organizer payout requests will appear here."
            />
          )}
        </>
      )}
    </div>
  );
};

export default AdminTransactionsPage;

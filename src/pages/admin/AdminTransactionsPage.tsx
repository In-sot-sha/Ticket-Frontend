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
  Search,
  Copy,
  Ticket,
  ExternalLink,
  Calendar,
  User,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/Button';
import {
  useAdminTransactions,
  useAdminRevenue,
  useAdminPayouts,
  useApprovePayout,
  useRejectPayout,
} from '../../hooks/queries/useAdmin';
import { formatNaira } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'PAID', 'PENDING', 'REFUNDED'] as const;

interface TxTicket {
  id: number;
  qrCode?: string;
  status: string;
  amountPaid: number;
  ticketType?: {
    id: number;
    name: string;
    price: number;
  };
}

interface TransactionItem {
  id: string;
  txId: number;
  type: 'TICKET' | 'VENDOR';
  totalAmount: number;
  platformFee: number;
  processingFee: number;
  netAmount: number;
  status: string;
  purchaseType?: string;
  paymentReference?: string | null;
  tickets?: TxTicket[];
  vendorType?: string | null;
  createdAt: string;
  detail: string;
  buyer?: {
    id: number;
    name: string;
    email: string;
  } | null;
  event?: {
    id: number;
    title: string;
    organization?: string | null;
  } | null;
}

const AdminTransactionsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'transactions' | 'payouts'>('transactions');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState<string>('all');

  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);

  const [resolveRef, setResolveRef] = useState('');
  const [resolveBusy, setResolveBusy] = useState(false);
  const [resolveResult, setResolveResult] = useState<any>(null);
  const [resolveError, setResolveError] = useState('');
  const [showResolveTool, setShowResolveTool] = useState(false);

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

  const handleResolvePayment = async (customRef?: string) => {
    const reference = (customRef || resolveRef).trim();
    if (!reference) return;
    setResolveBusy(true);
    setResolveError('');
    setResolveResult(null);
    try {
      const { api } = await import('../../services/api');
      const res = await api.admin.resolvePayment(reference);
      setResolveResult(res.data);
    } catch (err: any) {
      setResolveError(err.response?.data?.message || err.message || 'Resolve failed');
    } finally {
      setResolveBusy(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (
      !window.confirm(
        'Approve this payout? This will trigger Paystack Transfer API to send funds directly to the organizer bank account.'
      )
    ) {
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
    if (
      !window.confirm(
        'Reject this payout request? The funds will be restored to the organizer balance.'
      )
    ) {
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
  const transactions: TransactionItem[] = data?.transactions ?? [];
  const pagination = data?.pagination;

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      PAID: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800',
      PENDING: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800',
      REFUNDED: 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800',
    };
    return map[s] ?? 'bg-neutral-100 text-neutral-600';
  };

  const copyReference = async (ref: string) => {
    await navigator.clipboard.writeText(ref);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 1500);
  };

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-8">
      <PageHeader
        title="Transactions &"
        accent="Revenue"
        description="Monitor orders, platform earnings, and process organizer payout settlements."
        actions={
          <div className="inline-flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-0.5 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all',
                activeTab === 'transactions'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              Transactions & Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payouts')}
              className={cn(
                'px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5',
                activeTab === 'payouts'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              )}
            >
              <span>Payout Requests</span>
              {payouts.filter((p: any) => p.status === 'PENDING').length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {payouts.filter((p: any) => p.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* Compact Financial Stats */}
      {revenueLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 bg-white dark:bg-neutral-900"
            >
              <Skeleton className="h-3 w-16 mb-2 rounded" />
              <Skeleton className="h-6 w-24 rounded" />
            </div>
          ))}
        </div>
      ) : (
        summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 mb-4">
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Platform Earnings
                </span>
                <Wallet className="h-3.5 w-3.5 text-rose-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-rose-500 tracking-tight">
                {formatNaira(summary.platformRevenue)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {summary.platformFeePercent}% per paid order
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">Total GMV</span>
                <TrendingUp className="h-3.5 w-3.5 text-blue-500" />
              </div>
              <p className="text-lg sm:text-xl font-black tracking-tight">
                {formatNaira(summary.totalGmv)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">
                {summary.totalOrders} paid payments
              </p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Processing Fees
                </span>
                <Percent className="h-3.5 w-3.5 text-amber-500" />
              </div>
              <p className="text-lg sm:text-xl font-black tracking-tight">
                {formatNaira(summary.processingFees)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Gateway costs (Paystack)</p>
            </div>

            <div className="border border-neutral-200 dark:border-neutral-800 rounded-2xl p-3 sm:p-3.5 bg-white dark:bg-neutral-900 shadow-sm">
              <div className="flex items-center justify-between text-neutral-400 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  Host Share
                </span>
                <CreditCard className="h-3.5 w-3.5 text-purple-500" />
              </div>
              <p className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                {formatNaira(summary.organizerPayouts)}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Net to organizers</p>
            </div>
          </div>
        )
      )}

      {/* Compact Payment Resolve Tool Drawer / Bar */}
      <div className="mb-4 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-3.5 w-3.5 text-rose-500" />
            <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">
              Paystack Reference Verification
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowResolveTool((p) => !p)}
            className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 transition-colors"
          >
            {showResolveTool ? 'Hide Tool' : 'Verify Reference'}
          </button>
        </div>

        {showResolveTool && (
          <div className="mt-2.5 pt-2.5 border-t border-neutral-100 dark:border-neutral-800">
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                value={resolveRef}
                onChange={(e) => setResolveRef(e.target.value)}
                placeholder="Enter Paystack payment reference (e.g. EVT_… or VND_…)"
                className="flex-1 h-8 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 px-3 text-xs"
              />
              <Button
                size="sm"
                disabled={resolveBusy || !resolveRef.trim()}
                onClick={() => handleResolvePayment()}
                className="h-8 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
              >
                {resolveBusy ? 'Checking Paystack…' : 'Verify & Fulfill'}
              </Button>
            </div>

            {resolveError && (
              <p className="mt-2 text-xs text-red-500 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {resolveError}
              </p>
            )}
            {resolveResult && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-xs font-mono text-neutral-700 dark:text-neutral-300 max-h-40 overflow-auto">
                <pre>{JSON.stringify(resolveResult, null, 2)}</pre>
              </div>
            )}
          </div>
        )}
      </div>

      {activeTab === 'transactions' ? (
        <>
          {transactionsLoading ? (
            <DataTableSkeleton rows={6} columns={5} />
          ) : (
            <DataTable
              columns={[
                {
                  id: 'id',
                  header: 'Order #',
                  cell: (tx: TransactionItem) => (
                    <span className="font-mono text-xs font-semibold text-neutral-500">
                      #{tx.txId}
                    </span>
                  ),
                },
                {
                  id: 'type',
                  header: 'Type',
                  cell: (tx: TransactionItem) => (
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                        tx.type === 'VENDOR'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                      )}
                    >
                      {tx.type}
                    </span>
                  ),
                },
                {
                  id: 'event',
                  header: 'Event & Customer',
                  cell: (tx: TransactionItem) => (
                    <div className="min-w-0">
                      <p className="font-bold text-xs truncate text-neutral-900 dark:text-white">
                        {tx.event?.title ?? '—'}
                      </p>
                      <p className="text-[11px] text-neutral-400 truncate">
                        {tx.buyer?.name ?? 'Guest'} · {tx.detail}
                      </p>
                    </div>
                  ),
                },
                {
                  id: 'gross',
                  header: 'Gross Paid',
                  cell: (tx: TransactionItem) => (
                    <span className="font-bold text-xs">{formatNaira(tx.totalAmount)}</span>
                  ),
                },
                {
                  id: 'fee',
                  header: 'Platform Fee',
                  cell: (tx: TransactionItem) => (
                    <span className="font-semibold text-xs text-rose-500">
                      {formatNaira(tx.platformFee)}
                    </span>
                  ),
                },
                {
                  id: 'status',
                  header: 'Status',
                  cell: (tx: TransactionItem) => (
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full inline-block',
                        statusBadge(tx.status)
                      )}
                    >
                      {tx.status}
                    </span>
                  ),
                },
                {
                  id: 'actions',
                  header: '',
                  cell: (tx: TransactionItem) => (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg text-xs h-7 px-2.5 font-semibold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTx(tx);
                      }}
                    >
                      Inspect
                    </Button>
                  ),
                },
              ] as DataTableColumn<any>[]}
              rows={transactions}
              getRowId={(tx) => tx.id}
              pageSize={Math.max(transactions.length, 1)}
              onRowClick={(tx) => setSelectedTx(tx)}
              hideSearch
              toolbar={
                <Select
                  value={status}
                  onValueChange={(v) => {
                    setStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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
              emptyTitle="No transactions found"
              emptyDescription="Orders and vendor payments will appear here."
            />
          )}

          {pagination && pagination.pages > 1 && (
            <div className="flex items-center justify-between px-1 py-3 text-xs">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="flex items-center gap-1 font-semibold disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Prev
              </button>
              <span className="text-neutral-400">
                Page {page} of {pagination.pages}
              </span>
              <button
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="flex items-center gap-1 font-semibold disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
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
                  header: 'Reference',
                  cell: (p) => (
                    <span className="text-xs text-neutral-400 font-mono">
                      {p.reference || `#${p.id}`}
                    </span>
                  ),
                },
                {
                  id: 'org',
                  header: 'Organization',
                  cell: (p) => (
                    <div>
                      <p className="font-bold text-xs text-neutral-900 dark:text-white">
                        {p.organization?.name ?? 'Unknown'}
                      </p>
                      {p.organization?.owner && (
                        <p className="text-[11px] text-neutral-400">
                          {p.organization.owner.firstName} {p.organization.owner.lastName}
                        </p>
                      )}
                    </div>
                  ),
                },
                {
                  id: 'amount',
                  header: 'Payout Amount',
                  cell: (p) => (
                    <span className="font-bold text-xs text-rose-500">
                      {formatNaira(p.amount)}
                    </span>
                  ),
                },
                {
                  id: 'bank',
                  header: 'Bank Details',
                  cell: (p) => (
                    <div className="text-xs">
                      <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                        {p.bankName}
                      </p>
                      <p className="font-mono text-[11px] text-neutral-400">{p.accountNumber}</p>
                    </div>
                  ),
                },
                {
                  id: 'actions',
                  header: 'Actions',
                  cell: (p) =>
                    p.status === 'PENDING' ? (
                      <div className="flex items-center gap-1.5">
                        <button
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                          onClick={() => handleApprove(p.id)}
                          className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          disabled={approvePayoutMutation.isPending || rejectPayoutMutation.isPending}
                          onClick={() => handleReject(p.id)}
                          className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded-lg text-xs font-bold flex items-center gap-1"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </div>
                    ) : (
                      <span
                        className={cn(
                          'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                          statusBadge(p.status)
                        )}
                      >
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
                  <SelectTrigger className="w-[140px] h-9 rounded-xl text-xs">
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

      {/* Transaction Details Modal */}
      <Dialog open={Boolean(selectedTx)} onOpenChange={(o) => !o && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-5">
          {selectedTx && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-extrabold">
                      Order #{selectedTx.txId}
                    </DialogTitle>
                    <span
                      className={cn(
                        'px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider',
                        selectedTx.type === 'VENDOR'
                          ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200'
                          : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200'
                      )}
                    >
                      {selectedTx.type}
                    </span>
                  </div>
                  <span
                    className={cn(
                      'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                      statusBadge(selectedTx.status)
                    )}
                  >
                    {selectedTx.status}
                  </span>
                </div>
                <DialogDescription className="text-xs text-neutral-400 mt-1">
                  Placed on {new Date(selectedTx.createdAt).toLocaleString()}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 mt-2">
                {/* Reference */}
                {selectedTx.paymentReference && (
                  <div className="flex items-center justify-between p-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Paystack Reference
                      </span>
                      <p className="font-mono text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                        {selectedTx.paymentReference}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-lg h-7 px-2 text-xs"
                      onClick={() => copyReference(selectedTx.paymentReference!)}
                    >
                      {copiedRef ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      <span className="ml-1">{copiedRef ? 'Copied' : 'Copy'}</span>
                    </Button>
                  </div>
                )}

                {/* Customer & Event Info */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <User className="h-3 w-3" /> Customer
                    </span>
                    <p className="font-bold text-neutral-900 dark:text-white mt-1">
                      {selectedTx.buyer?.name || 'Guest Checkout'}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {selectedTx.buyer?.email || 'No email provided'}
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Event / Host
                    </span>
                    <p className="font-bold text-neutral-900 dark:text-white mt-1 truncate">
                      {selectedTx.event?.title || '—'}
                    </p>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {selectedTx.event?.organization || 'Direct platform'}
                    </p>
                  </div>
                </div>

                {/* Financial Breakdown Table */}
                <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-100 dark:border-neutral-800">
                    <span className="text-neutral-500">Gross Paid</span>
                    <span className="font-bold text-neutral-900 dark:text-white">
                      {formatNaira(selectedTx.totalAmount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Platform Commission (Fee)</span>
                    <span className="font-semibold text-rose-500">
                      {formatNaira(selectedTx.platformFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-neutral-500">Gateway Processing Fee</span>
                    <span className="font-semibold text-neutral-500">
                      {formatNaira(selectedTx.processingFee)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-neutral-100 dark:border-neutral-800 font-bold">
                    <span className="text-neutral-700 dark:text-neutral-300">Host Net Amount</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {formatNaira(selectedTx.netAmount)}
                    </span>
                  </div>
                </div>

                {/* Tickets Associated */}
                {selectedTx.tickets && selectedTx.tickets.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                      <Ticket className="h-3 w-3 text-rose-500" /> Issued Tickets ({selectedTx.tickets.length})
                    </span>
                    <div className="space-y-1.5 max-h-36 overflow-y-auto">
                      {selectedTx.tickets.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between p-2 rounded-lg border border-neutral-200 dark:border-neutral-800 text-xs bg-white dark:bg-neutral-900/60"
                        >
                          <div>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">
                              {t.ticketType?.name || 'General Admission'}
                            </span>
                            {t.qrCode && (
                              <p className="font-mono text-[10px] text-neutral-400">
                                Code: {t.qrCode.slice(0, 16)}…
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-rose-500">
                              {t.amountPaid ? formatNaira(t.amountPaid) : formatNaira(t.ticketType?.price ?? 0)}
                            </span>
                            <p className="text-[9px] uppercase font-bold text-emerald-600">
                              {t.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter className="mt-4 gap-2">
                {selectedTx.paymentReference && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-xs"
                    onClick={() => {
                      setResolveRef(selectedTx.paymentReference!);
                      setShowResolveTool(true);
                      handleResolvePayment(selectedTx.paymentReference!);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> Re-verify with Paystack
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-rose-500 text-white rounded-xl text-xs font-bold"
                  onClick={() => setSelectedTx(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionsPage;

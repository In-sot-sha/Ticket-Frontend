import React, { useCallback, useEffect, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Copy,
  Ticket,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Mail,
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
  useAdminSettlements,
  useAdminPayouts,
  useApprovePayout,
  useRejectPayout,
} from '../../hooks/queries/useAdmin';
import { formatNaira } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'PAID', 'PENDING', 'REFUNDED'] as const;

function lagosWeekday(date: Date) {
  return new Intl.DateTimeFormat('en-US', { timeZone: 'Africa/Lagos', weekday: 'short' }).format(date);
}

function lagosDayKey(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Lagos',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function nextBusinessDay(fromIso: string) {
  let cursor = new Date(fromIso);
  for (let i = 0; i < 8; i += 1) {
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
    const day = lagosWeekday(cursor);
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

function bankPayoutLabel(
  tx: { status: string; createdAt: string; paymentReference?: string | null },
  hit?: { status: string; settlementDate: string | null },
) {
  if (tx.status !== 'PAID') return null;
  if (!tx.paymentReference) return { text: 'Not Paystack', tone: 'muted' as const };
  if (hit?.status === 'success') {
    const when = hit.settlementDate ? formatSettleDay(new Date(hit.settlementDate)) : '';
    return { text: when ? `Paid out ${when}` : 'Paid out', tone: 'ok' as const };
  }
  if (hit?.status === 'failed') return { text: 'Payout failed', tone: 'bad' as const };
  if (hit) return { text: 'Sending to bank', tone: 'wait' as const };
  const due = nextBusinessDay(tx.createdAt);
  const label = formatSettleDay(due);
  if (lagosDayKey(due) > lagosDayKey(new Date())) {
    return { text: `Settles ${label}`, tone: 'wait' as const };
  }
  return { text: `Due ${label}`, tone: 'wait' as const };
}

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

  const [pendingRows, setPendingRows] = useState<
    Array<{
      id: number;
      reference: string;
      kind: string;
      eventTitle: string | null;
      chargeAmount: number;
      email: string | null;
      createdAt: string;
    }>
  >([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [sweepBusy, setSweepBusy] = useState(false);
  const [sweepNotice, setSweepNotice] = useState<string | null>(null);
  const [sweepError, setSweepError] = useState('');

  const [resendEmail, setResendEmail] = useState('');
  const [resendBusy, setResendBusy] = useState(false);
  const [resendNotice, setResendNotice] = useState<string | null>(null);
  const [resendError, setResendError] = useState('');

  const { data: revenue, isLoading: revenueLoading } = useAdminRevenue();
  const { data: settlementData, isLoading: settlementsLoading } = useAdminSettlements();
  const { data, isLoading: transactionsLoading, refetch: refetchTransactions } = useAdminTransactions({
    status: status === 'all' ? undefined : status,
    page,
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useAdminPayouts(
    payoutStatus === 'all' ? undefined : payoutStatus
  );

  const approvePayoutMutation = useApprovePayout();
  const rejectPayoutMutation = useRejectPayout();

  const loadPendingPayments = useCallback(async () => {
    setPendingLoading(true);
    try {
      const { api } = await import('../../services/api');
      const res = await api.admin.getPendingPayments();
      setPendingRows(res.data?.pending ?? []);
    } catch {
      setPendingRows([]);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'transactions') void loadPendingPayments();
  }, [activeTab, loadPendingPayments]);

  useEffect(() => {
    if (selectedTx?.type === 'TICKET') {
      setResendEmail(selectedTx.buyer?.email || '');
      setResendNotice(null);
      setResendError('');
    }
  }, [selectedTx]);

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
      void loadPendingPayments();
      void refetchTransactions();
    } catch (err: any) {
      setResolveError(err.response?.data?.message || err.message || 'Resolve failed');
    } finally {
      setResolveBusy(false);
    }
  };

  const handleSweepPending = async () => {
    setSweepBusy(true);
    setSweepError('');
    setSweepNotice(null);
    try {
      const { api } = await import('../../services/api');
      const res = await api.admin.sweepPendingPayments();
      const d = res.data;
      setSweepNotice(
        `Checked ${d.scanned}: ${d.fulfilled} fulfilled, ${d.abandoned ?? 0} abandoned cleared, ${d.stillPending} still open, ${d.failed} errors.`,
      );
      void loadPendingPayments();
      void refetchTransactions();
    } catch (err: any) {
      setSweepError(err.response?.data?.message || err.message || 'Sweep failed');
    } finally {
      setSweepBusy(false);
    }
  };

  const handleResendTickets = async () => {
    if (!selectedTx || selectedTx.type !== 'TICKET') return;
    const email = resendEmail.trim();
    if (!email) {
      setResendError('Enter the delivery email');
      return;
    }
    setResendBusy(true);
    setResendError('');
    setResendNotice(null);
    try {
      const { api } = await import('../../services/api');
      const res = await api.admin.resendOrderTickets(selectedTx.txId, email);
      setResendNotice(res.data?.message || `Tickets resent to ${email}`);
      setSelectedTx((prev) =>
        prev
          ? {
              ...prev,
              buyer: prev.buyer
                ? { ...prev.buyer, email: res.data?.deliveredTo || email }
                : prev.buyer,
            }
          : prev,
      );
      void refetchTransactions();
    } catch (err: any) {
      setResendError(err.response?.data?.message || err.message || 'Resend failed');
    } finally {
      setResendBusy(false);
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
        description="Paid orders, platform earnings, and Paystack bank payouts."
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
              <span>Bank payouts</span>
              {(settlementData?.settlements || []).filter((s) => s.status !== 'success').length +
                payouts.filter((p: any) => p.status === 'PENDING').length >
                0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                  {(settlementData?.settlements || []).filter((s) => s.status !== 'success').length +
                    payouts.filter((p: any) => p.status === 'PENDING').length}
                </span>
              )}
            </button>
          </div>
        }
      />

      {/* Compact Financial Stats */}
      {revenueLoading ? (
        <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-8 rounded-lg" />
          ))}
        </div>
      ) : (
        summary && (
          <div className="mb-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[
              { label: 'Platform', value: formatNaira(summary.platformRevenue), tone: 'text-rose-500' },
              { label: 'GMV', value: formatNaira(summary.totalGmv), tone: 'text-neutral-900 dark:text-white' },
              { label: 'Paystack', value: formatNaira(summary.processingFees), tone: 'text-neutral-900 dark:text-white' },
              { label: 'Hosts', value: formatNaira(summary.organizerPayouts), tone: 'text-emerald-600 dark:text-emerald-400' },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-baseline justify-between gap-2 rounded-lg border border-neutral-200 bg-white px-2.5 py-1.5 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  {item.label}
                </span>
                <span className={cn('text-sm font-bold tabular-nums', item.tone)}>{item.value}</span>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'transactions' && (
        <div className="mb-3 rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 px-2.5 py-2 border-b border-neutral-100 dark:border-neutral-800">
            <input
              value={resolveRef}
              onChange={(e) => setResolveRef(e.target.value)}
              placeholder="Paystack reference…"
              className="h-7 min-w-0 flex-1 rounded-md border border-neutral-200 bg-white px-2 text-xs dark:border-neutral-700 dark:bg-neutral-950"
            />
            <Button
              size="sm"
              disabled={resolveBusy || !resolveRef.trim()}
              onClick={() => handleResolvePayment()}
              className="h-7 shrink-0 rounded-md bg-rose-500 px-2.5 text-xs font-bold text-white hover:bg-rose-600"
            >
              {resolveBusy ? '…' : 'Verify'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pendingLoading || sweepBusy}
              onClick={() => void loadPendingPayments()}
              className="h-7 rounded-md text-[11px] px-2"
              title="Refresh open checkouts"
            >
              <RefreshCw className={cn('h-3 w-3', pendingLoading && 'animate-spin')} />
            </Button>
            <Button
              size="sm"
              disabled={sweepBusy || pendingRows.length === 0}
              onClick={() => void handleSweepPending()}
              className="h-7 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold px-2"
              title="Fulfill paid ones; clear abandoned"
            >
              {sweepBusy ? '…' : `Clean (${pendingRows.length})`}
            </Button>
          </div>

          {(resolveError || sweepError || sweepNotice || resolveResult) && (
            <div className="px-2.5 py-1.5 space-y-1 border-b border-neutral-100 dark:border-neutral-800">
              {resolveError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {resolveError}
                </p>
              )}
              {sweepError && (
                <p className="text-[11px] text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" /> {sweepError}
                </p>
              )}
              {sweepNotice && (
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 shrink-0" /> {sweepNotice}
                </p>
              )}
              {resolveResult && (
                <p className="text-[11px] text-neutral-600 dark:text-neutral-300">
                  {resolveResult.message ||
                    (resolveResult.resolved
                      ? 'Fulfilled / already fulfilled'
                      : resolveResult.abandoned
                        ? 'Not paid — cleared from list'
                        : `Paystack: ${resolveResult.paystack?.status ?? 'unknown'}`)}
                </p>
              )}
            </div>
          )}

          {pendingLoading ? (
            <p className="px-2.5 py-2 text-[11px] text-neutral-400">Loading open checkouts…</p>
          ) : pendingRows.length === 0 ? (
            <p className="px-2.5 py-2 text-[11px] text-neutral-400">
              No open checkouts (2 min–14 days). Abandoned ones clear when you tap Clean.
            </p>
          ) : (
            <div className="max-h-36 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800">
              {pendingRows.map((row) => (
                <div
                  key={row.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 text-[11px]"
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 text-left truncate font-mono text-neutral-700 dark:text-neutral-300 hover:text-rose-500"
                    title={`${row.email || 'no email'} · ${row.eventTitle || 'Event'}`}
                    onClick={() => setResolveRef(row.reference)}
                  >
                    {row.reference}
                    <span className="ml-1.5 font-sans text-neutral-400">
                      {formatNaira(row.chargeAmount)}
                    </span>
                  </button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={resolveBusy}
                    onClick={() => void handleResolvePayment(row.reference)}
                    className="h-6 rounded-md text-[10px] px-2 shrink-0"
                  >
                    Check
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

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
                  id: 'bank',
                  header: 'Bank',
                  cell: (tx: TransactionItem) => {
                    const label = bankPayoutLabel(
                      tx,
                      tx.paymentReference
                        ? settlementData?.byReference?.[tx.paymentReference]
                        : undefined,
                    );
                    if (!label) return <span className="text-[11px] text-neutral-300">—</span>;
                    return (
                      <span
                        className={cn(
                          'text-[10px] font-semibold',
                          label.tone === 'ok' && 'text-emerald-600 dark:text-emerald-400',
                          label.tone === 'wait' && 'text-amber-700 dark:text-amber-400',
                          label.tone === 'bad' && 'text-red-600 dark:text-red-400',
                          label.tone === 'muted' && 'text-neutral-400',
                        )}
                      >
                        {label.text}
                      </span>
                    );
                  },
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
        <div className="space-y-3">
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900">
            <div className="border-b border-neutral-100 px-3 py-2 dark:border-neutral-800">
              <h2 className="text-sm font-semibold">Paystack bank payouts</h2>
              <p className="text-[11px] text-neutral-500">
                Split sales do not create a payout request. Paystack sends the host share the next business day. Paid out means the money has left Paystack for the bank.
              </p>
            </div>
            {settlementsLoading ? (
              <div className="space-y-2 p-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : !settlementData?.configured ? (
              <p className="px-3 py-4 text-sm text-neutral-500">Paystack is not connected.</p>
            ) : (settlementData.settlements || []).length === 0 ? (
              <p className="px-3 py-4 text-sm text-neutral-500">
                No bank payout yet. A paid sale shows here the next business day.
              </p>
            ) : (
              <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {settlementData.settlements.map((settlement) => (
                  <div key={settlement.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">
                        {settlement.organizationName || settlement.businessName || 'PartyStorm'}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {settlement.settlementDate
                          ? formatSettleDay(new Date(settlement.settlementDate))
                          : 'Date pending'}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-bold tabular-nums">{formatNaira(settlement.amount)}</p>
                      <p
                        className={cn(
                          'text-[10px] font-bold uppercase',
                          settlement.status === 'success'
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : settlement.status === 'failed'
                              ? 'text-red-600'
                              : 'text-amber-700 dark:text-amber-400',
                        )}
                      >
                        {settlement.status === 'success' ? 'Paid out' : settlement.status || 'Pending'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {payouts.length > 0 && (
            payoutsLoading ? (
              <DataTableSkeleton rows={4} columns={5} />
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
              emptyTitle="No payout requests"
              emptyDescription="Manual payout requests are only for sales that were not split to a bank."
            />
            )
          )}
        </div>
      )}

      {/* Transaction Details Modal */}
      <Dialog open={Boolean(selectedTx)} onOpenChange={(o) => !o && setSelectedTx(null)}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-y-auto p-4 sm:p-5 pr-12">
          {selectedTx && (() => {
            const isFree =
              selectedTx.type === 'TICKET' &&
              (!selectedTx.totalAmount || selectedTx.totalAmount <= 0) &&
              !selectedTx.paymentReference;
            const bank = !isFree
              ? bankPayoutLabel(
                  selectedTx,
                  selectedTx.paymentReference
                    ? settlementData?.byReference?.[selectedTx.paymentReference]
                    : undefined,
                )
              : null;

            return (
              <>
                <DialogHeader className="pr-2 text-left space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <DialogTitle className="text-base font-extrabold">
                      {isFree ? 'Free order' : 'Order'} #{selectedTx.txId}
                    </DialogTitle>
                    <span
                      className={cn(
                        'text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full',
                        statusBadge(selectedTx.status),
                      )}
                    >
                      {isFree ? 'Free' : selectedTx.status}
                    </span>
                  </div>
                  <DialogDescription className="text-xs text-neutral-400">
                    {selectedTx.event?.title || 'Event'} ·{' '}
                    {new Date(selectedTx.createdAt).toLocaleString()}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-3 mt-1 text-xs">
                  <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-1.5">
                    <p className="font-bold text-neutral-900 dark:text-white">
                      {selectedTx.buyer?.name || 'Guest'}
                    </p>
                    <p className="text-neutral-500 truncate">
                      {selectedTx.buyer?.email || 'No email'}
                    </p>
                    {selectedTx.event?.organization && (
                      <p className="text-neutral-400 truncate">
                        Host: {selectedTx.event.organization}
                      </p>
                    )}
                  </div>

                  {!isFree && selectedTx.paymentReference && (
                    <div className="flex items-center gap-2 rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2">
                      <p className="min-w-0 flex-1 font-mono text-[11px] truncate text-neutral-700 dark:text-neutral-300">
                        {selectedTx.paymentReference}
                      </p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 rounded-lg px-2 shrink-0"
                        onClick={() => copyReference(selectedTx.paymentReference!)}
                      >
                        {copiedRef ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  )}

                  {!isFree && (
                    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 px-3 py-2.5 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Paid</span>
                        <span className="font-bold">{formatNaira(selectedTx.totalAmount)}</span>
                      </div>
                      {(selectedTx.platformFee > 0 || selectedTx.processingFee > 0) && (
                        <>
                          <div className="flex justify-between text-neutral-500">
                            <span>PartyStorm</span>
                            <span>{formatNaira(selectedTx.platformFee)}</span>
                          </div>
                          <div className="flex justify-between text-neutral-500">
                            <span>Paystack</span>
                            <span>{formatNaira(selectedTx.processingFee)}</span>
                          </div>
                          <div className="flex justify-between font-semibold text-emerald-600 dark:text-emerald-400 pt-1 border-t border-neutral-100 dark:border-neutral-800">
                            <span>Host net</span>
                            <span>{formatNaira(selectedTx.netAmount)}</span>
                          </div>
                        </>
                      )}
                      {bank && (
                        <p className="text-[11px] text-neutral-500 pt-0.5">Bank: {bank.text}</p>
                      )}
                    </div>
                  )}

                  {selectedTx.tickets && selectedTx.tickets.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Tickets ({selectedTx.tickets.length})
                      </p>
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {selectedTx.tickets.map((t) => (
                          <div
                            key={t.id}
                            className="flex items-center justify-between rounded-lg border border-neutral-200 dark:border-neutral-800 px-2.5 py-1.5"
                          >
                            <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                              {t.ticketType?.name || 'General'}
                            </span>
                            <span className="text-[10px] font-bold uppercase text-emerald-600 shrink-0 ml-2">
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTx.type === 'TICKET' &&
                    selectedTx.tickets &&
                    selectedTx.tickets.length > 0 && (
                      <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 p-3 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                          <Mail className="h-3 w-3 text-rose-500" /> Resend to email
                        </p>
                        <div className="flex items-center gap-2">
                          <input
                            type="email"
                            value={resendEmail}
                            onChange={(e) => setResendEmail(e.target.value)}
                            placeholder="email@example.com"
                            className="h-8 min-w-0 flex-1 rounded-lg border border-neutral-200 bg-white px-2.5 text-xs dark:border-neutral-700 dark:bg-neutral-950"
                          />
                          <Button
                            size="sm"
                            disabled={resendBusy || !resendEmail.trim()}
                            onClick={() => void handleResendTickets()}
                            className="h-8 shrink-0 rounded-lg bg-rose-500 px-3 text-xs font-bold text-white hover:bg-rose-600"
                          >
                            {resendBusy ? '…' : 'Send'}
                          </Button>
                        </div>
                        {resendError && (
                          <p className="text-[11px] text-red-500 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" /> {resendError}
                          </p>
                        )}
                        {resendNotice && (
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> {resendNotice}
                          </p>
                        )}
                      </div>
                    )}
                </div>

                <DialogFooter className="mt-3 gap-2 sm:justify-between">
                  {selectedTx.paymentReference ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl text-xs"
                      onClick={() => {
                        const reference = selectedTx.paymentReference!;
                        setResolveRef(reference);
                        setSelectedTx(null);
                        handleResolvePayment(reference);
                      }}
                    >
                      <RefreshCw className="h-3 w-3 mr-1" /> Re-verify
                    </Button>
                  ) : (
                    <span />
                  )}
                  <Button
                    size="sm"
                    className="bg-rose-500 text-white rounded-xl text-xs font-bold"
                    onClick={() => setSelectedTx(null)}
                  >
                    Done
                  </Button>
                </DialogFooter>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactionsPage;

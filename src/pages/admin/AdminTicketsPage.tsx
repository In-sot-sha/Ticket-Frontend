import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, User as UserIcon, Download, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { useAdminTickets } from '../../hooks/queries/useAdmin';
import { downloadCSV } from '../../lib/exportCSV';
import { cn } from '../../lib/utils';
import { Button } from '../../components/ui/Button';
import { api } from '../../services/api';
import { formatNaira } from '../../lib/eventOrganizer';

const statusBadgeClass: Record<string, string> = {
  VALID: 'bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200/50',
  USED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 border border-neutral-200/50',
};

const paymentLabel = (method?: string | null) => {
  if (method === 'CASH') return 'Cash';
  if (method === 'POS') return 'POS';
  if (method === 'TRANSFER') return 'Transfer';
  if (method === 'FREE') return 'Free';
  return '—';
};

const AdminTicketsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const { data: tickets = [], isLoading } = useAdminTickets();

  useEffect(() => {
    api.tickets
      .getAdminAudit(80)
      .then((res) => setAuditLogs(res.data || []))
      .catch(() => setAuditLogs([]));
  }, []);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t: any) => {
      const buyerName = (t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || '').toLowerCase();
      const buyerEmail = (t.user?.email || t.buyerEmail || '').toLowerCase();
      const eventTitle = (t.event?.title || '').toLowerCase();
      const query = search.toLowerCase();
      const matchesSearch =
        buyerName.includes(query) || buyerEmail.includes(query) || eventTitle.includes(query);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const collections = useMemo(() => {
    const sums = { CASH: 0, POS: 0, TRANSFER: 0 };
    const byStaff = new Map<string, { id: string; name: string; cash: number; pos: number; transfer: number; tickets: number }>();
    for (const ticket of tickets) {
      const amount = Number(ticket.amountPaid) || 0;
      if (ticket.paymentMethod === 'CASH') sums.CASH += amount;
      if (ticket.paymentMethod === 'POS') sums.POS += amount;
      if (ticket.paymentMethod === 'TRANSFER') sums.TRANSFER += amount;
      if (ticket.soldBy) {
        const staffKey = String(ticket.soldBy.id);
        const staffName = `${ticket.soldBy.firstName} ${ticket.soldBy.lastName}`.trim();
        const row = byStaff.get(staffKey) || { id: staffKey, name: staffName, cash: 0, pos: 0, transfer: 0, tickets: 0 };
        row.tickets += 1;
        if (ticket.paymentMethod === 'CASH') row.cash += amount;
        if (ticket.paymentMethod === 'POS') row.pos += amount;
        if (ticket.paymentMethod === 'TRANSFER') row.transfer += amount;
        byStaff.set(staffKey, row);
      }
    }
    return { ...sums, staff: Array.from(byStaff.values()).sort((a, b) => b.tickets - a.tickets) };
  }, [tickets]);

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Event Name', 'Buyer Name', 'Buyer Email', 'Ticket Type', 'Payment', 'Sold By', 'Status', 'Purchased At'];
    const rows = filteredTickets.map((t: any) => [
      t.id,
      t.event?.title || 'N/A',
      t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || 'Guest',
      t.user?.email || t.buyerEmail || 'N/A',
      t.ticketType?.name || 'N/A',
      paymentLabel(t.paymentMethod),
      t.soldBy ? `${t.soldBy.firstName} ${t.soldBy.lastName}`.trim() : '—',
      t.status || 'VALID',
      new Date(t.createdAt).toLocaleDateString('en-NG'),
    ]);
    downloadCSV(headers, rows, 'platform_tickets_export.csv');
  };

  const columns: DataTableColumn<any>[] = [
    {
      id: 'event',
      header: 'Event',
      cell: (t) => (
        <div className="flex items-center gap-2 min-w-0">
          <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shrink-0">
            <Calendar className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold truncate">{t.event?.title || 'Unknown'}</p>
            <p className="text-[10px] text-neutral-400">ID {t.eventId}</p>
          </div>
        </div>
      ),
    },
    {
      id: 'buyer',
      header: 'Buyer',
      cell: (t) => {
        const name = t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || 'Guest';
        const email = t.user?.email || t.buyerEmail || 'N/A';
        return (
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
              <UserIcon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold truncate">{name}</p>
              <p className="text-[10px] text-neutral-400 truncate">{email}</p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'type',
      header: 'Ticket',
      cell: (t) => (
        <div>
          <p className="text-xs font-semibold">{t.ticketType?.name || 'General'}</p>
          <p className="text-[10px] text-neutral-400">
            {t.qrCode?.substring(0, 8).toUpperCase() || '—'}
          </p>
        </div>
      ),
    },
    {
      id: 'payment',
      header: 'Paid',
      cell: (t) => (
        <div>
          <p className="text-xs font-semibold">{paymentLabel(t.paymentMethod)}</p>
          {t.amountPaid > 0 && (
            <p className="text-[10px] text-neutral-400 tabular-nums">{formatNaira(t.amountPaid)}</p>
          )}
        </div>
      ),
    },
    {
      id: 'soldBy',
      header: 'Sold by',
      hideOnMobile: true,
      cell: (t) => (
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          {t.soldBy ? `${t.soldBy.firstName} ${t.soldBy.lastName}`.trim() : '—'}
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (t) => (
        <span
          className={cn(
            'inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border',
            statusBadgeClass[t.status] || statusBadgeClass.VALID
          )}
        >
          {t.status || 'VALID'}
        </span>
      ),
    },
    {
      id: 'date',
      header: 'Issued',
      hideOnMobile: true,
      cell: (t) => (
        <span className="text-[11px] text-neutral-500">
          {new Date(t.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </span>
      ),
    },
  ];

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6 space-y-4">
      <PageHeader
        title="Ticket"
        accent="Audit"
        description="Gate collections, staff totals, and every ticket issued on the platform."
        actions={
          filteredTickets.length > 0 ? (
            <Button
              variant="outline"
              className="rounded-xl text-xs font-bold h-10"
              onClick={handleExportCSV}
            >
              <Download className="h-4 w-4 mr-1.5" />
              Export CSV
            </Button>
          ) : null
        }
      />

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Cash</span>
            <Banknote className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-sm sm:text-lg font-bold tabular-nums">{formatNaira(collections.CASH)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">POS</span>
            <CreditCard className="h-3.5 w-3.5 text-sky-500" />
          </div>
          <p className="text-sm sm:text-lg font-bold tabular-nums">{formatNaira(collections.POS)}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Transfer</span>
            <ArrowLeftRight className="h-3.5 w-3.5 text-violet-500" />
          </div>
          <p className="text-sm sm:text-lg font-bold tabular-nums">{formatNaira(collections.TRANSFER)}</p>
        </div>
      </div>

      {collections.staff.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Staff collections</p>
          <ul className="space-y-1.5">
            {collections.staff.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-2 text-xs">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200 truncate">{s.name}</span>
                <span className="text-neutral-500 tabular-nums shrink-0">
                  {s.tickets} tix · Cash {formatNaira(s.cash)} · POS {formatNaira(s.pos)} · Trf {formatNaira(s.transfer)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {auditLogs.length > 0 && (
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">Activity log</p>
          <ul className="space-y-1.5 max-h-56 overflow-y-auto">
            {auditLogs.map((log) => {
              const actor = log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : 'Unknown';
              const meta = log.metadata || {};
              const when = new Date(log.createdAt).toLocaleString('en-NG', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });
              let detail = String(log.action || '').replace(/_/g, ' ').toLowerCase();
              if (log.action === 'GATE_SALE') {
                const pay = paymentLabel(meta.paymentMethod);
                detail = `sold ${meta.quantity || 1} × ${meta.ticketTypeName || 'ticket'}${pay !== '—' ? ` · ${pay}` : ''}${meta.amountPaid ? ` · ${formatNaira(Number(meta.amountPaid))}` : ''}`;
              } else if (log.action === 'CHECK_IN') {
                detail = `checked in ${meta.attendee || 'a guest'}${meta.ticketType ? ` (${meta.ticketType})` : ''}`;
              }
              return (
                <li key={log.id} className="text-xs text-neutral-600 dark:text-neutral-400 flex gap-2">
                  <span className="text-neutral-400 shrink-0 tabular-nums w-[92px]">{when}</span>
                  <span className="min-w-0">
                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">{actor}</span>{' '}
                    {detail}
                    {log.event?.title ? <span className="text-neutral-400"> · {log.event.title}</span> : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {isLoading ? (
        <DataTableSkeleton rows={8} columns={7} />
      ) : (
        <DataTable
          columns={columns}
          rows={filteredTickets}
          getRowId={(t) => t.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search buyer, email, or event…"
          pageSize={12}
          toolbar={
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[160px] h-10 rounded-xl">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="VALID">VALID</SelectItem>
                <SelectItem value="USED">USED</SelectItem>
              </SelectContent>
            </Select>
          }
          emptyTitle="No tickets found"
          emptyDescription="Try another search or status filter."
        />
      )}
    </div>
  );
};

export default AdminTicketsPage;

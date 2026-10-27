import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, User as UserIcon, Download, Banknote, CreditCard, ArrowLeftRight, Ticket, Users, ScrollText } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { DataTable, DataTableSkeleton, type DataTableColumn } from '../../components/ui/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
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

const paymentLabel = (method?: string | null, hasOrder?: boolean) => {
  if (method === 'CASH') return 'Cash';
  if (method === 'POS') return 'POS';
  if (method === 'TRANSFER') return 'Transfer';
  if (method === 'FREE') return 'Free';
  if (hasOrder) return 'Online';
  return '—';
};

/** What the buyer paid for this ticket. Gate stores amountPaid; online uses the order charge. */
function ticketPaid(ticket: any): number {
  const gate = Number(ticket.amountPaid) || 0;
  if (gate > 0) return gate;
  const face = Number(ticket.ticketType?.price) || 0;
  if (face <= 0) return 0;
  const charge = Number(ticket.order?.chargeAmount) || 0;
  const count = Number(ticket.order?._count?.tickets) || 0;
  if (charge > 0 && count === 1) return charge;
  return face;
}

function formatIssued(iso: string) {
  const date = new Date(iso);
  return {
    day: date.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' }),
    time: date.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' }),
  };
}

const tabTriggerClass =
  'data-[state=active]:border-rose-500 data-[state=active]:text-rose-500 data-[state=active]:bg-transparent rounded-none border-b-2 border-transparent py-2 px-3 data-[state=active]:shadow-none text-xs sm:text-sm font-bold flex items-center gap-1.5';

const AdminTicketsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const { data: tickets = [], isLoading } = useAdminTickets();

  useEffect(() => {
    api.tickets
      .getAdminAudit(80)
      .then((res) => setAuditLogs(res.data || []))
      .catch(() => setAuditLogs([]));
  }, []);

  const eventsList = useMemo(() => {
    const map = new Map<number, string>();
    for (const t of tickets) {
      if (t.eventId && t.event?.title) {
        map.set(t.eventId, t.event.title);
      }
    }
    return Array.from(map.entries())
      .map(([id, title]) => ({ id, title }))
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t: any) => {
      const buyerName = (t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || '').toLowerCase();
      const buyerEmail = (t.user?.email || t.buyerEmail || '').toLowerCase();
      const eventTitle = (t.event?.title || '').toLowerCase();
      const qrCode = (t.qrCode || '').toLowerCase();
      const query = search.toLowerCase();
      const matchesSearch =
        buyerName.includes(query) ||
        buyerEmail.includes(query) ||
        eventTitle.includes(query) ||
        qrCode.includes(query);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      const matchesEvent = eventFilter === 'all' || String(t.eventId) === eventFilter;
      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [tickets, search, statusFilter, eventFilter]);

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
    const headers = ['Ticket ID', 'Event Name', 'Buyer Name', 'Buyer Email', 'Ticket Type', 'Paid', 'Payment', 'Sold By', 'Status', 'Date'];
    const rows = filteredTickets.map((t: any) => {
      const issued = formatIssued(t.createdAt);
      return [
        t.id,
        t.event?.title || 'N/A',
        t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || 'Guest',
        t.user?.email || t.buyerEmail || 'N/A',
        t.ticketType?.name || 'N/A',
        ticketPaid(t),
        paymentLabel(t.paymentMethod, Boolean(t.order)),
        t.soldBy ? `${t.soldBy.firstName} ${t.soldBy.lastName}`.trim() : '—',
        t.status || 'VALID',
        `${issued.day} ${issued.time}`,
      ];
    });
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
      cell: (t) => {
        const paid = ticketPaid(t);
        const method = paymentLabel(t.paymentMethod, Boolean(t.order));
        const orderStatus = t.order?.status as string | undefined;
        return (
          <div>
            <p className="text-xs font-bold tabular-nums text-neutral-900 dark:text-white">
              {paid > 0 ? formatNaira(paid) : 'Free'}
            </p>
            <p className="text-[10px] text-neutral-500">
              {method}
              {orderStatus ? ` · ${orderStatus}` : ''}
            </p>
          </div>
        );
      },
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
      header: 'Date',
      cell: (t) => {
        const issued = formatIssued(t.createdAt);
        return (
          <div>
            <p className="text-xs font-semibold tabular-nums text-neutral-800 dark:text-neutral-200">{issued.day}</p>
            <p className="text-[10px] text-neutral-500 tabular-nums">{issued.time}</p>
          </div>
        );
      },
    },
  ];

  const collectionCards = [
    { label: 'Cash', amount: collections.CASH, icon: Banknote, iconClass: 'text-emerald-600' },
    { label: 'POS', amount: collections.POS, icon: CreditCard, iconClass: 'text-sky-600' },
    { label: 'Transfer', amount: collections.TRANSFER, icon: ArrowLeftRight, iconClass: 'text-violet-600' },
  ];

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title="Ticket"
        accent="Audit"
        description="Every ticket issued on the platform. Staff totals and the activity log sit in their own tabs."
      />

      <Tabs defaultValue="tickets" className="w-full">
        <TabsList className="mb-3 w-full flex overflow-x-auto overflow-y-hidden flex-nowrap bg-transparent border-b border-neutral-200/80 dark:border-neutral-800 rounded-none p-0 h-auto justify-start items-end">
          <TabsTrigger value="tickets" className={tabTriggerClass}>
            <Ticket className="h-3.5 w-3.5" />
            Tickets
            <span className="text-[10px] font-semibold tabular-nums text-neutral-400">{tickets.length}</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className={tabTriggerClass}>
            <Users className="h-3.5 w-3.5" />
            Staff collections
            {collections.staff.length > 0 && (
              <span className="text-[10px] font-semibold tabular-nums text-neutral-400">{collections.staff.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="activity" className={tabTriggerClass}>
            <ScrollText className="h-3.5 w-3.5" />
            Activity log
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="mt-0 focus-visible:outline-none">
          {isLoading ? (
            <DataTableSkeleton rows={8} columns={7} />
          ) : (
            <DataTable
              columns={columns}
              rows={filteredTickets}
              getRowId={(t) => t.id}
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search buyer, email, event, or QR code…"
              pageSize={12}
              toolbar={
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <Select value={eventFilter} onValueChange={setEventFilter}>
                    <SelectTrigger className="w-full sm:w-[210px] h-9 text-xs rounded-xl">
                      <SelectValue placeholder="All events" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">All Events ({eventsList.length})</SelectItem>
                      {eventsList.map((ev) => (
                        <SelectItem key={ev.id} value={String(ev.id)}>
                          {ev.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-[130px] h-9 text-xs rounded-xl">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="VALID">VALID</SelectItem>
                      <SelectItem value="USED">USED</SelectItem>
                    </SelectContent>
                  </Select>

                  {(eventFilter !== 'all' || statusFilter !== 'all') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                      onClick={() => {
                        setEventFilter('all');
                        setStatusFilter('all');
                      }}
                    >
                      Reset
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="rounded-xl text-xs font-bold h-9"
                    onClick={handleExportCSV}
                    disabled={filteredTickets.length === 0}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Export
                  </Button>
                </div>
              }
              emptyTitle="No tickets found"
              emptyDescription="Try another search, event, or status filter."
            />
          )}
        </TabsContent>

        <TabsContent value="staff" className="mt-0 focus-visible:outline-none space-y-3">
          <div className="grid grid-cols-3 divide-x divide-neutral-100 overflow-hidden rounded-xl border border-neutral-200/80 bg-white dark:divide-neutral-800 dark:border-neutral-800 dark:bg-neutral-900">
            {collectionCards.map((card) => (
              <div key={card.label} className="min-w-0 px-3 py-2.5">
                <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                  <card.icon className={cn('h-3.5 w-3.5', card.iconClass)} />
                  {card.label}
                </p>
                <p className="mt-1 text-sm sm:text-base font-bold tabular-nums text-neutral-900 dark:text-white">
                  {formatNaira(card.amount)}
                </p>
              </div>
            ))}
          </div>

          {collections.staff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No staff collections yet</p>
              <p className="text-xs text-neutral-500 mt-1">Gate sales tagged to a staff member show up here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 dark:bg-neutral-950/50 text-[10px] uppercase tracking-wider text-neutral-500">
                  <tr>
                    <th className="px-3 py-2.5 font-semibold">Staff</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Tickets</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Cash</th>
                    <th className="px-3 py-2.5 font-semibold text-right">POS</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Transfer</th>
                    <th className="px-3 py-2.5 font-semibold text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                  {collections.staff.map((s) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2.5 font-semibold text-neutral-800 dark:text-neutral-200">{s.name}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{s.tickets}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(s.cash)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(s.pos)}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{formatNaira(s.transfer)}</td>
                      <td className="px-3 py-2.5 text-right font-bold tabular-nums">
                        {formatNaira(s.cash + s.pos + s.transfer)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="activity" className="mt-0 focus-visible:outline-none">
          {auditLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-10 text-center">
              <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No activity yet</p>
              <p className="text-xs text-neutral-500 mt-1">Gate sales and check-ins are recorded here.</p>
            </div>
          ) : (
            <ul className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800 max-h-[70vh] overflow-y-auto">
              {auditLogs.map((log) => {
                const actor = log.user ? `${log.user.firstName} ${log.user.lastName}`.trim() : 'Unknown';
                const meta = log.metadata || {};
                const when = new Date(log.createdAt);
                const day = when.toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
                const time = when.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit' });
                let detail = String(log.action || '').replace(/_/g, ' ').toLowerCase();
                if (log.action === 'GATE_SALE') {
                  const pay = paymentLabel(meta.paymentMethod);
                  detail = `sold ${meta.quantity || 1} × ${meta.ticketTypeName || 'ticket'}${pay !== '—' ? ` · ${pay}` : ''}${meta.amountPaid ? ` · ${formatNaira(Number(meta.amountPaid))}` : ''}`;
                } else if (log.action === 'CHECK_IN') {
                  detail = `checked in ${meta.attendee || 'a guest'}${meta.ticketType ? ` (${meta.ticketType})` : ''}`;
                }
                return (
                  <li key={log.id} className="px-3 py-2.5 flex gap-3 text-xs">
                    <span className="shrink-0 w-[72px] tabular-nums text-neutral-400">
                      <span className="block font-semibold text-neutral-600 dark:text-neutral-300">{day}</span>
                      {time}
                    </span>
                    <span className="min-w-0 text-neutral-600 dark:text-neutral-400">
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200">{actor}</span>{' '}
                      {detail}
                      {log.event?.title ? <span className="text-neutral-400"> · {log.event.title}</span> : null}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminTicketsPage;

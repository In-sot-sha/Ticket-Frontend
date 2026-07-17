import React, { useMemo, useState } from 'react';
import { Calendar, User as UserIcon, Download } from 'lucide-react';
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

const statusBadgeClass: Record<string, string> = {
  VALID: 'bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200/50',
  USED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 border border-neutral-200/50',
};

const AdminTicketsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { data: tickets = [], isLoading } = useAdminTickets();

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

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Event Name', 'Buyer Name', 'Buyer Email', 'Ticket Type', 'Status', 'Purchased At'];
    const rows = filteredTickets.map((t: any) => [
      t.id,
      t.event?.title || 'N/A',
      t.user ? `${t.user.firstName} ${t.user.lastName}` : t.buyerName || 'Guest',
      t.user?.email || t.buyerEmail || 'N/A',
      t.ticketType?.name || 'N/A',
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
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <PageHeader
        title="Ticket"
        accent="Audit"
        description="Browse, search, and audit all tickets issued on the platform."
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

      {isLoading ? (
        <DataTableSkeleton rows={8} columns={5} />
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

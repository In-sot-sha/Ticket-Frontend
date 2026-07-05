import React, { useState } from 'react';
import { Search, Ticket, Calendar, Shield, User as UserIcon, Download } from 'lucide-react';
import { Spinner } from '../../components/ui/Spinner';
import { useAdminTickets } from '../../hooks/queries/useAdmin';
import { downloadCSV } from '../../lib/exportCSV';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'VALID', 'USED'] as const;

const statusBadgeClass: Record<string, string> = {
  VALID: 'bg-green-50 dark:bg-green-950/30 text-green-600 border border-green-200/50',
  USED: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 border border-neutral-200/50',
};

const AdminTicketsPage = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: tickets = [], isLoading } = useAdminTickets();

  const filteredTickets = React.useMemo(() => {
    return tickets.filter((t: any) => {
      const buyerName = (t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.buyerName || '')).toLowerCase();
      const buyerEmail = (t.user?.email || t.buyerEmail || '').toLowerCase();
      const eventTitle = (t.event?.title || '').toLowerCase();
      const query = search.toLowerCase();

      const matchesSearch = buyerName.includes(query) || buyerEmail.includes(query) || eventTitle.includes(query);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tickets, search, statusFilter]);

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Event Name', 'Buyer Name', 'Buyer Email', 'Ticket Type', 'Status', 'Purchased At'];
    const rows = filteredTickets.map((t: any) => [
      t.id,
      t.event?.title || 'N/A',
      t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.buyerName || 'Guest'),
      t.user?.email || t.buyerEmail || 'N/A',
      t.ticketType?.name || 'N/A',
      t.status || 'VALID',
      new Date(t.createdAt).toLocaleDateString('en-NG'),
    ]);
    downloadCSV(headers, rows, 'platform_tickets_export.csv');
  };

  return (
    <div className="py-4 px-2 sm:px-2 max-w-7xl mx-auto text-neutral-900 dark:text-neutral-100 pb-6">
      <div className="mb-6 border-b border-neutral-100 dark:border-neutral-900 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Ticket <span className="text-rose-500">Audit</span>
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Browse, search, and audit all tickets issued on the platform.
          </p>
        </div>
        
        {filteredTickets.length > 0 && (
          <button
            onClick={handleExportCSV}
            className="self-start sm:self-center flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-white dark:bg-neutral-900 border border-neutral-250 dark:border-neutral-750 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-55 dark:hover:bg-neutral-800 rounded-xl shadow-sm transition-colors cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Export Tickets CSV
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Search by buyer name, email, or event title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3.5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors cursor-pointer',
                statusFilter === status
                  ? 'bg-rose-500 text-white'
                  : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
              )}
            >
              {status === 'all' ? 'All statuses' : status}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Spinner />
        </div>
      ) : (
        <div className="border border-neutral-100 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-5 py-3 bg-neutral-50 dark:bg-neutral-800/50 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            <div className="col-span-3">Event</div>
            <div className="col-span-3">Buyer</div>
            <div className="col-span-2">Ticket Type</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-2 text-right">Issued Date</div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {filteredTickets.length === 0 ? (
              <p className="px-5 py-12 text-sm text-neutral-500 text-center">No tickets found</p>
            ) : (
              filteredTickets.map((t: any) => {
                const buyerName = t.user ? `${t.user.firstName} ${t.user.lastName}` : (t.buyerName || 'Guest');
                const buyerEmail = t.user?.email || t.buyerEmail || 'N/A';
                const statusColor = statusBadgeClass[t.status] || 'bg-neutral-100 text-neutral-600';

                return (
                  <div
                    key={t.id}
                    className="px-5 py-4 grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 md:items-center"
                  >
                    {/* Event info */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center text-rose-500 shrink-0">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {t.event?.title || 'Unknown Event'}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          ID: {t.eventId}
                        </p>
                      </div>
                    </div>

                    {/* Buyer info */}
                    <div className="md:col-span-3 flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-500 shrink-0">
                        <UserIcon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {buyerName}
                        </p>
                        <p className="text-[10px] text-neutral-400 truncate">
                          {buyerEmail}
                        </p>
                      </div>
                    </div>

                    {/* Ticket Type */}
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                        {t.ticketType?.name || 'General Ticket'}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        Code: {t.qrCode?.substring(0, 8).toUpperCase() || 'N/A'}
                      </p>
                    </div>

                    {/* Status */}
                    <div className="md:col-span-2 text-center">
                      <span className={cn('inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full', statusColor)}>
                        {t.status || 'VALID'}
                      </span>
                    </div>

                    {/* Date */}
                    <div className="md:col-span-2 text-right text-[11px] text-neutral-500">
                      {new Date(t.createdAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTicketsPage;

import React, { useEffect, useState, useMemo } from 'react';
import { Users, Download, Plus, UserCheck, Ticket } from 'lucide-react';
import { api } from '../../services/api';
import { Link } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { Button } from '../ui/Button';
import { DataTable, type DataTableColumn } from '../ui/data-table';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { downloadCSV } from '../../lib/exportCSV';

interface AttendeesTabProps {
  eventId?: number;
  eventSlug?: string | null;
}

type StatusFilter = 'all' | 'checked_in' | 'registered';

export const AttendeesTab: React.FC<AttendeesTabProps> = ({ eventId, eventSlug }) => {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.tickets
      .getEventAttendance(eventId)
      .then((res) => setAttendees(res.data || []))
      .catch(() => setError('Failed to load attendees'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const groupedAttendees = useMemo(() => {
    const map = new Map<string, any>();
    attendees.forEach((ticket) => {
      const email = ticket.user?.email || ticket.buyerEmail || 'unknown';
      if (!map.has(email)) {
        map.set(email, {
          user: ticket.user,
          email,
          name: ticket.user
            ? `${ticket.user.firstName} ${ticket.user.lastName}`
            : ticket.buyerName || 'Guest',
          phone: ticket.user?.phone || ticket.buyerPhone || '—',
          ticketTypes: new Set<string>(),
          tickets: [],
          checkedInCount: 0,
        });
      }
      const group = map.get(email);
      group.tickets.push(ticket);
      if (ticket.ticketType?.name) {
        group.ticketTypes.add(ticket.ticketType.name);
      }
      if (ticket.status === 'USED') {
        group.checkedInCount++;
      }
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [attendees]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedAttendees.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone !== '—' && String(a.phone).toLowerCase().includes(q));

      const anyCheckedIn = a.checkedInCount > 0;

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'checked_in' && anyCheckedIn) ||
        (statusFilter === 'registered' && !anyCheckedIn);

      return matchesQuery && matchesStatus;
    });
  }, [groupedAttendees, query, statusFilter]);

  const totalTickets = attendees.length;
  const checkedInTickets = attendees.filter((t) => t.status === 'USED').length;
  const checkInRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0;

  const exportCsv = () => {
    const rows = filtered.map((a) => [
      a.name,
      a.email,
      a.phone,
      Array.from(a.ticketTypes).join(' | '),
      a.tickets.length,
      a.checkedInCount > 0
        ? a.checkedInCount === a.tickets.length
          ? 'All Checked In'
          : 'Partially Checked In'
        : 'Registered',
    ]);
    downloadCSV(
      ['Name', 'Email', 'Phone', 'Ticket Types', 'Tickets Count', 'Status'],
      rows,
      `attendees_${eventId || 'event'}.csv`
    );
  };

  if (loading) {
    return (
      <div className="space-y-4 px-4 sm:px-0 py-2">
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 px-4">
        <p className="text-sm text-rose-500 font-medium">{error}</p>
      </div>
    );
  }

  if (groupedAttendees.length === 0) {
    return (
      <div className="mx-4 sm:mx-0 text-center py-16 px-4 border border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl bg-neutral-50 dark:bg-neutral-900/20">
        <Users className="h-12 w-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-sm font-bold text-neutral-900 dark:text-white mb-1">No attendees yet</p>
        <p className="text-xs text-neutral-500 mb-6 max-w-sm mx-auto">
          Share your event link or add someone manually to start filling the list.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              navigator.clipboard.writeText(
                `${window.location.origin}/events/${eventSlug || eventId}`
              );
            }}
          >
            Copy event link
          </Button>
          <Link to={`/organizer/events/${eventSlug || eventId}/add-attendee`}>
            <Button size="sm" className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0">
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Add attendee
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const filters: { id: StatusFilter; label: string }[] = [
    { id: 'all', label: `All (${groupedAttendees.length})` },
    {
      id: 'checked_in',
      label: `Checked in (${groupedAttendees.filter((a) => a.checkedInCount > 0).length})`,
    },
    {
      id: 'registered',
      label: `Not checked in (${groupedAttendees.filter((a) => a.checkedInCount === 0).length})`,
    },
  ];

  return (
    <div className="space-y-3 px-4 sm:px-0">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 sm:p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">People</span>
            <Users className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{groupedAttendees.length}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 sm:p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Tickets</span>
            <Ticket className="h-3.5 w-3.5 text-neutral-400" />
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">{totalTickets}</p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 sm:p-3">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Checked in</span>
            <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-lg font-bold text-neutral-900 dark:text-white">
            {checkedInTickets}
            <span className="text-xs font-semibold text-neutral-400 ml-1">{checkInRate}%</span>
          </p>
        </div>
      </div>

      {/* Toolbar + table */}
      <DataTable
        columns={
          [
            {
              id: 'name',
              header: 'Name',
              cell: (a) => <span className="font-medium">{a.name}</span>,
            },
            {
              id: 'contact',
              header: 'Contact',
              cell: (a) => (
                <div>
                  <p className="text-neutral-600 dark:text-neutral-400 truncate max-w-[220px]">{a.email}</p>
                  {a.phone !== '—' && <p className="text-xs text-neutral-500 mt-0.5">{a.phone}</p>}
                </div>
              ),
            },
            {
              id: 'tickets',
              header: 'Tickets',
              cell: (a) => (
                <span className="text-xs text-neutral-600 dark:text-neutral-400">
                  {Array.from(a.ticketTypes).join(', ') || '—'}
                </span>
              ),
            },
            {
              id: 'qty',
              header: 'Qty',
              cell: (a) => (
                <span className="inline-flex items-center justify-center bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 w-7 h-7 rounded-full text-xs font-bold">
                  {a.tickets.length}
                </span>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (a) =>
                a.checkedInCount > 0 ? (
                  <span className="inline-flex items-center text-[10px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full">
                    {a.checkedInCount === a.tickets.length
                      ? '✓ All checked in'
                      : `${a.checkedInCount}/${a.tickets.length} checked in`}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[10px] font-medium px-2.5 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full">
                    Registered
                  </span>
                ),
            },
          ] as DataTableColumn<(typeof filtered)[0]>[]
        }
        rows={filtered}
        getRowId={(a) => a.email}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, email, phone…"
        pageSize={10}
        toolbar={
          <>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
              <SelectTrigger className="h-10 w-[180px] rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold shadow-none">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {filters.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button onClick={exportCsv} variant="outline" size="sm" className="rounded-full text-xs gap-1.5 h-10">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button>
            <Link to={`/organizer/events/${eventSlug || eventId}/add-attendee`}>
              <Button size="sm" className="rounded-full text-xs h-10 bg-rose-500 hover:bg-rose-600 text-white border-0">
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add
              </Button>
            </Link>
          </>
        }
        emptyTitle="No matches"
        emptyDescription="Try a different search or filter."
      />
    </div>
  );
};

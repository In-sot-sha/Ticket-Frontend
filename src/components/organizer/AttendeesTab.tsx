import React, { useEffect, useState, useMemo } from 'react';
import { Users, Download, Plus, UserCheck, Ticket, CalendarCheck, Check, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';
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
import { formatNaira } from '../../lib/eventOrganizer';
import { eventDayList, longDayLabel, shortDayChip, todayYmd, ymdFromUnknown } from '../../lib/ticketValidity';

interface AttendeesTabProps {
  eventId?: number;
  eventSlug?: string | null;
  event?: any;
  readOnly?: boolean;
  isAdmin?: boolean;
}

const personKey = (ticket: any) => {
  if (ticket.user?.id) return `u:${ticket.user.id}`;
  const email = (ticket.user?.email || ticket.buyerEmail || '').trim().toLowerCase();
  if (email && email !== 'unknown') return `e:${email}`;
  const phone = (ticket.user?.phone || ticket.buyerPhone || '').trim();
  if (phone) return `p:${phone}`;
  return `t:${ticket.id}`;
};

const personName = (ticket: any) => {
  if (ticket.user?.firstName) {
    return `${ticket.user.firstName} ${ticket.user.lastName || ''}`.replace(/\s+Guest$/, '').trim();
  }
  return ticket.buyerName || 'Guest';
};

const saleChannel = (ticket: any) => {
  const method = String(ticket.paymentMethod || '');
  if (method === 'CASH') return 'Cash';
  if (method === 'POS') return 'POS';
  if (method === 'TRANSFER') return 'Transfer';
  if (method === 'FREE' || ticket.ticketType?.price === 0) return 'Free';
  if (ticket.purchaseType === 'GATE') return 'Gate';
  if (ticket.order || ticket.purchaseType === 'ONLINE') return 'Online';
  return '';
};

const saleAmount = (ticket: any) => {
  const gate = Number(ticket.amountPaid) || 0;
  if (gate > 0) return gate;
  const face = Number(ticket.ticketType?.price) || 0;
  const charge = Number(ticket.order?.chargeAmount) || 0;
  const count = Number(ticket.order?._count?.tickets) || 0;
  if (charge > 0 && count === 1) return charge;
  return face;
};

const TicketNumberCell: React.FC<{ ticket: any }> = ({ ticket }) => {
  const [copied, setCopied] = useState(false);
  const code = ticket.qrCode || String(ticket.id);
  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="py-0.5">
      <button
        type="button"
        onClick={handleCopy}
        title={`Click to copy code: ${code}`}
        className="inline-flex items-center gap-1 font-mono font-bold text-xs bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-2 py-1 rounded-md border border-neutral-300 dark:border-neutral-700 transition-colors cursor-pointer"
      >
        <span>#{ticket.id}</span>
        {copied && (
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-sans font-semibold">
            Copied!
          </span>
        )}
      </button>
      {ticket.qrCode && (
        <p className="font-mono text-[10px] text-neutral-400 mt-0.5 truncate max-w-[120px]" title={ticket.qrCode}>
          {ticket.qrCode}
        </p>
      )}
    </div>
  );
};

export const AttendeesTab: React.FC<AttendeesTabProps> = ({
  eventId,
  eventSlug,
  event,
  readOnly = false,
  isAdmin = false,
}) => {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [pageSize, setPageSize] = useState(10);
  const [viewMode, setViewMode] = useState<'tickets' | 'attendees'>(isAdmin ? 'tickets' : 'attendees');
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const isTicketCheckedIn = (ticket: any) =>
    ticket.status === 'USED' || (Array.isArray(ticket.checkIns) && ticket.checkIns.length > 0);

  const today = todayYmd();

  useEffect(() => {
    if (!eventId) return;
    setLoading(true);
    api.tickets
      .getEventAttendance(eventId)
      .then((ticketsRes) => {
        setAttendees(ticketsRes.data || []);
      })
      .catch(() => setError('Failed to load attendees'))
      .finally(() => setLoading(false));
  }, [eventId]);

  const inferredEvent = event || attendees[0]?.event;
  const eventDays = useMemo(() => {
    return eventDayList(inferredEvent?.startDate, inferredEvent?.endDate);
  }, [inferredEvent?.startDate, inferredEvent?.endDate]);

  const isMultiDay = eventDays.length > 1;

  const groupedAttendees = useMemo(() => {
    const map = new Map<string, any>();
    attendees.forEach((ticket) => {
      const key = personKey(ticket);
      if (!map.has(key)) {
        map.set(key, {
          key,
          user: ticket.user,
          email: ticket.user?.email || ticket.buyerEmail || '',
          name: personName(ticket),
          phone: ticket.user?.phone || ticket.buyerPhone || '',
          ticketTypeCounts: new Map<string, number>(),
          ticketTypeDetails: new Map<string, any>(),
          tickets: [],
          checkIns: [] as any[],
          attendedDays: new Set<string>(),
          checkInByDay: new Map<string, any>(),
          checkedInTicketsCount: 0,
          acceptedTerms: false,
          acceptedMarketing: false,
          termsAcceptedAt: null as string | null,
          boughtDays: new Set<string>(),
          channels: new Set<string>(),
          paid: 0,
        });
      }
      const group = map.get(key);
      group.tickets.push(ticket);
      if (ticket.order?.acceptedTerms) group.acceptedTerms = true;
      if (ticket.order?.acceptedMarketing) group.acceptedMarketing = true;
      if (ticket.order?.termsAcceptedAt && !group.termsAcceptedAt) {
        group.termsAcceptedAt = ticket.order.termsAcceptedAt;
      }
      const typeName = ticket.ticketType?.name || 'Ticket';
      group.ticketTypeCounts.set(typeName, (group.ticketTypeCounts.get(typeName) || 0) + 1);
      const bought = ymdFromUnknown(ticket.order?.createdAt || ticket.createdAt);
      if (bought) group.boughtDays.add(bought);
      const channel = saleChannel(ticket);
      if (channel) group.channels.add(channel);
      group.paid += saleAmount(ticket);
      if (ticket.ticketType && !group.ticketTypeDetails.has(typeName)) {
        group.ticketTypeDetails.set(typeName, ticket.ticketType);
      }

      const ticketCheckIns = Array.isArray(ticket.checkIns) ? ticket.checkIns : [];
      let hasTicketCheckIn = ticketCheckIns.length > 0;

      ticketCheckIns.forEach((ci: any) => {
        group.checkIns.push({ ...ci, ticketId: ticket.id });
        if (ci.eventDay) {
          group.attendedDays.add(ci.eventDay);
          if (!group.checkInByDay.has(ci.eventDay)) {
            group.checkInByDay.set(ci.eventDay, ci);
          }
        }
      });

      // Legacy fallback: if ticket has status === 'USED' but no TicketCheckIn row
      if (ticket.status === 'USED' && ticketCheckIns.length === 0) {
        hasTicketCheckIn = true;
        const fallbackDay = ticket.ticketType?.validOn
          ? ymdFromUnknown(ticket.ticketType.validOn)
          : (eventDays[0] || today);
        if (fallbackDay) {
          group.attendedDays.add(fallbackDay);
          if (!group.checkInByDay.has(fallbackDay)) {
            group.checkInByDay.set(fallbackDay, {
              id: 0,
              eventDay: fallbackDay,
              scannedBy: ticket.soldByUserId || null,
              createdAt: ticket.updatedAt || ticket.createdAt || new Date().toISOString(),
            });
          }
        }
      }

      if (hasTicketCheckIn) {
        group.checkedInTicketsCount++;
      }
    });

    const list = Array.from(map.values()).map((a) => {
      const isCheckedIn = a.attendedDays.size > 0 || a.checkedInTicketsCount > 0;
      return {
        ...a,
        isCheckedIn,
      };
    });

    return list.sort((a, b) => a.name.localeCompare(b.name));
  }, [attendees, eventDays, today]);

  const ticketTypeOptions = useMemo(() => {
    const names = new Set<string>();
    attendees.forEach((ticket) => names.add(ticket.ticketType?.name || 'Ticket'));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [attendees]);

  const dateOptions = useMemo(() => {
    const days = new Set<string>();
    attendees.forEach((ticket) => {
      const bought = ymdFromUnknown(ticket.order?.createdAt || ticket.createdAt);
      if (bought) days.add(bought);
      (ticket.checkIns || []).forEach((ci: any) => {
        if (ci.eventDay) days.add(ci.eventDay);
      });
    });
    return Array.from(days).sort().reverse();
  }, [attendees]);

  const totalTickets = attendees.length;
  const checkedInTickets = attendees.filter(isTicketCheckedIn).length;
  const notCheckedInTickets = attendees.filter(
    (t) => t.status !== 'CANCELLED' && !isTicketCheckedIn(t)
  ).length;
  const cancelledTickets = attendees.filter((t) => t.status === 'CANCELLED').length;
  const checkInRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0;
  const totalDailyScans = attendees.reduce(
    (acc, t) => acc + (t.checkIns?.length || (t.status === 'USED' ? 1 : 0)),
    0
  );
  const todayScansCount = attendees.reduce(
    (acc, t) => acc + (t.checkIns?.filter((ci: any) => ci.eventDay === today).length || 0),
    0
  );

  // Filter individual tickets (for "By Ticket" view)
  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    return attendees.filter((t) => {
      const name = personName(t).toLowerCase();
      const email = (t.user?.email || t.buyerEmail || '').toLowerCase();
      const phone = String(t.user?.phone || t.buyerPhone || '').toLowerCase();
      const ticketIdStr = String(t.id);
      const qr = String(t.qrCode || '').toLowerCase();
      const tierName = (t.ticketType?.name || '').toLowerCase();

      const matchesQuery =
        !q ||
        name.includes(q) ||
        email.includes(q) ||
        phone.includes(q) ||
        ticketIdStr.includes(q) ||
        qr.includes(q) ||
        tierName.includes(q);

      const matchesType = typeFilter === 'all' || (t.ticketType?.name || 'Ticket') === typeFilter;

      const bought = ymdFromUnknown(t.order?.createdAt || t.createdAt);
      const checkInDays = (t.checkIns || []).map((ci: any) => ci.eventDay);
      const matchesDate =
        dateFilter === 'all' ||
        bought === dateFilter ||
        checkInDays.includes(dateFilter);

      const checkedIn = isTicketCheckedIn(t);
      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'checked_in') return checkedIn;
        if (statusFilter === 'registered') return !checkedIn && t.status !== 'CANCELLED';
        if (statusFilter === 'cancelled') return t.status === 'CANCELLED';
        if (statusFilter === 'today') return checkInDays.includes(today);
        if (statusFilter.startsWith('day_')) {
          const targetDay = statusFilter.replace('day_', '');
          return checkInDays.includes(targetDay);
        }
        return true;
      })();

      return matchesQuery && matchesType && matchesDate && matchesStatus;
    });
  }, [attendees, query, statusFilter, typeFilter, dateFilter, today]);

  // Filter grouped attendees (for "By Attendee" view)
  const filteredAttendees = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedAttendees.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone && String(a.phone).toLowerCase().includes(q)) ||
        a.tickets.some((t: any) => String(t.id).includes(q) || String(t.qrCode || '').toLowerCase().includes(q));

      const matchesType = typeFilter === 'all' || a.ticketTypeCounts.has(typeFilter);
      const matchesDate =
        dateFilter === 'all' || a.boughtDays.has(dateFilter) || a.attendedDays.has(dateFilter);

      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'checked_in') {
          return a.tickets.some(isTicketCheckedIn);
        }
        if (statusFilter === 'registered') {
          return a.tickets.some((t: any) => t.status !== 'CANCELLED' && !isTicketCheckedIn(t));
        }
        if (statusFilter === 'cancelled') {
          return a.tickets.some((t: any) => t.status === 'CANCELLED');
        }
        if (statusFilter === 'today') return a.attendedDays.has(today);
        if (statusFilter.startsWith('day_')) {
          const targetDay = statusFilter.replace('day_', '');
          return a.attendedDays.has(targetDay);
        }
        return true;
      })();

      return matchesQuery && matchesStatus && matchesType && matchesDate;
    });
  }, [groupedAttendees, query, statusFilter, typeFilter, dateFilter, today]);

  const filters = useMemo(() => {
    const list: { id: string; label: string }[] = [
      { id: 'all', label: `All (${totalTickets} tickets)` },
      {
        id: 'checked_in',
        label: `Checked in (${checkedInTickets} tickets)`,
      },
      {
        id: 'registered',
        label: `Not checked in (${notCheckedInTickets} tickets)`,
      },
    ];

    if (cancelledTickets > 0 || isAdmin) {
      list.push({
        id: 'cancelled',
        label: `Cancelled (${cancelledTickets} tickets)`,
      });
    }

    if (isMultiDay) {
      if (eventDays.includes(today)) {
        const todayCount = attendees.filter((t) =>
          (t.checkIns || []).some((ci: any) => ci.eventDay === today)
        ).length;
        list.push({
          id: 'today',
          label: `Checked in today (${todayCount} tickets)`,
        });
      }

      eventDays.forEach((day, idx) => {
        const dayCount = attendees.filter((t) =>
          (t.checkIns || []).some((ci: any) => ci.eventDay === day)
        ).length;
        list.push({
          id: `day_${day}`,
          label: `Day ${idx + 1} · ${shortDayChip(day)} (${dayCount} tickets)`,
        });
      });
    }

    return list;
  }, [totalTickets, checkedInTickets, notCheckedInTickets, cancelledTickets, isMultiDay, eventDays, today, attendees, isAdmin]);

  const exportCsv = () => {
    if (isAdmin && viewMode === 'tickets') {
      const rows = filteredTickets.map((t) => {
        const isChecked = isTicketCheckedIn(t);
        const checkInTime = t.checkIns?.[0]?.createdAt
          ? new Date(t.checkIns[0].createdAt).toLocaleString()
          : 'None';
        return [
          t.id,
          t.qrCode || `ticket-${t.id}`,
          personName(t),
          t.user?.email || t.buyerEmail || '—',
          t.user?.phone || t.buyerPhone || '—',
          t.ticketType?.name || 'General Admission',
          t.status,
          isChecked ? 'Checked in' : 'Not arrived',
          checkInTime,
          saleChannel(t) || 'Online',
          saleAmount(t),
          new Date(t.createdAt).toLocaleDateString(),
        ];
      });

      downloadCSV(
        [
          'Ticket ID',
          'QR Code',
          'Attendee Name',
          'Email',
          'Phone',
          'Ticket Type',
          'Ticket Status',
          'Check-in Status',
          'Check-in Details',
          'Payment Channel',
          'Amount Paid',
          'Purchase Date',
        ],
        rows,
        `tickets_${eventId || 'event'}.csv`
      );
      return;
    }

    const rows = filteredAttendees.map((a) => {
      const daySummary = isMultiDay
        ? a.attendedDays.size > 0
          ? `${a.attendedDays.size}/${eventDays.length} days (${Array.from(a.attendedDays).sort().join(', ')})`
          : 'Registered (0 days)'
        : a.isCheckedIn
        ? 'Checked In'
        : 'Registered';

      const checkInDetails = isMultiDay
        ? (Array.from(a.checkInByDay.entries()) as [string, any][])
            .map(([day, info]) => `${day}: ${new Date(info.createdAt).toLocaleString()}`)
            .join(' | ') || 'None'
        : a.checkIns[0]?.createdAt
        ? new Date(a.checkIns[0].createdAt).toLocaleString()
        : 'None';

      return [
        a.name,
        a.email,
        a.phone,
        (Array.from(a.ticketTypeCounts.entries()) as [string, number][])
          .map(([type, count]) => `${type} × ${count}`)
          .join(' | '),
        a.tickets.length,
        a.tickets
          .map((t: any) => `#${t.id} (${t.ticketType?.name || 'Ticket'}: ${t.status || 'VALID'})`)
          .join(' | '),
        daySummary,
        checkInDetails,
        a.acceptedTerms ? 'Yes' : 'No',
        a.termsAcceptedAt ? new Date(a.termsAcceptedAt).toLocaleString() : '—',
      ];
    });

    downloadCSV(
      [
        'Name',
        'Email',
        'Phone',
        'Ticket Types',
        'Tickets Count',
        'Tickets (ID & Status)',
        'Check-in Status',
        'Check-in Details',
        'Terms Agreed',
        'Agreed At',
      ],
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
          Share your event link or add someone at the gate to start filling the list.
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
          {!readOnly && (
            <Link to={`/organizer/events/${eventSlug || eventId}/add-attendee`}>
              <Button size="sm" className="rounded-full bg-rose-500 hover:bg-rose-600 text-white border-0">
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add attendee
              </Button>
            </Link>
          )}
        </div>
      </div>
    );
  }

  const organizerColumns: DataTableColumn<(typeof filteredAttendees)[0]>[] = [
    {
      id: 'attendee',
      header: 'Attendee',
      className: 'min-w-[190px]',
      cell: (a) => (
        <div className="py-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-neutral-900 dark:text-white text-sm">{a.name}</span>
            {a.acceptedTerms && (
              <span
                title={`Agreed to terms ${a.termsAcceptedAt ? `on ${new Date(a.termsAcceptedAt).toLocaleDateString()}` : ''}`}
                className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/40"
              >
                Terms ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
            {a.email ? <span className="truncate max-w-[180px]">{a.email}</span> : <span>—</span>}
            {a.email && a.phone && <span className="text-neutral-300 dark:text-neutral-700">·</span>}
            {a.phone && <span>{a.phone}</span>}
          </div>
        </div>
      ),
    },
    {
      id: 'passes',
      header: 'Passes',
      className: 'min-w-[220px]',
      cell: (a) => (
        <div className="flex flex-wrap items-center gap-1.5 py-0.5">
          <span className="inline-flex items-center justify-center font-bold text-[11px] bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-md border border-rose-200/50 dark:border-rose-900/50 shrink-0">
            {a.tickets.length} {a.tickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
          {(Array.from(a.ticketTypeCounts.entries()) as [string, number][]).map(([type, count]) => {
            const typeDetail = a.ticketTypeDetails.get(type);
            const isDayPass = Boolean(typeDetail?.validOn);
            const dayChip = isDayPass ? shortDayChip(typeDetail.validOn) : null;

            return (
              <span
                key={type}
                className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800/80 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60"
              >
                {count > 1 && <span className="font-bold text-neutral-900 dark:text-white">{count}×</span>}
                <span>{type}</span>
                {isDayPass && dayChip && (
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-1 rounded">
                    {dayChip}
                  </span>
                )}
              </span>
            );
          })}
        </div>
      ),
    },
    {
      id: 'sale',
      header: 'Bought',
      className: 'min-w-[140px]',
      cell: (a) => {
        const dates = (Array.from(a.boughtDays) as string[]).sort();
        const channels = Array.from(a.channels) as string[];
        return (
          <div className="py-0.5">
            <p className="text-xs font-medium text-neutral-900 dark:text-white">
              {dates.length ? dates.map((day) => longDayLabel(day)).join(', ') : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {channels.filter((c) => c !== 'Free').join(' · ') || (a.paid <= 0 ? 'Free' : '—')}
              {a.paid > 0 ? ` · ${formatNaira(a.paid)}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Check-in Status',
      className: 'min-w-[260px]',
      cell: (a) => {
        if (!isMultiDay) {
          const firstCi = a.checkIns[0];
          const time = firstCi?.createdAt
            ? new Date(firstCi.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;

          return a.isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full">
              <Check className="h-3 w-3 stroke-[3]" />
              Checked in {time ? `(${time})` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Registered
            </span>
          );
        }

        const allDaysChecked = a.attendedDays.size === eventDays.length;
        const hasAnyChecked = a.attendedDays.size > 0;

        return (
          <div className="flex items-center gap-2 flex-wrap py-0.5">
            {allDaysChecked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> All {eventDays.length} days
              </span>
            ) : hasAnyChecked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> {a.attendedDays.size}/{eventDays.length} days
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 rounded-full shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" /> Not arrived
              </span>
            )}

            <div className="flex items-center gap-1">
              {eventDays.map((dayYmd, idx) => {
                const isDayChecked = a.attendedDays.has(dayYmd);
                const checkInInfo = a.checkInByDay.get(dayYmd);
                const dayLabel = `Day ${idx + 1}`;
                const shortDate = shortDayChip(dayYmd);
                const formattedTime = checkInInfo?.createdAt
                  ? new Date(checkInInfo.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : null;

                return (
                  <span
                    key={dayYmd}
                    title={
                      isDayChecked
                        ? `${dayLabel} (${shortDate}): Checked in ${formattedTime ? `at ${formattedTime}` : ''}`
                        : `${dayLabel} (${shortDate}): Not checked in`
                    }
                    className={`inline-flex items-center gap-1 text-[10px] font-bold h-6 px-2 rounded-md transition-all cursor-default select-none ${
                      isDayChecked
                        ? 'bg-emerald-500 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-400 dark:bg-neutral-800 dark:text-neutral-500 border border-neutral-200/60 dark:border-neutral-700/60'
                    }`}
                  >
                    {isDayChecked ? <Check className="h-2.5 w-2.5 stroke-[3]" /> : null}
                    <span>{dayLabel}</span>
                    <span className="text-[9px] font-normal opacity-85">({shortDate})</span>
                  </span>
                );
              })}
            </div>
          </div>
        );
      },
    },
  ];

  const ticketColumns: DataTableColumn<(typeof filteredTickets)[0]>[] = [
    {
      id: 'ticketNumber',
      header: 'Ticket #',
      className: 'min-w-[130px]',
      cell: (t) => <TicketNumberCell ticket={t} />,
    },
    {
      id: 'attendee',
      header: 'Attendee',
      className: 'min-w-[200px]',
      cell: (t) => {
        const name = personName(t);
        const email = t.user?.email || t.buyerEmail;
        const phone = t.user?.phone || t.buyerPhone;
        const terms = t.order?.acceptedTerms;

        return (
          <div className="py-0.5">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-neutral-900 dark:text-white text-sm">{name}</span>
              {terms && (
                <span
                  title={t.order?.termsAcceptedAt ? `Agreed on ${new Date(t.order.termsAcceptedAt).toLocaleDateString()}` : 'Agreed to terms'}
                  className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/40"
                >
                  Terms ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
              {email ? <span className="truncate max-w-[160px]">{email}</span> : <span>—</span>}
              {email && phone && <span className="text-neutral-300 dark:text-neutral-700">·</span>}
              {phone && <span>{phone}</span>}
            </div>
          </div>
        );
      },
    },
    {
      id: 'ticketType',
      header: 'Ticket Type',
      className: 'min-w-[150px]',
      cell: (t) => {
        const typeName = t.ticketType?.name || 'General Admission';
        const isDayPass = Boolean(t.ticketType?.validOn);
        const dayChip = isDayPass ? shortDayChip(t.ticketType.validOn) : null;

        return (
          <div className="py-0.5 flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700">
              {typeName}
            </span>
            {isDayPass && dayChip && (
              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-1.5 py-0.5 rounded">
                {dayChip}
              </span>
            )}
          </div>
        );
      },
    },
    {
      id: 'ticketStatus',
      header: 'Ticket Status',
      className: 'min-w-[120px]',
      cell: (t) => {
        const isCancelled = t.status === 'CANCELLED';
        const isUsed = isTicketCheckedIn(t);

        if (isCancelled) {
          return (
            <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/50">
              Cancelled
            </span>
          );
        }
        if (isUsed) {
          return (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/50">
              <Check className="h-3 w-3 stroke-[3]" /> Used
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 dark:border-sky-800/50">
            <CheckCircle2 className="h-3 w-3" /> Valid
          </span>
        );
      },
    },
    {
      id: 'checkInStatus',
      header: 'Check-in Status',
      className: 'min-w-[180px]',
      cell: (t) => {
        const checkedIn = isTicketCheckedIn(t);
        const checkIn = t.checkIns?.[0];
        const checkInTime = checkIn?.createdAt
          ? new Date(checkIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : null;
        const checkInDay = checkIn?.eventDay ? shortDayChip(checkIn.eventDay) : null;

        if (t.status === 'CANCELLED') {
          return <span className="text-xs text-neutral-400 dark:text-neutral-600">—</span>;
        }

        if (checkedIn) {
          return (
            <div className="py-0.5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full">
                <Check className="h-3 w-3 stroke-[3]" />
                Checked in {checkInTime ? `(${checkInTime})` : ''}
              </span>
              {checkInDay && (
                <p className="text-[10px] text-neutral-500 mt-0.5 pl-1">{checkInDay}</p>
              )}
            </div>
          );
        }

        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full">
            <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
            Not arrived
          </span>
        );
      },
    },
    {
      id: 'sale',
      header: 'Bought',
      className: 'min-w-[140px]',
      cell: (t) => {
        const boughtDate = ymdFromUnknown(t.order?.createdAt || t.createdAt);
        const channel = saleChannel(t) || 'Online';
        const amount = saleAmount(t);

        return (
          <div className="py-0.5">
            <p className="text-xs font-medium text-neutral-900 dark:text-white">
              {boughtDate ? longDayLabel(boughtDate) : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {channel} {amount > 0 ? `· ${formatNaira(amount)}` : '· Free'}
            </p>
          </div>
        );
      },
    },
  ];

  const adminAttendeeColumns: DataTableColumn<(typeof filteredAttendees)[0]>[] = [
    {
      id: 'attendee',
      header: 'Attendee',
      className: 'min-w-[190px]',
      cell: (a) => (
        <div className="py-0.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-neutral-900 dark:text-white text-sm">{a.name}</span>
            {a.acceptedTerms && (
              <span
                title={`Agreed to terms ${a.termsAcceptedAt ? `on ${new Date(a.termsAcceptedAt).toLocaleDateString()}` : ''}`}
                className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50 dark:border-emerald-800/40"
              >
                Terms ✓
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-neutral-500 mt-0.5 flex-wrap">
            {a.email ? <span className="truncate max-w-[180px]">{a.email}</span> : <span>—</span>}
            {a.email && a.phone && <span className="text-neutral-300 dark:text-neutral-700">·</span>}
            {a.phone && <span>{a.phone}</span>}
          </div>
        </div>
      ),
    },
    {
      id: 'ticketsCount',
      header: 'Tickets',
      className: 'min-w-[110px]',
      cell: (a) => (
        <div className="py-0.5">
          <span className="inline-flex items-center justify-center font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md border border-rose-200/50 dark:border-rose-900/50 shadow-2xs">
            {a.tickets.length} {a.tickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
          <div className="mt-1 flex flex-wrap gap-1">
            {(Array.from(a.ticketTypeCounts.entries()) as [string, number][]).map(([type, count]) => (
              <span key={type} className="text-[10px] text-neutral-500 font-medium">
                {count > 1 ? `${count}× ` : ''}{type}
              </span>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: 'ticketDetails',
      header: 'Ticket Details & Status',
      className: 'min-w-[320px]',
      cell: (a) => {
        const isExpanded = expandedKeys.has(a.key);
        const ticketCount = a.tickets.length;

        // For 1 or 2 tickets, render inline/compactly:
        if (ticketCount <= 2) {
          return (
            <div className="space-y-1.5 py-0.5 max-w-sm">
              {a.tickets.map((t: any) => {
                const isUsed = isTicketCheckedIn(t);
                const isCancelled = t.status === 'CANCELLED';
                const typeDetail = t.ticketType || a.ticketTypeDetails.get(t.ticketType?.name);
                const isDayPass = Boolean(typeDetail?.validOn);
                const dayChip = isDayPass ? shortDayChip(typeDetail.validOn) : null;

                return (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-850/50 px-2.5 py-1 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="font-mono font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[11px] shrink-0">
                        #{t.id}
                      </span>
                      <span className="font-semibold text-neutral-800 dark:text-neutral-200 text-xs truncate max-w-[130px]">
                        {typeDetail?.name || 'General Admission'}
                      </span>
                      {isDayPass && dayChip && (
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-100/70 dark:bg-amber-950/50 px-1 rounded shrink-0">
                          {dayChip}
                        </span>
                      )}
                    </div>

                    <div className="shrink-0">
                      {isCancelled ? (
                        <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60">
                          Cancelled
                        </span>
                      ) : isUsed ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
                          <Check className="h-2.5 w-2.5 stroke-[3]" /> Used
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60">
                          <CheckCircle2 className="h-2.5 w-2.5" /> Valid
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }

        // For 3+ tickets (e.g. Ahmad Ismail with 10 tickets):
        // Show compact summary row with range and expandable accordion
        const validCount = a.tickets.filter((t: any) => t.status !== 'CANCELLED' && !isTicketCheckedIn(t)).length;
        const usedCount = a.tickets.filter(isTicketCheckedIn).length;
        const cancelledCount = a.tickets.filter((t: any) => t.status === 'CANCELLED').length;
        const ticketIds = a.tickets.map((t: any) => t.id).sort((x: number, y: number) => x - y);
        const minId = ticketIds[0];
        const maxId = ticketIds[ticketIds.length - 1];

        return (
          <div className="py-0.5 max-w-md space-y-1.5">
            <div className="flex items-center justify-between gap-2 bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg px-2.5 py-1.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <span className="font-mono font-bold text-[11px] bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 shrink-0">
                  #{minId} – #{maxId}
                </span>
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">
                  {validCount > 0 && <span className="text-sky-600 dark:text-sky-400 font-semibold">{validCount} valid</span>}
                  {validCount > 0 && usedCount > 0 && ' · '}
                  {usedCount > 0 && <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{usedCount} used</span>}
                  {cancelledCount > 0 && ` · ${cancelledCount} cancelled`}
                </span>
              </div>

              <button
                type="button"
                onClick={() => toggleExpand(a.key)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 px-2 py-0.5 rounded transition-colors cursor-pointer shrink-0"
              >
                <span>{isExpanded ? 'Hide' : `View ${ticketCount}`}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            </div>

            {isExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-1.5 bg-neutral-100/50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200/60 dark:border-neutral-800">
                {a.tickets.map((t: any) => {
                  const isUsed = isTicketCheckedIn(t);
                  const isCancelled = t.status === 'CANCELLED';
                  const typeDetail = t.ticketType || a.ticketTypeDetails.get(t.ticketType?.name);
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between gap-1.5 rounded border border-neutral-200/70 dark:border-neutral-800 bg-white dark:bg-neutral-850 px-2 py-1 text-[11px]"
                    >
                      <span className="font-mono font-bold text-neutral-900 dark:text-white">
                        #{t.id}
                      </span>
                      <span className="truncate max-w-[85px] text-neutral-600 dark:text-neutral-400">
                        {typeDetail?.name || 'Ticket'}
                      </span>
                      {isCancelled ? (
                        <span className="text-[9px] font-bold text-rose-600">Cancelled</span>
                      ) : isUsed ? (
                        <span className="text-[9px] font-bold text-emerald-600">Used</span>
                      ) : (
                        <span className="text-[9px] font-bold text-sky-600">Valid</span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      },
    },
    {
      id: 'sale',
      header: 'Bought',
      className: 'min-w-[140px]',
      cell: (a) => {
        const dates = (Array.from(a.boughtDays) as string[]).sort();
        const channels = Array.from(a.channels) as string[];
        return (
          <div className="py-0.5">
            <p className="text-xs font-medium text-neutral-900 dark:text-white">
              {dates.length ? dates.map((day) => longDayLabel(day)).join(', ') : '—'}
            </p>
            <p className="mt-0.5 text-[11px] text-neutral-500">
              {channels.filter((c) => c !== 'Free').join(' · ') || (a.paid <= 0 ? 'Free' : '—')}
              {a.paid > 0 ? ` · ${formatNaira(a.paid)}` : ''}
            </p>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Check-in Status',
      className: 'min-w-[200px]',
      cell: (a) => {
        if (!isMultiDay) {
          const firstCi = a.checkIns[0];
          const time = firstCi?.createdAt
            ? new Date(firstCi.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : null;

          return a.isCheckedIn ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full">
              <Check className="h-3 w-3 stroke-[3]" />
              Checked in {time ? `(${time})` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
              Registered
            </span>
          );
        }

        const allDaysChecked = a.attendedDays.size === eventDays.length;
        const hasAnyChecked = a.attendedDays.size > 0;

        return (
          <div className="flex items-center gap-2 flex-wrap py-0.5">
            {allDaysChecked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> All {eventDays.length} days
              </span>
            ) : hasAnyChecked ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40 rounded-full shrink-0">
                <Check className="h-3 w-3 stroke-[3]" /> {a.attendedDays.size}/{eventDays.length} days
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400 rounded-full shrink-0">
                <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" /> Not arrived
              </span>
            )}
          </div>
        );
      },
    },
  ];

  const renderTicketMobileCard = (t: (typeof filteredTickets)[0]) => {
    const isChecked = isTicketCheckedIn(t);
    const isCancelled = t.status === 'CANCELLED';
    const checkIn = t.checkIns?.[0];
    const checkInTime = checkIn?.createdAt
      ? new Date(checkIn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : null;
    const typeName = t.ticketType?.name || 'General Admission';
    const amount = saleAmount(t);

    return (
      <div className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-xs bg-neutral-100 dark:bg-neutral-800 px-2 py-1 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-white">
              #{t.id}
            </span>
            <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">{typeName}</span>
          </div>
          {isCancelled ? (
            <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60">
              Cancelled
            </span>
          ) : isChecked ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
              <Check className="h-2.5 w-2.5 stroke-[3]" />
              Checked in {checkInTime ? `(${checkInTime})` : ''}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60">
              <CheckCircle2 className="h-2.5 w-2.5" />
              Valid
            </span>
          )}
        </div>

        <div className="border-t border-neutral-100 dark:border-neutral-800 pt-2 text-xs space-y-0.5">
          <p className="font-semibold text-neutral-900 dark:text-white">{personName(t)}</p>
          <p className="text-neutral-500">
            {[t.user?.email || t.buyerEmail, t.user?.phone || t.buyerPhone].filter(Boolean).join(' · ') || 'No contact info'}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
          <span>{saleChannel(t) || 'Online'}</span>
          <span className="font-semibold text-neutral-900 dark:text-white">
            {amount > 0 ? formatNaira(amount) : 'Free'}
          </span>
        </div>
      </div>
    );
  };

  const renderAdminMobileCard = (a: (typeof filteredAttendees)[0]) => {
    const isExpanded = expandedKeys.has(a.key);
    return (
      <div className="w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-bold text-neutral-900 dark:text-white text-sm">{a.name}</span>
              {a.acceptedTerms && (
                <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200/50">
                  Terms ✓
                </span>
              )}
            </div>
            <p className="text-xs text-neutral-500 mt-0.5">
              {[a.email, a.phone].filter(Boolean).join(' · ') || 'No contact info'}
            </p>
          </div>
          <span className="inline-flex items-center justify-center font-bold text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 px-2.5 py-1 rounded-md border border-rose-200/50 shrink-0 shadow-2xs">
            {a.tickets.length} {a.tickets.length === 1 ? 'ticket' : 'tickets'}
          </span>
        </div>

        <div className="space-y-1.5 border-t border-neutral-100 dark:border-neutral-800 pt-2.5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
              Tickets ({a.tickets.length})
            </p>
            {a.tickets.length > 2 && (
              <button
                type="button"
                onClick={() => toggleExpand(a.key)}
                className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>{isExpanded ? 'Collapse' : 'Show all'}</span>
                {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </button>
            )}
          </div>

          <div className="space-y-1">
            {(isExpanded || a.tickets.length <= 2 ? a.tickets : a.tickets.slice(0, 2)).map((t: any) => {
              const isUsed = isTicketCheckedIn(t);
              const isCancelled = t.status === 'CANCELLED';
              const typeDetail = t.ticketType || a.ticketTypeDetails.get(t.ticketType?.name);

              return (
                <div
                  key={t.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40 px-2.5 py-1.5 text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-mono font-bold text-neutral-900 dark:text-white bg-white dark:bg-neutral-900 px-1.5 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-[11px]">
                      #{t.id}
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                      {typeDetail?.name || 'General Admission'}
                    </span>
                  </div>
                  {isCancelled ? (
                    <span className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 shrink-0">
                      Cancelled
                    </span>
                  ) : isUsed ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60 shrink-0">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                      Used
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 border border-sky-200/60 shrink-0">
                      <CheckCircle2 className="h-2.5 w-2.5" />
                      Valid
                    </span>
                  )}
                </div>
              );
            })}
            {!isExpanded && a.tickets.length > 2 && (
              <p className="text-[11px] text-neutral-500 text-center py-0.5">
                + {a.tickets.length - 2} more tickets
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100 dark:border-neutral-800 pt-2">
          <span>{Array.from(a.channels).join(' · ') || 'Online'}</span>
          <span className="font-semibold text-neutral-900 dark:text-white">
            {a.paid > 0 ? formatNaira(a.paid) : 'Free'}
          </span>
        </div>
      </div>
    );
  };

  const isTicketView = isAdmin && viewMode === 'tickets';

  const toolbarNode = (
    <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
        {isAdmin && (
          <div className="inline-flex items-center gap-1 p-1 bg-neutral-100 dark:bg-neutral-800 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('tickets')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'tickets'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              By Ticket ({totalTickets})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('attendees')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                viewMode === 'attendees'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white shadow-2xs font-bold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              By Attendee ({groupedAttendees.length})
            </button>
          </div>
        )}

        <div className="grid w-full min-w-0 grid-cols-3 gap-2 sm:w-[28rem]">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 w-full min-w-0 rounded-lg border-neutral-200 bg-white text-xs shadow-none dark:border-neutral-700 dark:bg-neutral-900">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All types</SelectItem>
              {ticketTypeOptions.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="h-9 w-full min-w-0 rounded-lg border-neutral-200 bg-white text-xs shadow-none dark:border-neutral-700 dark:bg-neutral-900">
              <SelectValue placeholder="Date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All dates</SelectItem>
              {dateOptions.map((day) => (
                <SelectItem key={day} value={day}>
                  {longDayLabel(day)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
            <SelectTrigger className="h-9 w-full min-w-0 rounded-lg border-neutral-200 bg-white text-xs shadow-none dark:border-neutral-700 dark:bg-neutral-900">
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
        </div>
      </div>

      {!readOnly && (
        <Link to={`/organizer/events/${eventSlug || eventId}/add-attendee`} className="w-full sm:w-auto">
          <Button size="sm" className="h-9 w-full rounded-lg bg-rose-500 px-3 text-xs font-semibold text-white hover:bg-rose-600 sm:w-auto">
            <Plus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </Link>
      )}
    </div>
  );

  return (
    <div className="space-y-3 px-4 sm:px-0">
      <div className={`grid gap-2 ${isMultiDay ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
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
        {isMultiDay && (
          <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-2.5 sm:p-3">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                {eventDays.includes(today) ? "Today's scans" : 'Total scans'}
              </span>
              <CalendarCheck className="h-3.5 w-3.5 text-rose-500" />
            </div>
            <p className="text-lg font-bold text-neutral-900 dark:text-white">
              {eventDays.includes(today) ? todayScansCount : totalDailyScans}
              <span className="text-xs font-medium text-neutral-400 ml-1">
                {eventDays.includes(today) ? `(${totalDailyScans} total)` : `across ${eventDays.length} days`}
              </span>
            </p>
          </div>
        )}
      </div>

      {isTicketView ? (
        <DataTable<(typeof filteredTickets)[0]>
          columns={ticketColumns}
          renderMobileCard={renderTicketMobileCard}
          rows={filteredTickets}
          getRowId={(t) => String(t.id)}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search ticket #, QR, name, email, phone…"
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={setPageSize}
          toolbar={toolbarNode}
          emptyTitle="No tickets found"
          emptyDescription="Try adjusting filters or search."
        />
      ) : (
        <DataTable<(typeof filteredAttendees)[0]>
          columns={isAdmin ? adminAttendeeColumns : organizerColumns}
          renderMobileCard={isAdmin ? renderAdminMobileCard : undefined}
          rows={filteredAttendees}
          getRowId={(a) => a.key}
          searchValue={query}
          onSearchChange={setQuery}
          searchPlaceholder="Search name, email, phone…"
          pageSize={pageSize}
          pageSizeOptions={[10, 25, 50, 100]}
          onPageSizeChange={setPageSize}
          toolbar={toolbarNode}
          emptyTitle="No attendees found"
          emptyDescription="Try adjusting filters or search."
        />
      )}
    </div>
  );
};

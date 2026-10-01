import React, { useEffect, useState, useMemo } from 'react';
import { Users, Download, Plus, UserCheck, Ticket, CalendarCheck, Check } from 'lucide-react';
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
import { eventDayList, shortDayChip, todayYmd, ymdFromUnknown } from '../../lib/ticketValidity';

interface AttendeesTabProps {
  eventId?: number;
  eventSlug?: string | null;
  event?: any;
  readOnly?: boolean;
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

export const AttendeesTab: React.FC<AttendeesTabProps> = ({
  eventId,
  eventSlug,
  event,
  readOnly = false,
}) => {
  const [attendees, setAttendees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return groupedAttendees.filter((a) => {
      const matchesQuery =
        !q ||
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.phone && String(a.phone).toLowerCase().includes(q));

      const matchesStatus = (() => {
        if (statusFilter === 'all') return true;
        if (statusFilter === 'checked_in') return a.isCheckedIn;
        if (statusFilter === 'registered') return !a.isCheckedIn;
        if (statusFilter === 'today') return a.attendedDays.has(today);
        if (statusFilter.startsWith('day_')) {
          const targetDay = statusFilter.replace('day_', '');
          return a.attendedDays.has(targetDay);
        }
        return true;
      })();

      return matchesQuery && matchesStatus;
    });
  }, [groupedAttendees, query, statusFilter, today]);

  const totalTickets = attendees.length;
  const checkedInTickets = attendees.filter(
    (t) => (t.checkIns && t.checkIns.length > 0) || t.status === 'USED'
  ).length;
  const checkInRate = totalTickets > 0 ? Math.round((checkedInTickets / totalTickets) * 100) : 0;
  const totalDailyScans = attendees.reduce(
    (acc, t) => acc + (t.checkIns?.length || (t.status === 'USED' ? 1 : 0)),
    0
  );
  const todayScansCount = attendees.reduce(
    (acc, t) => acc + (t.checkIns?.filter((ci: any) => ci.eventDay === today).length || 0),
    0
  );

  const exportCsv = () => {
    const rows = filtered.map((a) => {
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

  const filters = (() => {
    const list: { id: string; label: string }[] = [
      { id: 'all', label: `All (${groupedAttendees.length})` },
      {
        id: 'checked_in',
        label: `Checked in (${groupedAttendees.filter((a) => a.isCheckedIn).length})`,
      },
      {
        id: 'registered',
        label: `Not checked in (${groupedAttendees.filter((a) => !a.isCheckedIn).length})`,
      },
    ];

    if (isMultiDay) {
      if (eventDays.includes(today)) {
        const todayCount = groupedAttendees.filter((a) => a.attendedDays.has(today)).length;
        list.push({
          id: 'today',
          label: `Checked in today (${todayCount})`,
        });
      }

      eventDays.forEach((day, idx) => {
        const dayCount = groupedAttendees.filter((a) => a.attendedDays.has(day)).length;
        list.push({
          id: `day_${day}`,
          label: `Day ${idx + 1} · ${shortDayChip(day)} (${dayCount})`,
        });
      });
    }

    return list;
  })();

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

      <DataTable
        columns={
          [
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
          ] as DataTableColumn<(typeof filtered)[0]>[]
        }
        rows={filtered}
        getRowId={(a) => a.key}
        searchValue={query}
        onSearchChange={setQuery}
        searchPlaceholder="Search name, email, phone…"
        pageSize={10}
        toolbar={
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value)}>
              <SelectTrigger className="h-9 min-w-[150px] rounded-xl border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-xs font-semibold shadow-none">
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
            {/* Export button commented out for now as requested */}
            {/* <Button onClick={exportCsv} variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 h-9">
              <Download className="h-3.5 w-3.5" />
              Export
            </Button> */}
            {!readOnly && (
              <Link to={`/organizer/events/${eventSlug || eventId}/add-attendee`}>
                <Button size="sm" className="rounded-xl text-xs h-9 bg-rose-500 hover:bg-rose-600 text-white border-0 font-bold px-3">
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add
                </Button>
              </Link>
            )}
          </div>
        }
        emptyTitle="No matches"
        emptyDescription="Try a different search or filter."
      />
    </div>
  );
};

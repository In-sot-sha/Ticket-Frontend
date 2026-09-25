import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRightLeft,
  Calendar,
  Ticket,
  ExternalLink,
  MapPin,
  Building2,
  Eye,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import { api } from '../../services/api';
import { Button } from '../../components/ui/Button';
import { PageHeader } from '../../components/ui/PageHeader';
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
import { useHostApplications } from '../../hooks/queries/useAdmin';
import { formatNaira } from '../../lib/eventOrganizer';
import { cn } from '../../lib/utils';

interface TicketTypeAdmin {
  id: number;
  name: string;
  price: number;
  quantity: number | null;
  isPaused: boolean;
  _count?: { tickets: number };
}

interface EventAdminInfo {
  id: number;
  title: string;
  startDate: string;
  endDate?: string | null;
  location?: string | null;
  category?: string | null;
  imageUrl?: string | null;
  description?: string | null;
  isPublished?: boolean;
  isPromoted: boolean;
  promotedUntil: string | null;
  promotionRequestedAt?: string | null;
  organization?: { id: number; name: string };
  ticketTypes?: TicketTypeAdmin[];
  _count?: {
    tickets: number;
    orders: number;
  };
}

export type EventStatusType = 'live' | 'upcoming' | 'ended' | 'draft';

export interface EventStatusBadgeInfo {
  key: EventStatusType;
  label: string;
  badgeClass: string;
  dotClass: string;
}

export function getEventStatus(ev: {
  isPublished?: boolean;
  startDate: string;
  endDate?: string | null;
}): EventStatusBadgeInfo {
  if (!ev.isPublished) {
    return {
      key: 'draft',
      label: 'Draft',
      badgeClass:
        'bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400 border-neutral-200 dark:border-neutral-700',
      dotClass: 'bg-neutral-400',
    };
  }

  const now = new Date();
  const start = new Date(ev.startDate);
  const end = ev.endDate ? new Date(ev.endDate) : new Date(start.getTime() + 6 * 3600 * 1000);

  if (now > end) {
    return {
      key: 'ended',
      label: 'Past',
      badgeClass:
        'bg-zinc-100 text-zinc-600 dark:bg-zinc-800/70 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700',
      dotClass: 'bg-zinc-400',
    };
  }

  if (now >= start && now <= end) {
    return {
      key: 'live',
      label: 'Live Now',
      badgeClass:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
      dotClass: 'bg-emerald-500 animate-pulse',
    };
  }

  return {
    key: 'upcoming',
    label: 'Upcoming',
    badgeClass:
      'bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800',
    dotClass: 'bg-sky-500',
  };
}

const AdminEventsPage: React.FC = () => {
  const [events, setEvents] = useState<EventAdminInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [promoFilter, setPromoFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'live' | 'upcoming' | 'draft' | 'ended'>('all');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [selectedEvent, setSelectedEvent] = useState<EventAdminInfo | null>(null);
  const [transferFor, setTransferFor] = useState<EventAdminInfo | null>(null);
  const [targetOrgId, setTargetOrgId] = useState('');
  const [saving, setSaving] = useState(false);

  const [promoteFor, setPromoteFor] = useState<EventAdminInfo | null>(null);
  const [durationMode, setDurationMode] = useState<'1' | '7' | '30' | 'indefinite' | 'custom'>('7');
  const [customDate, setCustomDate] = useState('');

  const { data: orgs = [] } = useHostApplications('verified');

  const fetchEvents = () => {
    setLoading(true);
    api.admin
      .getEvents({ search: search || undefined })
      .then((res) => setEvents(res.data || []))
      .catch(() => setError('Failed to load events.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const t = setTimeout(fetchEvents, 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const filtered = useMemo(() => {
    const list = events.filter((ev) => {
      if (promoFilter === 'promoted' && !ev.isPromoted) return false;
      if (promoFilter === 'requested' && (!ev.promotionRequestedAt || ev.isPromoted)) return false;
      if (promoFilter === 'standard' && (ev.isPromoted || ev.promotionRequestedAt)) return false;

      if (statusFilter !== 'all') {
        const st = getEventStatus(ev).key;
        if (st !== statusFilter) return false;
      }

      return true;
    });

    // User requirement: Upcoming & Live first, then Past, then Draft last
    const priorityWeight: Record<EventStatusType, number> = {
      live: 1,
      upcoming: 2,
      ended: 3,
      draft: 4,
    };

    return [...list].sort((a, b) => {
      const statusA = getEventStatus(a).key;
      const statusB = getEventStatus(b).key;

      if (priorityWeight[statusA] !== priorityWeight[statusB]) {
        return priorityWeight[statusA] - priorityWeight[statusB];
      }

      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();

      // For live and upcoming: nearest date first (ascending)
      if (statusA === 'live' || statusA === 'upcoming') {
        return dateA - dateB;
      }

      // For ended (past) events: most recent past first (descending)
      if (statusA === 'ended') {
        return dateB - dateA;
      }

      // For drafts: most recent date first
      return dateB - dateA;
    });
  }, [events, promoFilter, statusFilter]);

  const handlePromote = async (isPromoted: boolean) => {
    if (!promoteFor) return;
    setSaving(true);
    setError(null);
    try {
      let promotedUntil: string | null = null;
      if (isPromoted) {
        if (durationMode === 'custom') {
          if (!customDate) {
            setError('Pick a custom end date.');
            setSaving(false);
            return;
          }
          promotedUntil = new Date(customDate).toISOString();
        } else if (durationMode !== 'indefinite') {
          const d = new Date();
          d.setDate(d.getDate() + Number(durationMode));
          promotedUntil = d.toISOString();
        }
      }
      await api.admin.promoteEvent(promoteFor.id, { isPromoted, promotedUntil });
      setSuccess(isPromoted ? 'Event promoted to homepage carousel.' : 'Promotion removed.');
      setTimeout(() => setSuccess(null), 3000);
      setPromoteFor(null);
      fetchEvents();
    } catch {
      setError('Failed to update promotion.');
    } finally {
      setSaving(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferFor || !targetOrgId) return;
    setSaving(true);
    setError(null);
    try {
      await api.admin.transferEvent(transferFor.id, Number(targetOrgId));
      setSuccess('Event ownership transferred.');
      setTimeout(() => setSuccess(null), 3000);
      setTransferFor(null);
      setTargetOrgId('');
      fetchEvents();
    } catch {
      setError('Failed to transfer event.');
    } finally {
      setSaving(false);
    }
  };

  // Helper calculation for event ticket revenue & counts
  const getEventStats = (ev: EventAdminInfo) => {
    const tiers = ev.ticketTypes || [];
    const totalSold = ev._count?.tickets ?? tiers.reduce((acc, t) => acc + (t._count?.tickets || 0), 0);
    const estRevenue = tiers.reduce((acc, t) => acc + (t.price * (t._count?.tickets || 0)), 0);
    const totalCapacity = tiers.reduce((acc, t) => acc + (t.quantity || 0), 0);
    return { totalSold, estRevenue, totalCapacity, tiersCount: tiers.length };
  };

  const columns: DataTableColumn<EventAdminInfo>[] = [
    {
      id: 'event',
      header: 'Event Details',
      cell: (ev) => {
        return (
          <div className="flex items-center gap-3 min-w-0">
            {ev.imageUrl ? (
              <img
                src={ev.imageUrl}
                alt={ev.title}
                className="h-10 w-10 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
              />
            ) : (
              <div className="h-10 w-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                <Calendar className="h-5 w-5" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <p className="font-bold text-xs sm:text-sm truncate text-neutral-900 dark:text-white">
                  {ev.title}
                </p>
                {ev.isPromoted && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                    Promoted
                  </span>
                )}
                {!ev.isPromoted && ev.promotionRequestedAt && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    Requested
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-400 mt-0.5 flex items-center gap-1.5 truncate">
                <Calendar className="h-3 w-3 shrink-0" />
                {ev.startDate ? new Date(ev.startDate).toLocaleDateString() : 'No date'}
                {ev.organization ? ` · ${ev.organization.name}` : ''}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      id: 'tickets',
      header: 'Tickets Sold',
      cell: (ev) => {
        const stats = getEventStats(ev);
        return (
          <div className="flex flex-col">
            <span className="inline-flex items-center gap-1 text-xs font-bold text-neutral-800 dark:text-neutral-200">
              <Ticket className="h-3 w-3 text-rose-500" />
              {stats.totalSold} sold
            </span>
            <span className="text-[10px] text-neutral-400">
              {stats.tiersCount} tier{stats.tiersCount !== 1 ? 's' : ''} · {formatNaira(stats.estRevenue)}
            </span>
          </div>
        );
      },
    },
    {
      id: 'status',
      header: 'Status',
      cell: (ev) => {
        const st = getEventStatus(ev);
        return (
          <span
            className={cn(
              'inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-2xs whitespace-nowrap',
              st.badgeClass
            )}
          >
            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', st.dotClass)} />
            {st.label}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: '',
      hideOnMobile: true,
      cell: (ev) => (
        <div className="flex items-center gap-1.5 justify-end">
          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs h-7 px-2.5 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedEvent(ev);
            }}
          >
            <Eye className="h-3 w-3 mr-1 text-neutral-400" />
            View
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs h-7 px-2 font-semibold"
            onClick={(e) => {
              e.stopPropagation();
              setPromoteFor(ev);
              setDurationMode('7');
              setCustomDate(
                ev.promotedUntil
                  ? new Date(ev.promotedUntil).toISOString().slice(0, 10)
                  : ''
              );
            }}
          >
            <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
            {ev.isPromoted ? 'Promo' : 'Promote'}
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="rounded-lg text-xs h-7 px-2 font-semibold text-neutral-500"
            onClick={(e) => {
              e.stopPropagation();
              setTransferFor(ev);
              setTargetOrgId('');
            }}
          >
            <ArrowRightLeft className="h-3 w-3" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="py-3 px-2 sm:px-3 max-w-7xl mx-auto pb-8 text-neutral-900 dark:text-neutral-100">
      <PageHeader
        title="Events &"
        accent="Tickets"
        description="Inspect event listings, live status, ticket tier breakdowns, live ticket counts, and homepage promotions."
      />

      {(error || success) && (
        <div
          className={cn(
            'mb-4 px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between',
            error
              ? 'bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400'
              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400'
          )}
        >
          <span>{error || success}</span>
          <button type="button" onClick={() => { setError(null); setSuccess(null); }}>
            <span className="text-xs font-bold">✕</span>
          </button>
        </div>
      )}

      {loading ? (
        <DataTableSkeleton rows={6} columns={4} />
      ) : (
        <DataTable
          columns={columns}
          rows={filtered}
          getRowId={(ev) => ev.id}
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search events by title…"
          pageSize={12}
          onRowClick={(ev) => setSelectedEvent(ev)}
          toolbar={
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full sm:w-[130px] h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="live">Live Now</SelectItem>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="draft">Drafts</SelectItem>
                  <SelectItem value="ended">Past</SelectItem>
                </SelectContent>
              </Select>

              <Select value={promoFilter} onValueChange={setPromoFilter}>
                <SelectTrigger className="w-full sm:w-[155px] h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Filter promotion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Placements</SelectItem>
                  <SelectItem value="requested">Requested Promo</SelectItem>
                  <SelectItem value="promoted">Promoted Only</SelectItem>
                  <SelectItem value="standard">Standard Events</SelectItem>
                </SelectContent>
              </Select>

              {(statusFilter !== 'all' || promoFilter !== 'all') && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-2 text-xs font-semibold text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  onClick={() => {
                    setStatusFilter('all');
                    setPromoFilter('all');
                  }}
                >
                  Reset
                </Button>
              )}
            </div>
          }
          emptyTitle="No events found"
          emptyDescription="Try another search or filter."
        />
      )}

      {/* Event Details & Tickets Modal */}
      <Dialog open={Boolean(selectedEvent)} onOpenChange={(o) => !o && setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto p-4 sm:p-5">
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-start gap-3">
                  {selectedEvent.imageUrl ? (
                    <img
                      src={selectedEvent.imageUrl}
                      alt={selectedEvent.title}
                      className="h-14 w-14 rounded-xl object-cover shrink-0 border border-neutral-200 dark:border-neutral-800"
                    />
                  ) : (
                    <div className="h-14 w-14 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center shrink-0 text-neutral-400">
                      <Calendar className="h-6 w-6" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <DialogTitle className="text-base font-extrabold truncate">
                        {selectedEvent.title}
                      </DialogTitle>
                      {(() => {
                        const st = getEventStatus(selectedEvent);
                        return (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full border shadow-2xs',
                              st.badgeClass
                            )}
                          >
                            <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', st.dotClass)} />
                            {st.label}
                          </span>
                        );
                      })()}
                      {selectedEvent.isPromoted && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                          Promoted
                        </span>
                      )}
                    </div>
                    <DialogDescription className="text-xs text-neutral-400 mt-1 flex flex-col gap-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 shrink-0" />
                        {new Date(selectedEvent.startDate).toLocaleString()}
                        {selectedEvent.endDate ? ` — ${new Date(selectedEvent.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
                      </span>
                      {selectedEvent.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {selectedEvent.location}
                        </span>
                      )}
                      {selectedEvent.organization && (
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Building2 className="h-3 w-3 shrink-0" />
                          Host: {selectedEvent.organization.name}
                        </span>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Event Stats Summary */}
              {(() => {
                const stats = getEventStats(selectedEvent);
                return (
                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 rounded-xl border border-neutral-150 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Total Tickets Sold
                      </span>
                      <p className="text-base font-black text-rose-500 mt-0.5">
                        {stats.totalSold}{' '}
                        {stats.totalCapacity > 0 && (
                          <span className="text-xs font-normal text-neutral-400">
                            / {stats.totalCapacity} capacity
                          </span>
                        )}
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                        Est. Ticket Revenue
                      </span>
                      <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {formatNaira(stats.estRevenue)}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Ticket Tiers Breakdown */}
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Ticket Tiers ({(selectedEvent.ticketTypes || []).length})
                  </p>
                  <span className="text-[11px] text-neutral-400">Pricing & Capacity</span>
                </div>

                <div className="space-y-2">
                  {(selectedEvent.ticketTypes || []).length === 0 ? (
                    <div className="p-4 text-center rounded-xl border border-neutral-150 dark:border-neutral-800 text-xs text-neutral-400">
                      No ticket tiers created for this event.
                    </div>
                  ) : (
                    (selectedEvent.ticketTypes || []).map((tier) => {
                      const sold = tier._count?.tickets ?? 0;
                      const cap = tier.quantity;
                      const percent = cap && cap > 0 ? Math.min(100, Math.round((sold / cap) * 100)) : 0;

                      return (
                        <div
                          key={tier.id}
                          className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900/80 space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                  {tier.name}
                                </span>
                                {tier.isPaused && (
                                  <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-400">
                                    Paused
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-bold text-rose-500">
                                {tier.price === 0 ? 'Free' : formatNaira(tier.price)}
                              </span>
                            </div>

                            <div className="text-right">
                              <span className="text-xs font-bold text-neutral-900 dark:text-white">
                                {sold} sold
                              </span>
                              {cap && (
                                <p className="text-[10px] text-neutral-400">
                                  of {cap} total ({percent}%)
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Progress bar */}
                          {cap && cap > 0 && (
                            <div className="h-1.5 w-full bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-rose-500 rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap items-center justify-between gap-2 mt-4">
                <div className="flex items-center gap-2">
                  <a
                    href={`/events/${selectedEvent.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Public Page
                  </a>

                  <Link
                    to="/admin/transactions"
                    className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                  >
                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                    Transactions
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-lg text-xs h-8"
                    onClick={() => {
                      setPromoteFor(selectedEvent);
                      setSelectedEvent(null);
                    }}
                  >
                    <Sparkles className="h-3 w-3 mr-1 text-amber-500" />
                    Promote
                  </Button>
                  <Button
                    size="sm"
                    className="bg-rose-500 text-white rounded-lg text-xs h-8 font-bold"
                    onClick={() => setSelectedEvent(null)}
                  >
                    Done
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Promote Modal */}
      {promoteFor && (
        <Dialog open={Boolean(promoteFor)} onOpenChange={(o) => !o && setPromoteFor(null)}>
          <DialogContent className="sm:max-w-md p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">
                Promote — {promoteFor.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Featured events receive prime placement in the homepage hero carousel.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <div className="grid grid-cols-5 gap-1.5">
                {(['1', '7', '30', 'indefinite', 'custom'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setDurationMode(m)}
                    className={cn(
                      'text-xs font-bold py-2 rounded-xl border transition-all',
                      durationMode === m
                        ? 'bg-rose-500 text-white border-rose-500 shadow-xs'
                        : 'border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:border-neutral-300'
                    )}
                  >
                    {m === 'indefinite' ? 'Ongoing' : m === 'custom' ? 'Custom' : `${m}d`}
                  </button>
                ))}
              </div>

              {durationMode === 'custom' && (
                <input
                  type="date"
                  value={customDate}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-xs"
                />
              )}
            </div>

            <DialogFooter className="mt-3 gap-2">
              {promoteFor.isPromoted && (
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-xs text-red-500 border-red-200 hover:bg-red-50"
                  disabled={saving}
                  onClick={() => handlePromote(false)}
                >
                  Remove Promotion
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setPromoteFor(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
                disabled={saving}
                onClick={() => handlePromote(true)}
              >
                {saving ? 'Saving…' : 'Save Promotion'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Transfer Modal */}
      {transferFor && (
        <Dialog open={Boolean(transferFor)} onOpenChange={(o) => !o && setTransferFor(null)}>
          <DialogContent className="sm:max-w-md p-4 sm:p-5">
            <DialogHeader>
              <DialogTitle className="text-base font-extrabold">
                Transfer — {transferFor.title}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-400">
                Move this event and all its tickets/orders to another verified host.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3 mt-2">
              <p className="text-xs text-neutral-500">
                Current Host:{' '}
                <span className="font-bold text-neutral-900 dark:text-white">
                  {transferFor.organization?.name || 'None'}
                </span>
              </p>

              <Select
                value={targetOrgId || 'none'}
                onValueChange={(v) => setTargetOrgId(v === 'none' ? '' : v)}
              >
                <SelectTrigger className="w-full h-9 rounded-xl text-xs">
                  <SelectValue placeholder="Destination organization" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Select destination…</SelectItem>
                  {(orgs as any[])
                    .filter((o) => o.id !== transferFor.organization?.id)
                    .map((o: any) => (
                      <SelectItem key={o.id} value={String(o.id)}>
                        {o.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <DialogFooter className="mt-3 gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="rounded-xl text-xs"
                onClick={() => setTransferFor(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold"
                disabled={!targetOrgId || targetOrgId === 'none' || saving}
                onClick={handleTransfer}
              >
                {saving ? 'Transferring…' : 'Confirm Transfer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminEventsPage;

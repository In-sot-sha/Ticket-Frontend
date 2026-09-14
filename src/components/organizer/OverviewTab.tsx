import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Ticket,
  Store,
  TrendingUp,
  CheckCircle2,
  ScanLine,
  UserPlus,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import EventPhaseBadge from './EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../../lib/eventOrganizer';
import { resolveImageUrl } from '../../lib/media';
import { Button } from '../ui/Button';

interface OverviewTabProps {
  event: OrganizerEvent;
  vendorApplications?: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ event, vendorApplications = [] }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const stats = event.stats;
  const cover = resolveImageUrl(event.imageUrl);
  const start = new Date(event.startDate);
  const end = new Date(event.endDate);

  const pendingVendors = vendorApplications.filter(
    (v) =>
      v.applicationStatus === 'PENDING' ||
      v.applicationStatus === null ||
      v.applicationStatus === undefined
  );

  // Key metrics calculations
  const totalSold = stats?.ticketsSold ?? (event.attendees || 0);
  const totalRevenue = stats?.actualRevenue ?? (event.revenue || 0);
  const checkedInCount = stats?.ticketsCheckedIn ?? 0;
  const totalInventory =
    stats?.ticketInventory ??
    (event.ticketTypes?.reduce((acc, t) => acc + (t.quantity || 0), 0) || 0);

  const checkInRate = totalSold > 0 ? Math.round((checkedInCount / totalSold) * 100) : 0;
  const sellThroughRate = totalInventory > 0 ? Math.min(Math.round((totalSold / totalInventory) * 100), 100) : 0;

  const ticketRows =
    stats?.ticketTypeStats?.length
      ? stats.ticketTypeStats
      : (event.ticketTypes || []).map((tt) => ({
          id: tt.id,
          name: tt.name,
          price: tt.price,
          quantity: tt.quantity,
          sold: 0,
          revenue: 0,
          checkedIn: 0,
          expectedRevenue: 0,
        }));

  // Amenities and highlights
  const rawAmenities = (event as any).amenities;
  let parsedAmenities: string[] = [];
  if (Array.isArray(rawAmenities)) {
    parsedAmenities = rawAmenities;
  } else if (typeof rawAmenities === 'string') {
    try {
      parsedAmenities = JSON.parse(rawAmenities);
    } catch {
      parsedAmenities = rawAmenities ? [rawAmenities] : [];
    }
  }

  const publicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/events/${event.slug || event.id}`
    : `/events/${event.slug || event.id}`;

  const copyPublicUrl = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      window.prompt('Copy event link:', publicUrl);
    }
  };

  return (
    <div className="space-y-4 w-full pb-8">
      {/* ── 1. Clean Hero Banner ── */}
      <section className="overflow-hidden rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs relative">
        <div className="relative min-h-[140px] sm:min-h-[170px] w-full flex flex-col justify-end">
          {cover ? (
            <>
              <img
                src={cover}
                alt={event.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
            </>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-rose-950/50" />
          )}

          {/* Top Phase / Countdown Badge */}
          <div className="absolute top-3.5 right-3.5 z-10 drop-shadow-md">
            <EventPhaseBadge event={event} showCountdown />
          </div>

          {/* Title & Key Logistics Pills */}
          <div className="relative z-10 p-4 sm:p-5 space-y-2">
            <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white drop-shadow-sm text-balance">
              {event.title}
            </h1>

            <div className="flex flex-wrap items-center gap-1.5 text-xs text-white/90">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 font-medium text-[11px]">
                <Calendar className="h-3 w-3 text-rose-400 shrink-0" />
                {start.toLocaleDateString('en-NG', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>

              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 font-medium text-[11px]">
                <Clock className="h-3 w-3 text-rose-400 shrink-0" />
                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>

              {event.location && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/10 font-medium text-[11px] max-w-full sm:max-w-md truncate">
                  {event.locationType === 'online' ? (
                    <Globe className="h-3 w-3 text-rose-400 shrink-0" />
                  ) : (
                    <MapPin className="h-3 w-3 text-rose-400 shrink-0" />
                  )}
                  <span className="truncate">{event.location}</span>
                </span>
              )}

              {event.category && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/80 backdrop-blur-md text-white font-bold capitalize text-[10px]">
                  {event.category}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. Compact Key Metrics (3 Tight Cards) ── */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {/* Metric 1: Revenue */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gross Sales</span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
          </div>
          <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
            {formatNaira(totalRevenue)}
          </p>
          <p className="text-[10px] text-neutral-400">Total ticket revenue</p>
        </div>

        {/* Metric 2: Tickets Sold */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Tickets Sold</span>
            <Ticket className="h-3.5 w-3.5 text-rose-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {totalSold}
            </p>
            {totalInventory > 0 && (
              <span className="text-[11px] font-semibold text-neutral-400">
                / {totalInventory}
              </span>
            )}
          </div>
          <p className="text-[10px] text-neutral-400 tabular-nums">
            {totalInventory > 0 ? `${sellThroughRate}% capacity sold` : 'Unlimited capacity'}
          </p>
        </div>

        {/* Metric 3: Gate Check-Ins */}
        <div className="rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3 sm:p-3.5 shadow-2xs space-y-0.5">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-[10px] font-bold uppercase tracking-wider">Gate Check-Ins</span>
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-500" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <p className="text-base sm:text-lg font-black text-neutral-900 dark:text-white tabular-nums tracking-tight">
              {checkedInCount}
            </p>
            <span className="text-[11px] font-semibold text-neutral-400">
              ({checkInRate}%)
            </span>
          </div>
          <p className="text-[10px] text-neutral-400">
            {Math.max(totalSold - checkedInCount, 0)} guests pending arrival
          </p>
        </div>
      </section>

      {/* Pending Vendors Notification (Only if applicable) */}
      {event.allowVendors && pendingVendors.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-3.5 py-2 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-semibold text-[11px]">
            <Store className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>
              {pendingVendors.length} vendor application{pendingVendors.length === 1 ? '' : 's'} waiting for review.
            </span>
          </div>
          <span className="text-amber-700 dark:text-amber-300 font-bold underline cursor-pointer text-[11px]">
            View Vendors →
          </span>
        </div>
      )}

      {/* ── 3. Side-by-Side: About This Event & Gate Operations ── */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* Left: About This Event */}
        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs flex flex-col justify-between gap-2.5">
          <div className="space-y-1.5">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <FileText className="h-3 w-3" /> About Event
            </h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-3">
              {event.description || 'No description provided for this event.'}
            </p>
          </div>

          {parsedAmenities.length > 0 && (
            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex flex-wrap gap-1">
              {parsedAmenities.slice(0, 4).map((amenity, idx) => (
                <span
                  key={idx}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-medium"
                >
                  {amenity}
                </span>
              ))}
              {parsedAmenities.length > 4 && (
                <span className="text-[10px] px-1.5 py-0.5 text-neutral-400 font-semibold">
                  +{parsedAmenities.length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: Gate Operations & Actions */}
        <div className="p-4 rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs flex flex-col justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
                <ScanLine className="h-3.5 w-3.5" />
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white">
                Gate Operations & Fast Entry
              </h3>
            </div>
            <p className="text-[11px] text-neutral-500 pl-9">
              Quickly scan QR passes or issue on-the-spot walk-in tickets for guests.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-neutral-100 dark:border-neutral-800">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={copyPublicUrl}
              className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1.5 border-neutral-200 dark:border-neutral-700 hover:border-rose-400"
            >
              {copiedLink ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
              {copiedLink ? 'Copied' : 'Copy Link'}
            </Button>

            <Link to="/organizer/scan">
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl text-xs font-bold h-8 px-2.5 gap-1.5 border-neutral-200 dark:border-neutral-700 hover:border-rose-400 hover:text-rose-500 cursor-pointer"
              >
                <ScanLine className="h-3 w-3 text-rose-500" />
                Scan Tickets
              </Button>
            </Link>

            <Link to={`/organizer/events/${event.id}/add-attendee`}>
              <Button
                size="sm"
                className="rounded-xl text-xs font-bold h-8 px-3 gap-1.5 bg-rose-500 hover:bg-rose-600 text-white border-0 shadow-2xs cursor-pointer"
              >
                <UserPlus className="h-3 w-3" />
                Add Walk-in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. Ticket Inventory Breakdown (Clean List) ── */}
      {ticketRows.length > 0 && (
        <section className="rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden shadow-2xs">
          <div className="px-4 sm:px-5 py-3 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <Ticket className="h-3.5 w-3.5 text-rose-500" /> Ticket Inventory
            </h2>
            <span className="text-xs font-bold text-neutral-500">
              {ticketRows.length} {ticketRows.length === 1 ? 'Tier' : 'Tiers'}
            </span>
          </div>

          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {ticketRows.map((tt) => {
              const qty = tt.quantity;
              const sold = tt.sold || 0;
              const left = qty != null ? Math.max(qty - sold, 0) : null;
              const isSoldOut = qty != null && left === 0;

              return (
                <li
                  key={tt.id}
                  className="px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 text-xs sm:text-sm"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-neutral-900 dark:text-white truncate">{tt.name}</p>
                      <span className="text-xs font-extrabold text-rose-600 dark:text-rose-400">
                        {tt.price === 0 ? 'Free' : formatNaira(tt.price)}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {sold}
                      {qty != null && <span className="text-neutral-400 font-normal"> / {qty}</span>}
                      <span className="text-neutral-400 font-normal text-xs"> sold</span>
                    </p>
                    {qty != null && (
                      <p
                        className={`text-[11px] tabular-nums font-semibold ${
                          isSoldOut
                            ? 'text-neutral-400'
                            : left != null && left <= 10
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-neutral-500'
                        }`}
                      >
                        {isSoldOut ? 'Sold Out' : `${left} left`}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
};

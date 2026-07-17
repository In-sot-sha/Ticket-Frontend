import React from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Globe,
  Ticket,
  Store,
} from 'lucide-react';
import EventPhaseBadge from './EventPhaseBadge';
import { formatNaira, OrganizerEvent } from '../../lib/eventOrganizer';
import { resolveImageUrl } from '../../lib/media';

interface OverviewTabProps {
  event: OrganizerEvent;
  vendorApplications?: any[];
}

/**
 * Overview = "What is this event?"
 * Identity, details, inventory snapshot — not performance deep-dive.
 */
export const OverviewTab: React.FC<OverviewTabProps> = ({ event, vendorApplications = [] }) => {
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

  return (
    <div className="space-y-4 px-4 sm:px-0">
      {/* Hero — identity only, no action buttons */}
      <section className="overflow-hidden rounded-none sm:rounded-xl border-0 sm:border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="relative">
          {cover ? (
            <div className="aspect-[21/9] sm:aspect-[3/1] w-full max-h-40 sm:max-h-48 relative">
              <img src={cover} alt={event.title} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
            </div>
          ) : (
            <div className="aspect-[21/9] sm:aspect-[3/1] w-full max-h-36 bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-neutral-300" />
            </div>
          )}

          <div
            className={`px-4 sm:px-4 pb-3 pt-3 ${
              cover ? 'sm:absolute sm:inset-x-0 sm:bottom-0 sm:pt-0 sm:pb-4' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <h1
                className={`text-lg sm:text-xl font-extrabold leading-snug text-balance text-neutral-900 dark:text-white ${
                  cover ? 'sm:text-white sm:drop-shadow-sm' : ''
                }`}
              >
                {event.title}
              </h1>
              <EventPhaseBadge event={event} />
            </div>

            <div
              className={`flex flex-wrap gap-x-3 gap-y-1 text-xs sm:text-sm text-neutral-500 ${
                cover ? 'sm:text-white/85' : ''
              }`}
            >
              <span className="flex items-center gap-1">
                <Calendar className={`h-3.5 w-3.5 shrink-0 text-neutral-400 ${cover ? 'sm:text-white/70' : ''}`} />
                {start.toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Clock className={`h-3.5 w-3.5 shrink-0 text-neutral-400 ${cover ? 'sm:text-white/70' : ''}`} />
                {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                {' – '}
                {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              </span>
              {event.location && (
                <span className="flex items-center gap-1 min-w-0">
                  {event.locationType === 'online' ? (
                    <Globe className={`h-3.5 w-3.5 shrink-0 text-neutral-400 ${cover ? 'sm:text-white/70' : ''}`} />
                  ) : (
                    <MapPin className={`h-3.5 w-3.5 shrink-0 text-neutral-400 ${cover ? 'sm:text-white/70' : ''}`} />
                  )}
                  <span className="truncate">{event.location}</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Event details */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 sm:p-4">
        <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-3">Event details</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">When</dt>
            <dd className="text-sm font-semibold text-neutral-900 dark:text-white">
              {start.toLocaleDateString('en-NG', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </dd>
            <dd className="text-xs text-neutral-500">
              {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {' – '}
              {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
              {event.endDate && event.endDate !== event.startDate && (
                <> · ends {end.toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })}</>
              )}
            </dd>
          </div>

          <div>
            <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">Where</dt>
            <dd className="text-sm font-semibold text-neutral-900 dark:text-white">
              {event.locationType === 'online' ? 'Online event' : event.location || 'TBA'}
            </dd>
            {event.locationType === 'online' && event.onlineUrl && (
              <a
                href={event.onlineUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-rose-500 hover:underline mt-0.5 inline-block truncate max-w-full"
              >
                {event.onlineUrl}
              </a>
            )}
          </div>

          {event.category && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">Category</dt>
              <dd className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">{event.category}</dd>
            </div>
          )}

          {typeof event.capacity === 'number' && (
            <div>
              <dt className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">Capacity</dt>
              <dd className="text-sm font-semibold text-neutral-900 dark:text-white">{event.capacity}</dd>
            </div>
          )}
        </dl>

        {event.description && (
          <div className="mt-3 pt-3 border-t border-neutral-100 dark:border-neutral-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 mb-1">About</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap text-pretty">
              {event.description}
            </p>
          </div>
        )}
      </section>

      {/* Ticket inventory — plain readable list, not performance charts */}
      {ticketRows.length > 0 && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-3.5 sm:px-4 py-2.5 border-b border-neutral-100 dark:border-neutral-800 flex items-center gap-1.5">
            <Ticket className="h-3.5 w-3.5 text-rose-500" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400">Ticket inventory</h2>
          </div>
          <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {ticketRows.map((tt) => {
              const qty = tt.quantity;
              const left = qty != null ? Math.max(qty - tt.sold, 0) : null;
              return (
                <li key={tt.id} className="px-3.5 sm:px-4 py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">{tt.name}</p>
                    <p className="text-xs text-neutral-500">{tt.price === 0 ? 'Free' : formatNaira(tt.price)}</p>
                  </div>
                  <div className="text-right shrink-0 text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {tt.sold}
                      {qty != null && <span className="text-neutral-400 font-normal"> / {qty}</span>}
                      <span className="text-neutral-400 font-normal text-xs"> sold</span>
                    </p>
                    {left != null && (
                      <p className="text-xs text-neutral-500 tabular-nums">{left} left</p>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {event.allowVendors && pendingVendors.length > 0 && (
        <div className="rounded-xl border border-amber-200 dark:border-amber-900/40 bg-amber-50/80 dark:bg-amber-950/20 px-3.5 py-2.5 flex items-center gap-2 text-sm">
          <Store className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <p className="text-amber-800 dark:text-amber-200">
            <span className="font-semibold">{pendingVendors.length}</span> vendor
            {pendingVendors.length === 1 ? '' : 's'} waiting in the Vendors tab.
          </p>
        </div>
      )}
    </div>
  );
};

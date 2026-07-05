import React, { useState } from 'react';
import { Copy, CheckCircle2, Ticket } from 'lucide-react';
import { formatNaira, OrganizerEvent } from '../../lib/eventOrganizer';

interface OverviewTabProps {
  event: OrganizerEvent;
  onOpenAttendees?: () => void;
  vendorApplications?: any[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ event, onOpenAttendees, vendorApplications }) => {
  const [copied, setCopied] = useState(false);
  const stats = event.stats;
  const sold = stats?.ticketsSold ?? event.attendees ?? 0;
  const pct = stats?.sellThroughPercent ?? 0;
  const earned = stats?.actualRevenue ?? event.revenue ?? 0;
  const expected = stats?.expectedRevenue ?? 0;

  return (
    <div className="space-y-6">
      {/* Event Details Card */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Event Details</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Date & Time</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white">
              {event.startDate ? new Date(event.startDate).toLocaleDateString() : 'TBA'}
              {event.startTime && ` at ${event.startTime}`}
            </p>
            {event.endDate && event.endDate !== event.startDate && (
              <p className="text-xs text-neutral-500 mt-1">Until {new Date(event.endDate).toLocaleDateString()}</p>
            )}
          </div>
          <div>
            <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Location</p>
            <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
              {event.locationType === 'online' ? 'Online Event' : (event.location || 'TBA')}
            </p>
            {event.locationType === 'online' && event.onlineUrl && (
              <a href={event.onlineUrl} target="_blank" rel="noreferrer" className="text-xs text-rose-500 hover:underline mt-1 block truncate">
                {event.onlineUrl}
              </a>
            )}
          </div>
          {event.category && (
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Category</p>
              <p className="text-sm font-semibold text-neutral-900 dark:text-white capitalize">{event.category}</p>
            </div>
          )}
        </div>
      </div>

      {/* Vendor Applications Summary */}
      {event.allowVendors && vendorApplications && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
          <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider mb-4">Vendor Summary</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Approved Stalls</p>
              <p className="text-base font-extrabold text-neutral-900 dark:text-white">
                {vendorApplications.filter(v => v.applicationStatus === 'APPROVED').length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Pending Apps</p>
              <p className="text-base font-extrabold text-amber-500">
                {vendorApplications.filter(v => v.applicationStatus === 'PENDING' || !v.applicationStatus).length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500 uppercase tracking-wider mb-1">Stalls Revenue</p>
              <p className="text-base font-extrabold text-emerald-500">
                {formatNaira(
                  vendorApplications
                    .filter(v => v.applicationStatus === 'APPROVED')
                    .reduce((acc, curr) => acc + (curr.vendorType?.fee ?? 0), 0)
                )}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sell-through progress */}
      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300">Sell-through rate</p>
          <p className="text-lg font-extrabold text-rose-500">{pct}%</p>
        </div>
        <div className="h-3 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="text-xs text-neutral-500 mt-3">{sold} sold · {(stats?.ticketInventory ?? 0) - sold} remaining</p>
      </div>

      {/* Ticket type breakdown */}
      {stats?.ticketTypeStats && stats.ticketTypeStats.length > 0 && (
        <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
            <h2 className="text-sm font-bold text-neutral-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-rose-500" /> Sales by ticket type
            </h2>
          </div>
          <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
            {stats.ticketTypeStats.map((tt) => {
              const ttPct = (tt.quantity ?? 0) > 0
                ? Math.round((tt.sold / (tt.quantity ?? 1)) * 100)
                : 0;
              const ticketsLeft = (tt.quantity ?? 0) - tt.sold;
              return (
                <div key={tt.id} className="px-4 py-4">
                  {/* Name + price row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-sm font-bold text-neutral-900 dark:text-white">{tt.name}</p>
                      <p className="text-xs text-neutral-500">
                        {tt.price === 0 ? 'Free' : formatNaira(tt.price)} · {tt.quantity ?? 0} total
                      </p>
                    </div>
                    <span className="text-sm font-extrabold text-rose-500 shrink-0">{ttPct}%</span>
                  </div>
                  {/* Progress bar */}
                  <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden mb-3">
                    <div className="h-full bg-rose-400 rounded-full" style={{ width: `${ttPct}%` }} />
                  </div>
                  {/* Stats grid */}
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { label: 'Sold',     value: String(tt.sold) },
                      { label: 'Left',     value: String(ticketsLeft) },
                      { label: 'Earned',   value: formatNaira(tt.revenue), accent: true },
                      { label: 'Max',      value: formatNaira(tt.expectedRevenue) },
                    ].map(s => (
                      <div key={s.label}>
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold mb-1">{s.label}</p>
                        <p className={`text-xs font-bold truncate ${s.accent ? 'text-rose-500' : 'text-neutral-900 dark:text-white'}`}>
                          {s.value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

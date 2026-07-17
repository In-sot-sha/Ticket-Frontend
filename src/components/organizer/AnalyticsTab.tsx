import React, { useMemo } from 'react';
import { BarChart3, Store } from 'lucide-react';
import { formatNaira, OrganizerEvent } from '../../lib/eventOrganizer';

interface AnalyticsTabProps {
  event: OrganizerEvent & {
    vendorTypes?: Array<{
      id: number | string;
      name: string;
      fee?: number | null;
      price?: number;
      maxVendors?: number | null;
      maxStalls?: number;
    }>;
    vendorDeadline?: string;
  };
  vendorApplications?: any[];
}

const normalizeStatus = (status: any): 'PENDING' | 'APPROVED' | 'REJECTED' => {
  if (status === 'APPROVED' || status === true) return 'APPROVED';
  if (status === 'REJECTED' || status === false) return 'REJECTED';
  return 'PENDING';
};

/**
 * Analytics = ticket performance + simple stall overview (separate).
 */
export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  event,
  vendorApplications = [],
}) => {
  const stats = event.stats;
  const sold = stats?.ticketsSold ?? event.attendees ?? 0;
  const checkedIn = stats?.ticketsCheckedIn ?? 0;
  const pct = stats?.sellThroughPercent ?? 0;
  const earned = stats?.actualRevenue ?? event.revenue ?? 0;
  const expected = stats?.expectedRevenue ?? 0;
  const inventory = stats?.ticketInventory ?? 0;
  const remaining = Math.max(inventory - sold, 0);
  const revenuePace = expected > 0 ? Math.round((earned / expected) * 100) : 0;
  const remainingPotential = Math.max(expected - earned, 0);

  const ticketStats = stats?.ticketTypeStats ?? [];

  const stallTypes =
    event.vendorTypes?.length
      ? event.vendorTypes
      : event.vendorSettings?.stallTypes || [];

  const stalls = useMemo(() => {
    if (!event.allowVendors) return [];

    return stallTypes.map((vt: any) => {
      const related = vendorApplications.filter((a) => {
        const typeId = a.vendorTypeId ?? a.vendorType?.id;
        return typeId === vt.id || a.vendorType?.name === vt.name;
      });
      const filled = related.filter(
        (a) => normalizeStatus(a.applicationStatus) === 'APPROVED'
      ).length;
      const max = vt.maxVendors ?? vt.maxStalls ?? null;
      const fee = typeof vt.fee === 'number' ? vt.fee : typeof vt.price === 'number' ? vt.price : 0;
      return {
        id: vt.id,
        name: vt.name,
        fee,
        filled,
        max,
        available: max != null ? Math.max(max - filled, 0) : null,
      };
    });
  }, [event.allowVendors, vendorApplications, stallTypes]);

  return (
    <div className="space-y-4 px-4 sm:px-0">
      {/* Ticket KPIs */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Revenue</p>
          <p className="text-xl font-extrabold text-rose-500 tabular-nums mt-0.5">
            {formatNaira(earned)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">
            of {formatNaira(expected)} expected · {revenuePace}%
          </p>
        </div>
        <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">
            Still to earn
          </p>
          <p className="text-xl font-extrabold text-neutral-900 dark:text-white tabular-nums mt-0.5">
            {formatNaira(remainingPotential)}
          </p>
          <p className="text-[11px] text-neutral-500 mt-0.5">{remaining} tickets left</p>
        </div>
      </div>

      {/* Sell-through bar */}
      <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5">
        <div className="flex items-baseline justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Ticket sell-through</h3>
          <p className="text-sm font-bold text-neutral-700 dark:text-neutral-300 tabular-nums">
            {sold} / {inventory || '—'}
          </p>
        </div>
        <div className="h-2 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-rose-500 rounded-full"
            style={{ width: `${Math.min(pct, 100)}%` }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[11px] text-neutral-500">
          <span>{pct}% sold</span>
          <span>{remaining} left</span>
        </div>
      </section>

      {/* Ticket sales — tickets only */}
      {ticketStats.length > 0 ? (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Sales by ticket type</h3>
          </div>

          <div className="sm:hidden divide-y divide-neutral-100 dark:divide-neutral-800">
            {ticketStats.map((tt) => {
              const qty = tt.quantity;
              const left = qty != null ? Math.max(qty - tt.sold, 0) : null;
              return (
                <div key={tt.id} className="px-3.5 py-3 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-neutral-900 dark:text-white">{tt.name}</p>
                      <p className="text-xs text-neutral-500">
                        {tt.price === 0 ? 'Free' : formatNaira(tt.price)} each
                      </p>
                    </div>
                    <p className="text-sm font-bold text-rose-500 tabular-nums">
                      {formatNaira(tt.revenue)}
                    </p>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400">
                    <span className="font-semibold text-neutral-900 dark:text-white">{tt.sold}</span>
                    {qty != null ? ` / ${qty}` : ''} sold
                    {left != null && <> · {left} left</>}
                    <> · {tt.checkedIn} checked in</>
                  </p>
                </div>
              );
            })}
          </div>

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800/40">
                <tr className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  <th className="px-3.5 py-2.5 text-left">Type</th>
                  <th className="px-3.5 py-2.5 text-right">Price</th>
                  <th className="px-3.5 py-2.5 text-right">Sold</th>
                  <th className="px-3.5 py-2.5 text-right">Left</th>
                  <th className="px-3.5 py-2.5 text-right">Checked in</th>
                  <th className="px-3.5 py-2.5 text-right">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {ticketStats.map((tt) => {
                  const qty = tt.quantity;
                  const left = qty != null ? Math.max(qty - tt.sold, 0) : '—';
                  return (
                    <tr key={tt.id} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/20">
                      <td className="px-3.5 py-2.5 font-semibold text-neutral-900 dark:text-white">
                        {tt.name}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                        {tt.price === 0 ? 'Free' : formatNaira(tt.price)}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-neutral-900 dark:text-white tabular-nums">
                        {tt.sold}
                        {qty != null && (
                          <span className="text-neutral-400 font-normal">/{qty}</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                        {left}
                      </td>
                      <td className="px-3.5 py-2.5 text-right text-neutral-600 dark:text-neutral-400 tabular-nums">
                        {tt.checkedIn}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-semibold text-rose-500 tabular-nums">
                        {formatNaira(tt.revenue)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="border-t border-neutral-200 dark:border-neutral-700 bg-neutral-50/80 dark:bg-neutral-800/40">
                <tr>
                  <td
                    className="px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider text-neutral-500"
                    colSpan={2}
                  >
                    Total
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                    {sold}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                    {remaining}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-neutral-900 dark:text-white tabular-nums">
                    {checkedIn}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-rose-500 tabular-nums">
                    {formatNaira(earned)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 py-8 text-center px-4">
          <BarChart3 className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-neutral-900 dark:text-white">No ticket sales yet</p>
          <p className="text-xs text-neutral-500 mt-1">Breakdowns show up once tickets start selling.</p>
        </div>
      )}

      {/* Stalls — separate, simple */}
      {event.allowVendors && (
        <section className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-hidden">
          <div className="px-3.5 py-2.5 border-b border-neutral-100 dark:border-neutral-800">
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-rose-500" />
              Stalls
            </h3>
          </div>

          {stalls.length === 0 ? (
            <p className="px-3.5 py-6 text-sm text-neutral-500 text-center">
              No stall types configured for this event.
            </p>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-800">
              {stalls.map((stall) => (
                <li
                  key={stall.id}
                  className="px-3.5 py-2.5 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-neutral-900 dark:text-white truncate">
                      {stall.name}
                    </p>
                    <p className="text-xs text-neutral-500">
                      {stall.fee === 0 ? 'Free' : formatNaira(stall.fee)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-sm">
                    <p className="font-semibold text-neutral-900 dark:text-white tabular-nums">
                      {stall.filled}
                      {stall.max != null && (
                        <span className="text-neutral-400 font-normal">/{stall.max}</span>
                      )}
                      <span className="text-xs font-normal text-neutral-400"> taken</span>
                    </p>
                    <p className="text-xs tabular-nums">
                      {stall.available == null ? (
                        <span className="text-neutral-400">No cap</span>
                      ) : stall.available === 0 ? (
                        <span className="text-neutral-400">Full</span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          {stall.available} left
                        </span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
};

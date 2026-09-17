import React from 'react';
import { cn } from '../../lib/utils';
import { eventDayList, shortDayChip, ymdFromUnknown } from '../../lib/ticketValidity';

/** Shown only on multi-day events. Empty value = all days. */
export function ValidOnField({
  startDate,
  endDate,
  value,
  onChange,
}: {
  startDate?: string | null;
  endDate?: string | null;
  value?: string | null;
  onChange: (next: string) => void;
}) {
  const days = eventDayList(startDate, endDate);
  if (days.length <= 1) return null;
  const selected = ymdFromUnknown(value);

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300">Days</p>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => onChange('')}
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-bold border',
            !selected
              ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
              : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
          )}
        >
          All days
        </button>
        {days.map((ymd) => (
          <button
            key={ymd}
            type="button"
            onClick={() => onChange(ymd)}
            className={cn(
              'rounded-full px-2.5 py-1 text-[11px] font-bold border',
              selected === ymd
                ? 'border-rose-500 bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300'
                : 'border-neutral-200 text-neutral-600 dark:border-neutral-700 dark:text-neutral-300'
            )}
          >
            {shortDayChip(ymd)}
          </button>
        ))}
      </div>
      <p className="mt-1 text-[11px] text-neutral-400">
        {selected
          ? 'Buyers can only enter on that date — not other event days.'
          : 'Works every event day. One scan per day.'}
      </p>
    </div>
  );
}

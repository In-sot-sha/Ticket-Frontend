import React from 'react';
import { cn } from '../../lib/utils';

export interface PageHeaderProps {
  title: React.ReactNode;
  /** Optional accent word rendered in rose after title when title is a string */
  accent?: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent page heading for admin / staff / dashboard surfaces.
 * Prefer: title + optional accent, one-line description, optional actions.
 */
export function PageHeader({ title, accent, description, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'mb-3.5 sm:mb-4 flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between border-b border-neutral-200/80 dark:border-neutral-800/80 pb-2.5 sm:pb-3',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 leading-snug">
          {typeof title === 'string' && accent ? (
            <>
              {title} <span className="text-rose-500 font-extrabold">{accent}</span>
            </>
          ) : (
            title
          )}
        </h1>
        {description ? (
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5 max-w-2xl leading-normal">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;

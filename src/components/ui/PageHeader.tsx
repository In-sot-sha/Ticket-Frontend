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
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-neutral-100 dark:border-neutral-900 pb-4',
        className
      )}
    >
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100">
          {typeof title === 'string' && accent ? (
            <>
              {title} <span className="text-rose-500">{accent}</span>
            </>
          ) : (
            title
          )}
        </h1>
        {description ? (
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1 max-w-2xl">{description}</p>
        ) : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
    </div>
  );
}

export default PageHeader;

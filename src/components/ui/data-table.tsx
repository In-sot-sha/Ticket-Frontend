import React, { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Skeleton } from './skeleton';

export interface DataTableColumn<T> {
  id: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  className?: string;
  /** Hide on mobile card primary line */
  hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  getRowId: (row: T) => string | number;
  pageSize?: number;
  searchPlaceholder?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  toolbar?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  className?: string;
  hideSearch?: boolean;
  /** Mobile card tap — use when primary actions are desktop-only */
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  pageSize = 10,
  searchPlaceholder = 'Search…',
  searchValue,
  onSearchChange,
  toolbar,
  emptyTitle = 'No results',
  emptyDescription = 'Try adjusting filters or search.',
  className,
  hideSearch = false,
  onRowClick,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [internalSearch, setInternalSearch] = useState('');

  const controlled = searchValue !== undefined;
  const q = controlled ? searchValue! : internalSearch;

  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);

  const pageRows = useMemo(() => {
    const start = safePage * pageSize;
    return rows.slice(start, start + pageSize);
  }, [rows, safePage, pageSize]);

  useEffect(() => {
    setPage(0);
  }, [rows.length, q, pageSize]);

  const setSearch = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setInternalSearch(value);
  };

  const showSearch = !hideSearch && (onSearchChange !== undefined || searchValue === undefined);

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        {showSearch ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              value={q}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
            />
          </div>
        ) : (
          <div />
        )}
        {toolbar && <div className="flex flex-wrap items-center gap-2">{toolbar}</div>}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 px-4 py-12 text-center">
          <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{emptyTitle}</p>
          <p className="text-xs text-neutral-500 mt-1">{emptyDescription}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
            <table className="w-full text-sm text-left">
              <thead className="bg-neutral-50 dark:bg-neutral-950/50 text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  {columns.map((col) => (
                    <th key={col.id} className={cn('px-4 py-3 font-semibold', col.className)}>
                      {col.header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100 dark:divide-neutral-800">
                {pageRows.map((row) => (
                  <tr key={getRowId(row)} className="hover:bg-neutral-50/80 dark:hover:bg-neutral-800/40">
                    {columns.map((col) => (
                      <td key={col.id} className={cn('px-4 py-3 align-middle', col.className)}>
                        {col.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-2">
            {pageRows.map((row) => {
              const CardTag = onRowClick ? 'button' : 'div';
              return (
                <CardTag
                  key={getRowId(row)}
                  type={onRowClick ? 'button' : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'w-full text-left rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-2',
                    onRowClick && 'active:bg-neutral-50 dark:active:bg-neutral-800/60'
                  )}
                >
                  {columns
                    .filter((c) => !c.hideOnMobile)
                    .map((col) => (
                      <div key={col.id} className="flex items-start justify-between gap-3 text-sm">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 shrink-0 pt-0.5">
                          {col.header}
                        </span>
                        <div className="text-right min-w-0 text-neutral-900 dark:text-neutral-100">
                          {col.cell(row)}
                        </div>
                      </div>
                    ))}
                  {onRowClick && (
                    <p className="text-[10px] font-bold uppercase tracking-wider text-rose-500 pt-1">
                      Tap to manage →
                    </p>
                  )}
                </CardTag>
              );
            })}
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-xs text-neutral-500">
              {rows.length === 0
                ? '0'
                : `${safePage * pageSize + 1}–${Math.min((safePage + 1) * pageSize, rows.length)} of ${rows.length}`}
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={safePage <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                className="h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs font-semibold tabular-nums px-2">
                {safePage + 1} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages - 1}
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                className="h-9 w-9 rounded-lg border border-neutral-200 dark:border-neutral-700 flex items-center justify-center disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

/** Layout-matched loading state for DataTable — keep page headers outside this. */
export function DataTableSkeleton({
  rows = 6,
  columns = 4,
  showSearch = true,
  toolbar,
  className,
}: {
  rows?: number;
  columns?: number;
  showSearch?: boolean;
  toolbar?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        {showSearch ? (
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ) : (
          <div />
        )}
        {toolbar ? <div className="flex flex-wrap items-center gap-2">{toolbar}</div> : null}
      </div>

      <div className="hidden md:block overflow-hidden rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="bg-neutral-50 dark:bg-neutral-950/50 px-4 py-3 flex gap-6">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-16 rounded-md" />
          ))}
        </div>
        <div className="divide-y divide-neutral-100 dark:divide-neutral-800">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="px-4 py-3.5 flex items-center gap-4">
              <Skeleton className="h-4 w-[22%] rounded-md" />
              <Skeleton className="h-4 w-[18%] rounded-md" />
              <Skeleton className="h-4 w-[14%] rounded-md hidden sm:block" />
              <Skeleton className="h-8 w-20 rounded-full ml-auto shrink-0" />
            </div>
          ))}
        </div>
      </div>

      <div className="md:hidden space-y-2">
        {Array.from({ length: Math.min(rows, 5) }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-3.5 space-y-2.5"
          >
            <Skeleton className="h-3.5 w-2/3 rounded-md" />
            <Skeleton className="h-3 w-1/2 rounded-md" />
            <Skeleton className="h-3 w-1/3 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default DataTable;

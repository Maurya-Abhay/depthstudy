'use client';

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function AdminPagination({
  page,
  pageCount,
  total,
  pageSize = 10,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  if (total <= pageSize) return null;

  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div
      className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-zinc-50/50 dark:bg-zinc-800/30 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400 font-sans"
      aria-label="Pagination"
    >
      {/* Items Range Indicator */}
      <div>
        Showing{' '}
        <strong className="font-semibold text-zinc-800 dark:text-zinc-200">
          {start}–{end}
        </strong>{' '}
        of <strong className="font-semibold text-zinc-800 dark:text-zinc-200">{total}</strong> items
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        {/* First Page Button */}
        <button
          type="button"
          aria-label="First page"
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Previous Page Button */}
        <button
          type="button"
          aria-label="Previous page"
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Page Status Badge */}
        <span className="px-3 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/40 text-zinc-700 dark:text-zinc-300 font-medium select-none">
          Page {page} of {pageCount}
        </span>

        {/* Next Page Button */}
        <button
          type="button"
          aria-label="Next page"
          disabled={page === pageCount}
          onClick={() => onPageChange(page + 1)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Last Page Button */}
        <button
          type="button"
          aria-label="Last page"
          disabled={page === pageCount}
          onClick={() => onPageChange(pageCount)}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-sm"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function paginate<T>(items: T[], page: number, pageSize = 10) {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
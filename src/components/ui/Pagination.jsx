import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Compact pagination footer. `rangeLabel` shows e.g. "Showing 1–20 of 84".
 */
const Pagination = ({ page, totalPages, onPageChange, rangeLabel, className = '' }) => {
  if (!totalPages || totalPages <= 1) {
    return rangeLabel ? (
      <div className={`px-4 py-3 text-xs text-ink-soft border-t border-line ${className}`}>{rangeLabel}</div>
    ) : null;
  }

  return (
    <div className={`flex items-center justify-between gap-3 px-4 py-3 border-t border-line ${className}`}>
      <span className="text-xs text-ink-soft truncate">{rangeLabel}</span>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft hover:bg-canvas disabled:opacity-40 disabled:hover:bg-surface transition"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span className="px-2 text-xs font-semibold text-ink tabular-nums">
          {page} <span className="text-ink-faint font-normal">/ {totalPages}</span>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-line bg-surface text-ink-soft hover:bg-canvas disabled:opacity-40 disabled:hover:bg-surface transition"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;

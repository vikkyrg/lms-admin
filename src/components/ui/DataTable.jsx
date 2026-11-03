import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import EmptyState from './EmptyState';
import { SkeletonTable } from './LoadingSkeleton';

/**
 * Consistent admin data table.
 *
 * columns: [{ key, header, className, render: (row, index) => node }]
 * rows / rowKey / loading / error (+onRetry) / empty ({icon,title,message,action})
 * toolbar: optional node rendered above the table (search / filters).
 * footer: optional node (usually <Pagination/>).
 */
const DataTable = ({
  columns = [],
  rows = [],
  rowKey = (row, i) => row._id || row.id || i,
  loading = false,
  error = null,
  onRetry = null,
  empty = null,
  toolbar = null,
  footer = null,
  onRowClick = null,
  minWidthClass = 'min-w-[720px]',
  skeletonRows = 6
}) => {
  return (
    <div className="bg-surface border border-line rounded-lg shadow-card overflow-hidden">
      {toolbar ? (
        <div className="flex flex-wrap items-center gap-2.5 px-4 py-3 border-b border-line">{toolbar}</div>
      ) : null}

      {loading ? (
        <SkeletonTable rows={skeletonRows} cols={Math.min(columns.length || 5, 6)} />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-danger-soft text-danger border border-danger/15">
            <AlertTriangle className="h-5 w-5" />
          </span>
          <p className="mt-3 text-sm font-semibold text-ink">Could not load data</p>
          <p className="mt-1 text-xs text-ink-soft max-w-sm">{typeof error === 'string' ? error : 'Something went wrong while fetching.'}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface px-3 py-1.5 text-xs font-semibold text-ink hover:bg-canvas transition"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </button>
          ) : null}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState
          icon={empty?.icon}
          title={empty?.title || 'No records found'}
          message={empty?.message}
          action={empty?.action}
        />
      ) : (
        <div className="overflow-x-auto">
          <table className={`w-full text-left ${minWidthClass}`}>
            <thead>
              <tr className="border-b border-line bg-canvas/70">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-soft whitespace-nowrap ${col.className || ''}`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line-soft">
              {rows.map((row, index) => (
                <tr
                  key={rowKey(row, index)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer' : ''} hover:bg-canvas/60`}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-2.5 text-[13px] text-ink align-middle ${col.className || ''}`}>
                      {col.render ? col.render(row, index) : row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {footer && !loading && !error && rows.length > 0 ? footer : null}
    </div>
  );
};

export default DataTable;

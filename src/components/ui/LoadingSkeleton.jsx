import React from 'react';

/**
 * Loading skeletons. Use SkeletonTable inside DataTable while rows load,
 * SkeletonBlock anywhere else.
 */
export const Skeleton = ({ className = '' }) => (
  <span className={`block admin-skeleton ${className}`} aria-hidden="true" />
);

export const SkeletonText = ({ lines = 3, className = '' }) => (
  <div className={`space-y-2 ${className}`} aria-hidden="true">
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton key={i} className={i === lines - 1 ? 'h-3 w-2/3' : 'h-3 w-full'} />
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 5 }) => (
  <div aria-hidden="true">
    <div className="flex items-center gap-4 px-4 py-2.5 border-b border-line bg-canvas/70">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className="h-3 flex-1 min-w-0" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 px-4 py-3 border-b border-line-soft last:border-b-0">
        {Array.from({ length: cols }).map((_, c) => (
          <Skeleton key={c} className={`h-3.5 flex-1 min-w-0 ${c === 0 ? 'max-w-[38%]' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonCards = ({ count = 4, className = '' }) => (
  <div className={`grid gap-4 ${className}`} aria-hidden="true">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-line bg-surface p-4">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="mt-3 h-6 w-16" />
      </div>
    ))}
  </div>
);

export default Skeleton;

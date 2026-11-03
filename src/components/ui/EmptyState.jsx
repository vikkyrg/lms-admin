import React from 'react';
import { Inbox } from 'lucide-react';

/**
 * Compact empty state for tables, lists and sections.
 */
const EmptyState = ({ icon: Icon = Inbox, title = 'Nothing here yet', message, action = null, className = '' }) => (
  <div className={`flex flex-col items-center justify-center py-12 px-4 text-center ${className}`}>
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-canvas text-ink-faint border border-line">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 text-sm font-semibold text-ink">{title}</p>
    {message ? <p className="mt-1 text-xs text-ink-soft max-w-sm">{message}</p> : null}
    {action ? <div className="mt-4">{action}</div> : null}
  </div>
);

export default EmptyState;

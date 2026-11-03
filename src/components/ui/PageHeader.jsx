import React from 'react';

/**
 * Page title block rendered inside the content area (the layout header
 * already shows breadcrumb + title, so pages use this for section-level
 * titles with actions).
 */
const PageHeader = ({ title, description, actions = null, className = '' }) => (
  <div className={`flex flex-wrap items-start justify-between gap-3 ${className}`}>
    <div className="min-w-0">
      <h1 className="text-lg font-bold text-ink tracking-tight">{title}</h1>
      {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
    </div>
    {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
  </div>
);

export default PageHeader;

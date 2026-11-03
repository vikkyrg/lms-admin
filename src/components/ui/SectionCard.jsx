import React from 'react';

/**
 * White surface card with optional header row (title + actions).
 */
const SectionCard = ({ title, description, actions = null, children, className = '' }) => (
  <section className={`bg-surface border border-line rounded-lg shadow-card ${className}`}>
    {(title || actions) && (
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <div className="min-w-0">
          {title ? <h3 className="text-sm font-semibold text-ink">{title}</h3> : null}
          {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
        </div>
        {actions ? <div className="flex items-center gap-2 shrink-0">{actions}</div> : null}
      </header>
    )}
    <div>{children}</div>
  </section>
);

export default SectionCard;

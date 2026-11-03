import React from 'react';

/**
 * Compact dashboard metric card.
 * label / value / icon (lucide component) / optional sub (trend or context).
 * Only real data should ever be passed as `value`.
 */
const TONES = {
  brand: 'bg-brand-soft text-brand',
  navy: 'bg-[#eaf0f9] text-navy',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
  neutral: 'bg-canvas text-ink-soft'
};

const MetricCard = ({ label, value, icon: Icon, tone = 'brand', sub = null, className = '' }) => (
  <div className={`bg-surface border border-line rounded-lg shadow-card px-4 py-3.5 flex items-start justify-between gap-3 min-w-0 ${className}`}>
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-soft truncate">{label}</p>
      <p className="mt-1 text-[22px] leading-7 font-bold text-ink truncate">{value}</p>
      {sub ? <div className="mt-1 text-xs text-ink-soft truncate">{sub}</div> : null}
    </div>
    {Icon ? (
      <span className={`shrink-0 mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-md ${TONES[tone] || TONES.brand}`}>
        <Icon className="h-4 w-4" />
      </span>
    ) : null}
  </div>
);

export default MetricCard;

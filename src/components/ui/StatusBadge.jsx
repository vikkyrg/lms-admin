import React from 'react';

/**
 * Neutral status badge. Colors are reserved for meaningful states only:
 * success / warning / danger / info / neutral.
 */
const TONE_CLASSES = {
  success: 'bg-success-soft text-[#15803d] ring-[#16a34a]/20',
  warning: 'bg-warning-soft text-[#b45309] ring-[#d97706]/20',
  danger: 'bg-danger-soft text-[#b91c1c] ring-[#dc2626]/20',
  info: 'bg-brand-soft text-[#2258c9] ring-[#2f6fed]/20',
  neutral: 'bg-canvas text-ink-soft ring-[#e2e8f0]'
};

// Maps the LMS domain statuses to tones. Unknown values render neutral.
export const statusTone = (status) => {
  const s = String(status || '').toLowerCase();
  if (['approved', 'active', 'completed', 'paid', 'published', 'success', 'verified', 'read', 'accepted', 'graded', 'true'].includes(s) || s === 'true') return 'success';
  if (['pending', 'pending_approval', 'in_review', 'processing', 'unpaid', 'draft', 'unread', 'initiated'].includes(s)) return 'warning';
  if (['rejected', 'failed', 'expired', 'refunded', 'partially_refunded', 'unverified', 'inactive', 'deleted', 'overdue'].includes(s)) return 'danger';
  if (['trial', 'enrolled', 'ongoing', 'queued'].includes(s)) return 'info';
  return 'neutral';
};

export const formatStatusLabel = (status) =>
  String(status || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const StatusBadge = ({ value, label, tone, dot = false, className = '' }) => {
  const t = tone || statusTone(value);
  const text = label || (value == null || value === '' ? '—' : formatStatusLabel(value));
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset whitespace-nowrap ${TONE_CLASSES[t] || TONE_CLASSES.neutral} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" /> : null}
      {text}
    </span>
  );
};

export default StatusBadge;

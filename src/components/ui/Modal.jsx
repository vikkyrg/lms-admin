import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Centered modal with calm entrance animation, escape-to-close and
 * scroll lock. Sizes: sm | md | lg | xl.
 */
const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl'
};

const Modal = ({ open, onClose, title, description, children, footer, size = 'md' }) => {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-navy-deep/50 p-4 admin-overlay-in"
      role="dialog"
      aria-modal="true"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div className={`w-full ${SIZES[size] || SIZES.md} max-h-[90vh] flex flex-col rounded-lg bg-surface shadow-overlay admin-modal-in`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink truncate">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-0.5 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1 min-h-0">{children}</div>
        {footer ? <div className="px-5 py-3.5 border-t border-line bg-canvas/60 rounded-b-lg shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
};

export default Modal;

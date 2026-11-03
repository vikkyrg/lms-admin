import React, { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Right-side drawer for detailed record editing / viewing.
 */
const Drawer = ({ open, onClose, title, description, children, footer, widthClass = 'w-full max-w-xl' }) => {
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
      className="fixed inset-0 z-[60] bg-navy-deep/50 admin-overlay-in"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={`absolute inset-y-0 right-0 ${widthClass} flex flex-col bg-surface shadow-overlay admin-drawer-in`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line shrink-0">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink truncate">{title}</h2>
            {description ? <p className="mt-0.5 text-xs text-ink-soft">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 -mr-1 -mt-0.5 rounded-md text-ink-faint hover:text-ink hover:bg-canvas transition"
            aria-label="Close drawer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <div className="px-5 py-3.5 border-t border-line bg-canvas/60 shrink-0">{footer}</div> : null}
      </div>
    </div>
  );
};

export default Drawer;

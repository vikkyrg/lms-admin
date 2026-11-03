import React, { useEffect, useRef, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';

/**
 * Compact kebab actions menu for table rows.
 * items: [{ label, icon: Icon, onClick, tone: 'default'|'danger', disabled }]
 */
const ActionMenu = ({ items = [], label = 'Row actions', align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-faint hover:text-ink hover:bg-canvas border border-transparent hover:border-line transition"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className={`absolute z-30 mt-1 w-44 rounded-md border border-line bg-surface py-1 shadow-pop ${
            align === 'left' ? 'right-0' : 'right-0'
          }`}
          role="menu"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={item.disabled}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick?.();
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium transition disabled:opacity-40 ${
                item.tone === 'danger'
                  ? 'text-danger hover:bg-danger-soft'
                  : 'text-ink hover:bg-canvas'
              }`}
            >
              {item.icon ? <item.icon className="h-3.5 w-3.5 shrink-0 text-ink-soft" /> : null}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};

export default ActionMenu;

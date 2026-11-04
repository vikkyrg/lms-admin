import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';

/**
 * Professional dropdown actions menu for table rows.
 * Uses a Portal and viewport position calculation so it is never clipped
 * by parent overflow-x-auto, fixed tables, or cards.
 * items: [{ label, icon: Icon, onClick, tone: 'default'|'danger', disabled }]
 */
const ActionMenu = ({ items = [], label = 'Row actions', align = 'right' }) => {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 176; // w-44 = 11rem = 176px
    let left = align === 'left' ? rect.left : rect.right - menuWidth;
    
    // Boundary protection for small screens
    if (left < 8) left = 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = window.innerWidth - menuWidth - 8;
    }

    const top = rect.bottom + 6;
    setCoords({ top, left });
  };

  useEffect(() => {
    if (!open) return undefined;
    updatePosition();

    const onDown = (e) => {
      if (
        triggerRef.current && triggerRef.current.contains(e.target)
      ) {
        return;
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };

    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };

    const onScrollOrResize = () => {
      setOpen(false);
    };

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScrollOrResize, true);
    window.addEventListener('resize', onScrollOrResize);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScrollOrResize, true);
      window.removeEventListener('resize', onScrollOrResize);
    };
  }, [open]);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen((o) => !o);
  };

  return (
    <div className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={toggle}
        aria-label={label}
        aria-expanded={open}
        className={`inline-flex h-7 w-7 items-center justify-center rounded-md border transition ${
          open
            ? 'bg-canvas text-ink border-line'
            : 'text-ink-faint hover:text-ink hover:bg-canvas border-transparent hover:border-line'
        }`}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>

      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              style={{
                position: 'fixed',
                top: `${coords.top}px`,
                left: `${coords.left}px`,
                zIndex: 9999
              }}
              className="w-44 rounded-lg border border-line bg-surface py-1 shadow-lg animate-in fade-in zoom-in-95 duration-100"
              role="menu"
              onClick={(e) => e.stopPropagation()}
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
                  className={`flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs font-medium transition disabled:opacity-40 cursor-pointer ${
                    item.tone === 'danger'
                      ? 'text-danger hover:bg-danger-soft'
                      : 'text-ink hover:bg-canvas'
                  }`}
                >
                  {item.icon ? (
                    <item.icon
                      className={`h-3.5 w-3.5 shrink-0 ${
                        item.tone === 'danger' ? 'text-danger' : 'text-ink-soft'
                      }`}
                    />
                  ) : null}
                  <span className="truncate">{item.label}</span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
};

export default ActionMenu;

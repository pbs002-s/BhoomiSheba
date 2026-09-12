import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cx } from '../lib/format';

/**
 * Shared dialog behaviour: Escape to close, focus trapped inside while
 * open, body scroll locked, first focusable element focused on open.
 * Any hand-rolled modal can call this instead of reimplementing it.
 */
export function useDialogA11y(open: boolean, onClose: () => void, panelRef: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key !== 'Tab') return;
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      if (!focusables?.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('input, button')?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose, panelRef]);
}

export default function Modal({
  open,
  onClose,
  label,
  title,
  bn,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  label?: string;
  title: string;
  bn?: string;
  children: React.ReactNode;
  wide?: boolean;
}) {
  const panelRef = useRef<HTMLDivElement | null>(null);
  useDialogA11y(open, onClose, panelRef);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <div className="absolute inset-0" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cx(
          'anim-sheet-in relative w-full border border-line bg-sheet-raised shadow-none sm:rounded-lg',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md'
        )}
      >
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div>
            {label && <span className="mono block text-2xs uppercase text-ink-3">{label}</span>}
            <h2 className="sheet-title mt-0.5 text-lg font-semibold text-ink">{title}</h2>
            {bn && <p className="bn text-xs text-ink-3">{bn}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="no-print -mr-1 rounded-md p-1 text-ink-3 transition-colors duration-1 hover:bg-ground-sunk hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>
  );
}

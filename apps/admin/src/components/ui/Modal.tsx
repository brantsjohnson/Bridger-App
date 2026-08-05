// ============================================
// WHAT THIS FILE DOES (plain English):
// Simple accessible dialog for confirmations and short forms. Closes on
// Escape or backdrop click. Focus stays inside while open.
// ============================================
import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Button } from './Button';

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  /** Optional footer actions; defaults to a Close button. */
  footer?: ReactNode;
};

export function Modal({ open, title, onClose, children, footer }: Props) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  // ACCESSIBILITY: Escape closes; restore focus awareness
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="presentation"
    >
      {/* Backdrop: no shadow, just a dim wash */}
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-ink/40"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg rounded-card border border-line bg-surface p-5 outline-none"
      >
        <header className="mb-4 flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-pixel text-xl text-ink">
            {title}
          </h2>
          <Button variant="ghost" onClick={onClose} aria-label="Close">
            Close
          </Button>
        </header>
        <div>{children}</div>
        <footer className="mt-5 flex justify-end gap-2">
          {footer ?? (
            <Button variant="secondary" onClick={onClose}>
              Done
            </Button>
          )}
        </footer>
      </div>
    </div>
  );
}

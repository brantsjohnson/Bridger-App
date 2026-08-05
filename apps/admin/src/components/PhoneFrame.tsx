// ============================================
// WHAT THIS FILE DOES (plain English):
// A simple phone outline so the demo preview looks like Bridger on a phone,
// not a flat rectangle. Purely visual. No real device code.
// ============================================
import type { ReactNode } from 'react';

type Props = {
  /** What to show inside the phone screen. */
  children: ReactNode;
  /** Short label under the phone, e.g. "Home" or "Take a photo". */
  caption?: string;
};

export function PhoneFrame({ children, caption }: Props) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="relative w-[280px] rounded-[2rem] border-[3px] border-ink bg-ink p-2 shadow-none"
        aria-hidden={false}
        role="img"
        aria-label={caption ? `Phone preview: ${caption}` : 'Phone preview'}
      >
        {/* --- Notch --- */}
        <div className="pointer-events-none absolute left-1/2 top-2 z-10 h-4 w-20 -translate-x-1/2 rounded-full bg-ink" />
        <div className="h-[520px] overflow-hidden rounded-[1.5rem] bg-canvas text-ink">
          {children}
        </div>
      </div>
      {caption ? (
        <p className="text-center text-xs text-muted">{caption}</p>
      ) : null}
    </div>
  );
}

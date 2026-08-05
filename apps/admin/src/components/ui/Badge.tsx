// ============================================
// WHAT THIS FILE DOES (plain English):
// Small status pill (live / draft / archived / published). Color is a hint;
// the text label is the real signal for accessibility.
// ============================================
import type { ReactNode } from 'react';

type Tone = 'live' | 'draft' | 'archived' | 'ok' | 'muted' | 'danger';

type Props = {
  tone?: Tone;
  children: ReactNode;
};

const TONE_CLASS: Record<Tone, string> = {
  live: 'bg-accent-green text-ink',
  draft: 'bg-accent-amber text-ink',
  archived: 'bg-line text-muted',
  ok: 'bg-accent-teal/20 text-ok',
  muted: 'bg-canvas text-muted border border-line',
  danger: 'bg-danger/10 text-danger'
};

export function Badge({ tone = 'muted', children }: Props) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-medium',
        TONE_CLASS[tone]
      ].join(' ')}
    >
      {children}
    </span>
  );
}

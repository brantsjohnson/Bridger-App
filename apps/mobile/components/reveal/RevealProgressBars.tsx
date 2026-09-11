// ============================================
// WHAT THIS FILE DOES (plain English):
// The three thin bars at the top of the Connection Reveal story (Screens 1–3).
// The current bar fills over a few seconds (same timed fill as Updates).
// Finished bars stay full. The last card holds full. Reduce Motion jumps
// to a static fill and does not auto-advance.
// ============================================
import React from 'react';
import { AnalyticsRegion, SegmentedProgress } from '@bridger/ui';
import { REVEAL } from '@bridger/shared';

/** How long one story card takes to fill. Tap still skips ahead early. */
const CARD_MS = 5500;

type Props = {
  /** Always 3 for the reveal story screens */
  segments?: number;
  /** 0-based index among Screens 1–3; 3 means the close card (all full). */
  active: number;
  /** When the current bar finishes filling (not on the held last card). */
  onComplete?: () => void;
};

export function RevealProgressBars({ segments = 3, active, onComplete }: Props) {
  return (
    <AnalyticsRegion analyticsId={REVEAL.flow.progress} interactive={false}>
      <SegmentedProgress
        count={segments}
        index={active}
        durationMs={CARD_MS}
        onComplete={active < segments ? onComplete : undefined}
      />
    </AnalyticsRegion>
  );
}

/** Same beat length the progress bars use (export for the close-card auto-open). */
export const REVEAL_CARD_MS = CARD_MS;

// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny hook so tab screens and the floating nav re-draw when "something new"
// dots change (you opened a tab, or an alert was marked read).
// ============================================
import { useEffect, useState } from 'react';
import type { TabKey } from '@bridger/ui';
import {
  getSectionDots,
  getTabBadges,
  subscribeTabAttention,
  type AttentionSection
} from '../data/tab-badges';

/** Subscribe to tab / section attention so dots update without a full remount. */
export function useTabAttention(tab?: TabKey): {
  badges: Partial<Record<TabKey, boolean>>;
  sectionDots: Partial<Record<AttentionSection, boolean>>;
} {
  const [, setTick] = useState(0);

  useEffect(() => subscribeTabAttention(() => setTick((n) => n + 1)), []);

  return {
    badges: getTabBadges(),
    sectionDots: tab ? getSectionDots(tab) : {}
  };
}

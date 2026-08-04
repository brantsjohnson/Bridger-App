// ============================================
// WHAT THIS FILE DOES (plain English):
// The three thin bars at the top of the Connection Reveal story (Screens 1–3).
// The current step is half-filled; finished ones are full; upcoming stay empty.
// Purely decorative — not a button. Respects reduce-motion (no half-fill fade).
// ============================================
import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, View } from 'react-native';
import { AnalyticsRegion, cn } from '@bridger/ui';
import { REVEAL } from '@bridger/shared';

type Props = {
  /** Always 3 for the reveal story screens */
  segments?: number;
  /** 0-based index among Screens 1–3 */
  active: number;
};

export function RevealProgressBars({ segments = 3, active }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => sub?.remove?.();
  }, []);

  return (
    <AnalyticsRegion analyticsId={REVEAL.flow.progress} interactive={false}>
      <View
        accessible={false}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="flex-row gap-1.5"
      >
        {Array.from({ length: segments }).map((_, i) => {
          const filled = i < active;
          const current = i === active;
          // ACCESSIBILITY: reduce-motion skips the half-fill "in progress" look
          const width = filled ? 'w-full' : current ? (reduceMotion ? 'w-full' : 'w-1/2') : 'w-0';
          return (
            <View
              key={i}
              className="h-1 flex-1 overflow-hidden rounded-full bg-white/35"
            >
              <View className={cn('h-full rounded-full bg-white', width)} />
            </View>
          );
        })}
      </View>
    </AnalyticsRegion>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The "charging up" bar that sits where the splash-screen CTA will be, on the
// Events and Discover intro pages. It fills over 15 total seconds of looking
// at the page; when full, the real button (Explore Events / Get started)
// appears in its place. Tapping the bar early does nothing (it is a
// dead-click region, so we still learn people tried).
// TODO: replace with Magic Patterns component <GateChargeBar> once designed.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion } from '@bridger/ui';

export function GateCtaProgress({
  progress,
  analyticsId,
  label = 'Take a look around'
}: {
  /** 0 → 1 how full the bar is. */
  progress: number;
  /** Dead-click id so taps on the not-ready bar are measured. */
  analyticsId: string;
  /** Small line above the bar telling people what is happening. */
  label?: string;
}) {
  const pct = Math.round(Math.min(Math.max(progress, 0), 1) * 100);

  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel={`${label}. ${pct} percent ready.`}
    >
      {/* ACCESSIBILITY: read as a progress bar by VoiceOver / TalkBack. */}
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: 100, now: pct }}
      >
        <Text className="mb-2 text-center font-sans-sb text-[12px] text-white/70">
          {label}
        </Text>
        {/* THE TRACK: same footprint as the big CTA so nothing jumps when it swaps in. */}
        <View
          className="w-full overflow-hidden rounded-full border border-white/30 bg-white/10"
          style={{ height: 52 }}
        >
          {/* THE FILL: grows left to right as the 15 seconds are used up. */}
          <View
            className="h-full rounded-full bg-white/35"
            style={{ width: `${Math.max(pct, 4)}%` }}
          />
        </View>
      </View>
    </AnalyticsRegion>
  );
}

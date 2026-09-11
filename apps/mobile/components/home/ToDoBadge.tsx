// ============================================
// WHAT THIS FILE DOES (plain English):
// The little "To do" pill from Discover Connect Over, reused on Home so people
// know where to start (post a collage, take a quiz, explore Events).
// ACCESSIBILITY: spoken as "to do"; color is not the only cue (text label).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion, Wiggle } from '@bridger/ui';

export function ToDoBadge({
  analyticsId,
  done = false,
  wiggle = true
}: {
  analyticsId: string;
  done?: boolean;
  /** Unfinished badges get a soft wiggle like Discover. */
  wiggle?: boolean;
}) {
  const label = done ? 'Done' : 'To do';
  const pill = (
    <View
      className="rounded-full border border-ink bg-white px-2 py-0.5"
      style={done ? { opacity: 0.7 } : undefined}
    >
      <Text className="font-sans-b text-[10px] uppercase tracking-wide text-ink">
        {label}
      </Text>
    </View>
  );

  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel={label}
    >
      <Wiggle active={!done && wiggle}>{pill}</Wiggle>
    </AnalyticsRegion>
  );
}

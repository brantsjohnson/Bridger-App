// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny "Example" pill badge for Home placeholder cards (Event Example,
// Notification Example). Not tappable on its own; the whole card is the
// button. Tagged interactive:false so a stray tap on the badge logs dead_click.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion } from '@bridger/ui';

export function ExampleBadge({ analyticsId }: { analyticsId: string }) {
  return (
    <AnalyticsRegion
      analyticsId={analyticsId}
      interactive={false}
      accessibilityLabel="Example"
    >
      <View className="self-start rounded-full border border-ink-line bg-canvas px-2 py-0.5">
        <Text className="font-sans-b text-[10px] uppercase tracking-wide text-ink-mute">
          Example
        </Text>
      </View>
    </AnalyticsRegion>
  );
}

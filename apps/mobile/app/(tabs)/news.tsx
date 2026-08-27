// ============================================
// WHAT THIS FILE DOES (plain English):
// The News tab — the newest destination on the bottom pill (Lucide Newspaper).
// For now it's a friendly placeholder: tapping News shows "Gen Z & Local
// updates coming soon." It still gets a real page title, the header profile
// photo (left) and messages shortcut (right), and analytics like every other
// tab, so nothing is un-instrumented while we flesh it out.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { AnalyticsRegion, Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import { NEWS, openSurface } from '@bridger/shared';

export default function NewsScreen() {
  // Mark News as the active analytics surface when this tab opens.
  useEffect(() => {
    openSurface('news');
  }, []);

  return (
    <Screen tone="canvas">
      <ScreenHeader title="News" analyticsSurface="news" />
      <ScreenBody>
        {/* Coming-soon body — non-interactive, so a tap here logs a dead_click. */}
        <AnalyticsRegion
          analyticsId={NEWS.feed.empty_body}
          interactive={false}
          accessibilityRole="text"
          accessibilityLabel="Gen Z and Local updates coming soon"
        >
          <View className="mt-10 items-center gap-2 px-6">
            <Text className="text-[40px]" accessibilityElementsHidden>
              🗞️
            </Text>
            <Text className="text-center font-sans-b text-[16px] text-ink">
              Gen Z & Local updates coming soon
            </Text>
          </View>
        </AnalyticsRegion>
      </ScreenBody>
    </Screen>
  );
}

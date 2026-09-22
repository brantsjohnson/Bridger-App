// ============================================
// WHAT THIS FILE DOES (plain English):
// Settings → Personalize. A preview of the place where someone will later
// shape how Bridger works for them (matchers, social features, and which of
// their own data Bridger may use). Nothing installs yet. The screen collects
// no information. Spec: guide-docs/PERSONAL-DATA.md.
// ============================================
import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { openSurface, PERSONALIZE } from '@bridger/shared';
import { AnalyticsRegion, Screen, ScreenBody, ScreenHeader, funShape } from '@bridger/ui';

const LANES = [
  {
    id: 'matchers',
    title: 'Matchers',
    line: 'Find your people differently.',
    accent: 'bg-purple',
    analyticsId: PERSONALIZE.preview.matchers
  },
  {
    id: 'social',
    title: 'Social features',
    line: 'Add new ways to spend time together.',
    accent: 'bg-teal',
    analyticsId: PERSONALIZE.preview.social
  },
  {
    id: 'data',
    title: 'Data and connections',
    line: 'Choose what information Bridger can use for you.',
    accent: 'bg-coral',
    analyticsId: PERSONALIZE.preview.data
  }
] as const;

export default function PersonalizeScreen() {
  const router = useRouter();

  useEffect(() => {
    openSurface('personalize', 'profile');
  }, []);

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Personalize"
        onBack={() => router.back()}
        hideProfile
        analyticsSurface="personalize"
        backAnalyticsId={PERSONALIZE.top_nav.back}
        titleAnalyticsId={PERSONALIZE.top_nav.page_title}
      />
      <ScreenBody tabBarInset={false}>
        {/* THIS SECTION DOES: the one promise. Coming soon, and what it will be. */}
        <AnalyticsRegion analyticsId={PERSONALIZE.intro.body} interactive={false}>
          <View className="mb-3 self-start rounded-full bg-ink px-3 py-1.5">
            <Text className="font-sans-b text-[13px] text-canvas">Coming soon</Text>
          </View>
          <Text className="font-sans text-[18px] leading-snug text-ink">
            Make Bridger work more like you do.
          </Text>
          <Text className="mt-2 font-sans text-[16px] leading-relaxed text-ink-soft">
            Soon you will be able to add new ways to connect, customize matching,
            and change how Bridger works for you.
          </Text>
        </AnalyticsRegion>

        {/* THIS SECTION DOES: three previews. They do not open anything yet. */}
        <View className="mt-6 gap-3">
          {LANES.map((lane) => (
            <AnalyticsRegion
              key={lane.id}
              analyticsId={lane.analyticsId}
              interactive={false}
              accessibilityLabel={`${lane.title}. ${lane.line}`}
            >
              <View
                className="flex-row items-stretch overflow-hidden bg-surface"
                style={funShape(lane.id)}
              >
                <View className={`w-2 ${lane.accent}`} />
                <View className="min-w-0 flex-1 px-4 py-4">
                  <Text className="font-pixel text-[20px] text-ink">{lane.title}</Text>
                  <Text className="mt-1 font-sans text-[16px] leading-snug text-ink-soft">
                    {lane.line}
                  </Text>
                </View>
              </View>
            </AnalyticsRegion>
          ))}
        </View>
      </ScreenBody>
    </Screen>
  );
}

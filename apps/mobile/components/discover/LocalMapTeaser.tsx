// ============================================
// WHAT THIS FILE DOES (plain English):
// A "Local map · Coming soon" teaser under People to meet on Discover.
// It shows the pixel friend-radar art so people can picture the future
// feature: see friends nearby when they opt in. Nothing here is live yet.
// Taps are dead_clicks so we learn if people expect it to open.
// ============================================
import React from 'react';
import { Image, Text, View } from 'react-native';
import { DISCOVER } from '@bridger/shared';
import {
  AnalyticsRegion,
  Badge,
  SectionTitle,
  funShape
} from '@bridger/ui';

/** Pixel friend-radar preview art (Coming soon). */
const FRIEND_MAP_SOON = require('../../assets/images/friend-map-coming-soon.jpg');

export function LocalMapTeaser() {
  // THIS SECTION DOES: title + Coming soon chip, then the map art card.
  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <SectionTitle
            title="Local map"
            description="A map of friends who choose to share that they're nearby. Opt-in only, coarse (city vibe, not a street pin), and never strangers. Friend radar for your city, not a dating map."
            infoAnalyticsId={DISCOVER.local_map.info}
            parentScreen="discover"
            section="local_map"
          />
        </View>
        <Badge tone="nearby">Coming soon</Badge>
      </View>

      <AnalyticsRegion
        analyticsId={DISCOVER.local_map.teaser_card}
        interactive={false}
        accessibilityLabel="Local map coming soon. See friends nearby when they opt in."
      >
        <View
          style={funShape('local-map-teaser')}
          className="overflow-hidden border border-ink-line bg-surface"
        >
          {/* THIS SECTION DOES: the pixel map art in a short banner (same ~168px
              height as the old fake map), so a wide window does not blow it up. */}
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="h-[168px] w-full overflow-hidden"
          >
            <Image
              source={FRIEND_MAP_SOON}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View className="border-t border-ink-line px-4 py-3">
            <Text className="font-sans-b text-[15px] tracking-tight text-ink">
              Friend radar for your city
            </Text>
            <Text className="mt-0.5 font-sans-sb text-[13px] leading-snug text-ink-soft">
              See friends nearby when they choose to share. When a close friend
              visits your city, Bridger will ask them if they want to let you
              know so you can say hey or plan a Touch Grass.
            </Text>
          </View>
        </View>
      </AnalyticsRegion>
    </View>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// A "Community · Coming soon" teaser at the bottom of Events. Same layout as
// Discover's Local map teaser: section title + Coming soon chip, then a card
// with the pixel street art on top and a short promise underneath. Nothing
// here is live yet. Taps are dead_clicks so we learn if people expect it to open.
// ============================================
import React from 'react';
import { Image, Text, View } from 'react-native';
import { EVENTS } from '@bridger/shared';
import {
  AnalyticsRegion,
  Badge,
  SectionTitle,
  funShape
} from '@bridger/ui';

/** Pixel main-street preview art (Coming soon). */
const COMMUNITY_SOON = require('../../assets/images/community-coming-soon.jpg');

export function CommunityTeaser() {
  // THIS SECTION DOES: title + Coming soon chip, then the street art card.
  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center gap-2">
        <View className="min-w-0 flex-1">
          <SectionTitle
            title="Community"
            description="Public events around you. A future home for open hangouts in your city, not the private ones on your calendar."
            infoAnalyticsId={EVENTS.community.info}
            parentScreen="events"
            section="community"
          />
        </View>
        <Badge tone="nearby">Coming soon</Badge>
      </View>

      <AnalyticsRegion
        analyticsId={EVENTS.community.teaser_card}
        interactive={false}
        accessibilityLabel="Community coming soon. Public events around you."
      >
        <View
          style={funShape('community-teaser')}
          className="overflow-hidden border border-ink-line bg-surface"
        >
          {/* THIS SECTION DOES: the pixel street art in a short banner (same
              ~168px height as Local map), so a wide window does not blow it up. */}
          <View
            accessible={false}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="h-[168px] w-full overflow-hidden"
          >
            <Image
              source={COMMUNITY_SOON}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View className="border-t border-ink-line px-4 py-3">
            <Text className="font-sans-b text-[15px] tracking-tight text-ink">
              Public events around you
            </Text>
            <Text className="mt-0.5 font-sans-sb text-[13px] leading-snug text-ink-soft">
              Find local things for you and your friends to do
            </Text>
          </View>
        </View>
      </AnalyticsRegion>
    </View>
  );
}

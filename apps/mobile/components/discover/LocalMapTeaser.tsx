// ============================================
// WHAT THIS FILE DOES (plain English):
// A "Local map · Coming soon" teaser under People to meet on Discover.
// It looks like a tiny friend radar (dots on a soft map), so people can
// picture the future feature: see friends nearby when they opt in.
// Nothing here is live yet. Taps are dead_clicks so we learn if people
// expect it to open.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { DISCOVER } from '@bridger/shared';
import {
  AnalyticsRegion,
  Badge,
  SectionTitle,
  funShape
} from '@bridger/ui';

// Fake friend pins on the preview map. Positions are % so the card scales.
const PINS: Array<{
  id: string;
  label: string;
  left: `${number}%`;
  top: `${number}%`;
  color: string;
  you?: boolean;
}> = [
  { id: 'you', label: 'You', left: '46%', top: '42%', color: '#F5C518', you: true },
  { id: 'a', label: 'K', left: '22%', top: '28%', color: '#7C6CFF' },
  { id: 'b', label: 'J', left: '68%', top: '24%', color: '#00A676' },
  { id: 'c', label: 'N', left: '74%', top: '58%', color: '#FF6B4A' },
  { id: 'd', label: 'M', left: '18%', top: '62%', color: '#3B82F6' }
];

export function LocalMapTeaser() {
  // THIS SECTION DOES: title + info bubble, then the map preview card.
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
          {/* THIS SECTION DOES: soft map stage with street grid + friend dots. */}
          <View className="relative h-[168px] overflow-hidden bg-[#E8F0FF]">
            {[18, 42, 66, 90, 114, 138].map((y) => (
              <View
                key={`h-${y}`}
                accessible={false}
                className="absolute left-0 right-0 h-px bg-ink/15"
                style={{ top: y }}
              />
            ))}
            {[28, 72, 116, 160, 204, 248, 292].map((x) => (
              <View
                key={`v-${x}`}
                accessible={false}
                className="absolute top-0 bottom-0 w-px bg-ink/12"
                style={{ left: x }}
              />
            ))}

            {/* Soft park / block blobs so it reads as a map, not a spreadsheet. */}
            <View
              accessible={false}
              className="absolute left-6 top-5 h-12 w-16 rounded-2xl bg-[#B8E0C8]/70"
            />
            <View
              accessible={false}
              className="absolute bottom-6 right-8 h-10 w-20 rounded-2xl bg-[#C9D4FF]/80"
            />

            {PINS.map((pin) => (
              <View
                key={pin.id}
                accessible={false}
                className="absolute items-center"
                style={{ left: pin.left, top: pin.top }}
              >
                <View
                  className={
                    pin.you
                      ? 'h-11 w-11 items-center justify-center rounded-full border-2 border-white'
                      : 'h-8 w-8 items-center justify-center rounded-full border-2 border-white'
                  }
                  style={{ backgroundColor: pin.color }}
                >
                  <Text
                    className={
                      pin.you
                        ? 'font-sans-b text-[11px] text-white'
                        : 'font-sans-b text-[12px] text-white'
                    }
                  >
                    {pin.you ? '★' : pin.label}
                  </Text>
                </View>
                {pin.you ? (
                  <Text className="mt-0.5 font-sans-b text-[10px] text-ink">You</Text>
                ) : null}
              </View>
            ))}

            {/* Frost so it clearly reads as preview, not a live map. */}
            <View accessible={false} className="absolute inset-0 bg-white/25" />
          </View>

          <View className="border-t border-ink-line px-4 py-3">
            <Text className="font-sans-b text-[15px] tracking-tight text-ink">
              Friend radar for your city
            </Text>
            <Text className="mt-0.5 font-sans-sb text-[13px] leading-snug text-ink-soft">
              See friends nearby when they choose to share. Coming soon.
            </Text>
          </View>
        </View>
      </AnalyticsRegion>
    </View>
  );
}

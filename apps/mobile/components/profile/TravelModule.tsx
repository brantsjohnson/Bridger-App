// ============================================
// WHAT THIS FILE DOES (plain English):
// "Places traveled" on the profile card. Two pages in one contained module,
// the same idiom as the hobbies widget: page 1 is a real stylized world map
// with country fills + coral pins (tap a pin to read the place and note),
// page 2 is a scrollable list of every place. Swipe or tap the dots to switch.
// Analytics: page changes record method swipe|dropdown + page_index on the
// places_map id (own card or friend about_them, passed in).
// ============================================
import React, { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { PROFILE, trackUi } from '@bridger/shared';
import { cn } from '@bridger/ui';
import type { TravelPlace } from '../../data/profile';
import { WorldMapSvg } from './WorldMapSvg';

const PAGES = ['Map', 'List'];

export function TravelModule({
  places,
  analyticsId = PROFILE.card.places_map
}: {
  places: TravelPlace[];
  /** PROFILE.card.places_map or PROFILE.about_them.places_map */
  analyticsId?: string;
}) {
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const place = places.find((p) => p.id === active);

  const taggedCountryCodes = useMemo(
    () => [
      ...new Set(
        places
          .map((p) => p.countryCode?.toUpperCase())
          .filter((code): code is string => !!code && code.length === 2)
      )
    ],
    [places]
  );

  /** Record a page change — dots = dropdown, swipe = swipe. */
  const recordPage = (i: number, method: 'swipe' | 'dropdown') => {
    if (analyticsId) {
      trackUi('page_viewed', analyticsId, { method, page_index: i });
    }
  };

  const goTo = (i: number) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
    recordPage(i, 'dropdown');
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          if (width > 0) {
            const next = Math.round(e.nativeEvent.contentOffset.x / width);
            if (next !== page) {
              setPage(next);
              recordPage(next, 'swipe');
            }
          }
        }}
      >
        {/* Page 1: real world map with country fills + pins */}
        <View style={{ width: width || undefined }}>
          <WorldMapSvg
            taggedCountryCodes={taggedCountryCodes}
            places={places}
            activeId={active}
            onPinPress={(id) => setActive((v) => (v === id ? null : id))}
            pinAnalyticsId={PROFILE.card.places_pin}
          />

          <View className="mt-2.5 min-h-[34px]">
            {place ? (
              <Text className="font-sans-sb text-[13px] text-ink">
                <Text className="font-sans-b">{place.label}</Text> · {place.note}
              </Text>
            ) : (
              <Text className="font-sans-md text-[12px] text-ink-mute">
                {places.length} places · tap a pin
              </Text>
            )}
          </View>
        </View>

        {/* Page 2: the full list, scrolls inside the widget */}
        <View style={{ width: width || undefined }}>
          <ScrollView style={{ maxHeight: 204 }} nestedScrollEnabled>
            <View className="gap-2">
              {places.map((p) => (
                <View
                  key={p.id}
                  className="flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
                >
                  <View
                    accessible={false}
                    className="h-9 w-9 shrink-0 items-center justify-center rounded-full bg-coral/25"
                  >
                    <Text className="text-[16px]">{p.emoji}</Text>
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text numberOfLines={1} className="font-sans-b text-[13px] text-ink">
                      {p.label}
                    </Text>
                    <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                      {p.note}
                    </Text>
                  </View>
                  {p.year ? (
                    <Text className="shrink-0 font-sans-b text-[11px] text-ink-mute">{p.year}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      <View className="mt-3 flex-row items-center justify-center gap-1.5">
        {PAGES.map((label, i) => (
          <Pressable
            key={label}
            onPress={() => goTo(i)}
            accessibilityRole="button"
            accessibilityLabel={`Show ${label}`}
            accessibilityState={{ selected: page === i }}
            hitSlop={10}
            className={cn(
              'h-1.5 rounded-full',
              page === i ? 'w-5 bg-ink' : 'w-1.5 bg-ink/20'
            )}
          />
        ))}
      </View>
    </View>
  );
}

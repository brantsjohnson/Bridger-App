// ============================================
// WHAT THIS FILE DOES (plain English):
// "Places traveled" on the profile card. Two pages in one contained module,
// the same idiom as the hobbies widget: page 1 is a clean map panel with
// tappable pins (tap a pin to read the place and note), page 2 is a scrollable
// list of every place. Swipe or tap the dots to switch.
// ============================================
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import Svg, { Line, Path } from 'react-native-svg';
import { cn, useThemeColors } from '@bridger/ui';
import type { TravelPlace } from '../../data/profile';

const PAGES = ['Map', 'List'];
const MAP_HEIGHT = 168;

export function TravelModule({ places }: { places: TravelPlace[] }) {
  const c = useThemeColors();
  const [page, setPage] = useState(0);
  const [active, setActive] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);
  const place = places.find((p) => p.id === active);

  const goTo = (i: number) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      >
        {/* Page 1: the map with pins */}
        <View style={{ width: width || undefined }}>
          <View className="relative overflow-hidden rounded-card border border-ink-line bg-surface">
            <Svg
              viewBox="0 0 100 60"
              width="100%"
              height={MAP_HEIGHT}
              accessibilityLabel="Places traveled map"
            >
              {/* faint grid so the panel reads as a map, not a blank card */}
              {Array.from({ length: 11 }).map((_, i) => (
                <Line
                  key={`v${i}`}
                  x1={i * 10}
                  y1={0}
                  x2={i * 10}
                  y2={60}
                  stroke={c.ink}
                  strokeOpacity={0.07}
                  strokeWidth={0.3}
                />
              ))}
              {Array.from({ length: 7 }).map((_, i) => (
                <Line
                  key={`h${i}`}
                  x1={0}
                  y1={i * 10}
                  x2={100}
                  y2={i * 10}
                  stroke={c.ink}
                  strokeOpacity={0.07}
                  strokeWidth={0.3}
                />
              ))}
              {/* an abstract landmass — decorative, not a real projection */}
              <Path
                d="M6 26 L18 16 L30 22 L40 14 L52 20 L58 12 L70 18 L82 14 L94 24 L88 40 L74 46 L60 40 L48 48 L34 44 L20 48 L10 40 Z"
                fill={c.ink}
                fillOpacity={0.06}
                stroke={c.ink}
                strokeOpacity={0.35}
                strokeWidth={0.5}
              />
            </Svg>

            {/* pins sit over the map at their rough spots */}
            {places.map((p) => (
              <Pressable
                key={p.id}
                onPress={() => setActive((v) => (v === p.id ? null : p.id))}
                accessibilityRole="button"
                accessibilityLabel={p.label}
                accessibilityState={{ selected: active === p.id }}
                hitSlop={10}
                style={{
                  position: 'absolute',
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  marginLeft: -6,
                  marginTop: -12,
                  transform: [{ scale: active === p.id ? 1.2 : 1 }]
                }}
              >
                <View className="h-3 w-3 rounded-full border-2 border-ink bg-coral" />
              </Pressable>
            ))}
          </View>

          {/* the caption under the map: the tapped place, or a nudge to tap */}
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

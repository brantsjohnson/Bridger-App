// ============================================
// WHAT THIS FILE DOES (plain English):
// The hobbies widget on the profile card. Two pages in one contained box:
// page 1 is colorful blob-shaped chips (tap one to peek at its follow-up
// answer), page 2 is every hobby with its full answer, scrolling inside the
// widget so the profile never balloons. Swipe or tap the dots to switch.
// ============================================
import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import { ACCENTS, BLOB_SHAPES, cn } from '@bridger/ui';
import type { Interest } from '../../data/profile';
import { HOBBY_FOLLOW_UPS } from '../../data/profile';

const PAGES = ['Hobbies', 'Answers'];

export function HobbiesWidget({ hobbies }: { hobbies: Interest[] }) {
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [width, setWidth] = useState(0);
  const scroller = useRef<ScrollView>(null);

  const goTo = (i: number) => {
    setPage(i);
    scroller.current?.scrollTo({ x: i * width, animated: true });
  };

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {/* the two pages, swipeable — replaces the web drag gesture */}
      <ScrollView
        ref={scroller}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          if (width > 0) setPage(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
      >
        {/* Page 1: the chip wall */}
        <View style={{ width: width || undefined }}>
          <View className="flex-row flex-wrap justify-between">
            {hobbies.map((h, i) => {
              const token = ACCENTS[h.accent];
              const shape = BLOB_SHAPES[(h.shape ?? i) % BLOB_SHAPES.length];
              const showing = open === h.id;
              const follow = HOBBY_FOLLOW_UPS[h.id];
              return (
                <View key={h.id} className={cn('mb-2.5', showing ? 'w-full' : 'w-[48.5%]')}>
                  <Pressable
                    onPress={() => setOpen(showing ? null : h.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded: showing }}
                    accessibilityLabel={h.label}
                    style={shape}
                    className={cn(
                      'min-h-[52px] w-full flex-row items-center gap-2 px-2.5 py-2',
                      token.bg
                    )}
                  >
                    <View
                      accessible={false}
                      className="h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface/70"
                    >
                      <Text className="text-[15px]">{h.emoji}</Text>
                    </View>
                    <Text
                      className={cn(
                        'min-w-0 flex-1 font-sans-b text-[12px] leading-[1.15]',
                        token.text
                      )}
                    >
                      {h.label}
                    </Text>
                    {follow ? (
                      <ChevronDownIcon
                        size={16}
                        color="#00000080"
                        strokeWidth={2.8}
                        style={{ transform: [{ rotate: showing ? '180deg' : '0deg' }] }}
                      />
                    ) : null}
                  </Pressable>

                  {showing && follow ? (
                    <Text className="px-3 pt-2 font-sans-sb text-[13px] text-ink-soft">
                      <Text className="text-ink-mute">{follow.question}</Text> {follow.answer}
                    </Text>
                  ) : null}
                </View>
              );
            })}
          </View>
        </View>

        {/* Page 2: every hobby with its answer, scrolls inside the widget */}
        <View style={{ width: width || undefined }}>
          <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled>
            <View className="gap-2">
              {hobbies.map((h) => {
                const follow = HOBBY_FOLLOW_UPS[h.id];
                if (!follow) return null;
                return (
                  <View
                    key={h.id}
                    className="flex-row gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
                  >
                    <View
                      accessible={false}
                      className={cn(
                        'h-9 w-9 shrink-0 items-center justify-center rounded-full',
                        ACCENTS[h.accent].bg
                      )}
                    >
                      <Text className="text-[16px]">{h.emoji}</Text>
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="font-sans-b text-[13px] text-ink">{h.label}</Text>
                      <Text className="font-sans-sb text-[11px] text-ink-mute">
                        {follow.question}
                      </Text>
                      <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft">
                        {follow.answer}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* page dots — also tappable for people who don't swipe */}
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

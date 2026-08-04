// ============================================
// WHAT THIS FILE DOES (plain English):
// The swipeable strip at the top of Home for anything that wants attention
// today (touched grass, quick check, co-op note). Page dots follow the swipe.
// When the list is empty, this whole section disappears — heading and all.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from 'react-native';
import { ChevronRightIcon, MegaphoneIcon, XIcon } from 'lucide-react-native';
import { ButtonSecondary, ORGANIC, PixelHeading, cn, useThemeColors } from '@bridger/ui';
import type { CoopAnnouncement } from '../../data/feed';

export type Announcement = {
  id: string;
  kind: 'grass' | 'quickCheck' | 'coop';
  content: React.ReactNode;
};

export function AnnouncementsCarousel({ items }: { items: Announcement[] }) {
  const { width } = useWindowDimensions();
  const pageWidth = width - 40; // ScreenBody horizontal padding (20 each side)
  const [index, setIndex] = useState(0);
  const trackRef = useRef<ScrollView>(null);
  const c = useThemeColors();

  useEffect(() => {
    if (index > items.length - 1) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  if (items.length === 0) return null;

  function goTo(i: number) {
    setIndex(i);
    trackRef.current?.scrollTo({ x: i * pageWidth, animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) setIndex(next);
  }

  return (
    <View accessibilityLabel="Announcements" className="mb-5">
      <View className="mb-2 flex-row items-center justify-between gap-3">
        <View className="flex-row items-center gap-2">
          <MegaphoneIcon size={16} color={c.inkMute} strokeWidth={2.5} />
          <PixelHeading size="md">Announcements</PixelHeading>
        </View>

        {items.length > 1 ? (
          <View className="flex-row items-center gap-1.5">
            {items.map((item, i) => (
              <Pressable
                key={item.id}
                onPress={() => goTo(i)}
                accessibilityRole="button"
                accessibilityLabel={`Announcement ${i + 1} of ${items.length}`}
                accessibilityState={{ selected: i === index }}
                className={cn('h-2 rounded-full', i === index ? 'w-5 bg-ink' : 'w-2 bg-ink-line')}
              />
            ))}
          </View>
        ) : null}
      </View>

      <ScrollView
        ref={trackRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        className="-mx-5"
        contentContainerStyle={{ paddingHorizontal: 20 }}
      >
        {items.map((item) => (
          <View key={item.id} style={{ width: pageWidth, paddingRight: 12 }} className="min-h-[124px]">
            {item.content}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/** A note from the co-op — a call, a vote closing, books published. */
export function CoopAnnouncementCard({
  announcement,
  onOpen,
  onDismiss
}: {
  announcement: CoopAnnouncement;
  onOpen?: () => void;
  onDismiss?: () => void;
}) {
  const c = useThemeColors();
  return (
    <View style={ORGANIC.soft} className="relative min-h-[124px] bg-[#D7F0E8] px-4 py-3.5">
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-surface"
        >
          <XIcon size={16} color={c.inkMute} strokeWidth={2.6} />
        </Pressable>
      ) : null}

      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">From the co-op</Text>
      <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-ink">
        {announcement.title}
      </Text>
      <Text className="mt-1 pr-4 font-sans-sb text-[13px] leading-snug text-ink-soft">
        {announcement.body}
      </Text>

      <View className="mt-3">
        <ButtonSecondary
          size="sm"
          onPress={onOpen}
          icon={<ChevronRightIcon size={16} color={c.ink} strokeWidth={2.5} />}
        >
          {announcement.action}
        </ButtonSecondary>
      </View>
    </View>
  );
}

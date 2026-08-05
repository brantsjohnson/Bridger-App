// ============================================
// WHAT THIS FILE DOES (plain English):
// The swipeable strip at the top of Home for anything that wants attention
// today (touched grass, quick check, co-op note). Page dots follow the swipe.
// When the list is empty, this whole section disappears — heading and all.
// Cards stay inside the same page padding as Stories and the widgets below
// (no full-bleed negative margin that drifts out of line on web).
// Analytics: title opens section_info_tooltip; swipes report carousel depth.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { ChevronRightIcon, XIcon } from 'lucide-react-native';
import { HOME, trackUi } from '@bridger/shared';
import {
  ButtonSecondary,
  ORGANIC,
  SectionTitle,
  cn,
  useReduceMotion,
  useThemeColors
} from '@bridger/ui';
import type { CoopAnnouncement } from '../../data/feed';

export type Announcement = {
  id: string;
  kind: 'grass' | 'quickCheck' | 'coop';
  content: React.ReactNode;
};

export function AnnouncementsCarousel({ items }: { items: Announcement[] }) {
  // Measure the real content width so pages match ScreenBody, not the window.
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  /** Set once the person swipes or taps a dot — from then on it stops rotating. */
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReduceMotion();
  /** Deepest page index the user has reached by swipe (for carousel_depth). */
  const maxDepth = useRef(0);
  const trackRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (index > items.length - 1) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  /*
    --- THE LOOP: it plays itself through, then starts over ---
    Announcements begin on the first card and move to the next every few seconds,
    wrapping back to the first after the last, so you see all of them without
    swiping. The moment you touch it, the auto-advance stops for good and the
    carousel is yours — nothing yanks the card out from under your thumb.
    ACCESSIBILITY: it also never auto-advances when Reduce Motion is on, since
    self-moving content is exactly what that setting asks us not to do.
  */
  useEffect(() => {
    if (paused || reduceMotion || items.length < 2 || pageWidth <= 0) return;
    const timer = setInterval(() => {
      setIndex((current) => {
        const next = (current + 1) % items.length;
        trackRef.current?.scrollTo({ x: next * pageWidth, animated: true });
        return next;
      });
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, reduceMotion, items.length, pageWidth]);

  if (items.length === 0) return null;

  function goTo(i: number) {
    if (pageWidth <= 0) return;
    setPaused(true);
    setIndex(i);
    trackRef.current?.scrollTo({ x: i * pageWidth, animated: true });
  }

  function onScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    if (pageWidth === 0) return;
    const next = Math.round(e.nativeEvent.contentOffset.x / pageWidth);
    if (next !== index) {
      setIndex(next);
      // Analytics: swipe between announcement cards (no content logged).
      if (next > maxDepth.current) maxDepth.current = next;
      trackUi('swipe', HOME.announcements.carousel, {
        method: 'swipe',
        page_index: next,
        carousel_depth: maxDepth.current
      });
    }
  }

  return (
    <View
      accessibilityLabel="Announcements"
      className="mb-5"
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== pageWidth) setPageWidth(w);
      }}
    >
      <View className="mb-2 flex-row items-center justify-between gap-3">
        {/* Announcements title: dashed underline + short "what is this?" bubble */}
        <SectionTitle
          title="Announcements"
          description="Important notes and heads-ups for your group. Swipe through to catch anything you missed."
          infoAnalyticsId={HOME.announcements.info}
          parentScreen="home"
          section="announcements"
          className="min-w-0 flex-1"
        />

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

      {/* Same left edge as the heading / Stories — no bleed margin */}
      <ScrollView
        ref={trackRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        onScrollBeginDrag={() => setPaused(true)}
        scrollEventThrottle={16}
        decelerationRate="fast"
      >
        {items.map((item, i) => (
          <View
            key={item.id}
            style={{
              width: pageWidth || undefined,
              // peek gap between pages; last page stays flush with the right edge
              paddingRight: pageWidth && i < items.length - 1 ? 12 : 0
            }}
            className="min-h-[124px]"
          >
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
    // Bright teal card with always-dark type. `text-ink` is deliberately not used
    // here: it flips to white in dark mode and disappears on a colored fill.
    <View style={ORGANIC.soft} className="relative min-h-[124px] bg-teal px-4 py-3.5">
      {onDismiss ? (
        <Pressable
          onPress={onDismiss}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          className="absolute right-3 top-3 z-10 h-7 w-7 items-center justify-center rounded-full active:bg-white/25"
        >
          <XIcon size={16} color="#1C1B16" strokeWidth={2.6} />
        </Pressable>
      ) : null}

      <Text className="font-sans-b text-[11px] uppercase tracking-wide text-onaccent/75">
        From the co-op
      </Text>
      <Text className="mt-1 pr-8 font-sans-b text-[16px] leading-snug tracking-tight text-onaccent">
        {announcement.title}
      </Text>
      <Text className="mt-1 pr-4 font-sans-sb text-[13px] leading-snug text-onaccent/85">
        {announcement.body}
      </Text>

      <View className="mt-3">
        {/* Analytics: co-op announcement CTA. */}
        <ButtonSecondary
          size="sm"
          onPress={onOpen}
          analyticsId={HOME.announcements.coop_card}
          icon={<ChevronRightIcon size={16} color={c.ink} strokeWidth={2.5} />}
        >
          {announcement.action ?? announcement.ctaLabel ?? 'Open'}
        </ButtonSecondary>
      </View>
    </View>
  );
}

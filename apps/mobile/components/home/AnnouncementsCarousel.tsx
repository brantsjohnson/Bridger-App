// ============================================
// WHAT THIS FILE DOES (plain English):
// The swipeable strip at the top of Home for anything that wants attention
// today (touched grass, quick check, co-op note). Page dots follow the swipe.
// When the list is empty, this whole section disappears — heading and all.
// Cards stay inside the same page padding as Stories and the widgets below
// (no full-bleed negative margin that drifts out of line on web).
// Auto-advance: only when you leave a card alone. After you swipe or tap a
// dot, we wait much longer so you can finish reading before it moves again.
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

/** How long a card stays up when nobody has touched the carousel. */
const AUTO_ADVANCE_MS = 12_000;
/**
 * After a swipe or dot tap, give a full read before moving on — co-op cards
 * have a title + body + button, and 5s was yanking people off mid-sentence.
 */
const AFTER_MANUAL_MS = 20_000;

export function AnnouncementsCarousel({ items }: { items: Announcement[] }) {
  // Measure the real content width so pages match ScreenBody, not the window.
  const [pageWidth, setPageWidth] = useState(0);
  const [index, setIndex] = useState(0);
  /**
   * Bumped on every user swipe / dot tap (and after each auto tick) so the
   * advance timer tears down and starts a fresh wait.
   */
  const [resumeKey, setResumeKey] = useState(0);
  const reduceMotion = useReduceMotion();
  /** Deepest page index the user has reached by swipe (for carousel_depth). */
  const maxDepth = useRef(0);
  const trackRef = useRef<ScrollView>(null);
  /** True while a finger is dragging — blocks a mid-swipe auto-advance tick. */
  const draggingRef = useRef(false);
  /** Next wait length — longer right after a manual swipe so you can read. */
  const nextDelayMs = useRef(AUTO_ADVANCE_MS);

  useEffect(() => {
    if (index > items.length - 1) setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  /*
    --- THE LOOP: plays through, then starts over ---
    Announcements begin on the first card and move on their own only after a
    long enough pause to read. If you swipe or tap a dot, we wait even longer
    so the card you picked is not yanked away mid-read.
    ACCESSIBILITY: never auto-advances when Reduce Motion is on.
  */
  useEffect(() => {
    if (reduceMotion || items.length < 2 || pageWidth <= 0) return;
    const delay = nextDelayMs.current;
    const timer = setTimeout(() => {
      // Don't fight the user's finger mid-drag — try again after a short beat.
      if (draggingRef.current) {
        setResumeKey((k) => k + 1);
        return;
      }
      setIndex((current) => {
        const next = (current + 1) % items.length;
        trackRef.current?.scrollTo({ x: next * pageWidth, animated: true });
        return next;
      });
      // After an auto move, go back to the normal (still generous) pace.
      nextDelayMs.current = AUTO_ADVANCE_MS;
      setResumeKey((k) => k + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [reduceMotion, items.length, pageWidth, resumeKey]);

  if (items.length === 0) return null;

  /** Restart the countdown; pass true after a swipe / dot so reading has time. */
  function resetAutoAdvance(manual: boolean) {
    nextDelayMs.current = manual ? AFTER_MANUAL_MS : AUTO_ADVANCE_MS;
    setResumeKey((k) => k + 1);
  }

  function goTo(i: number) {
    if (pageWidth <= 0) return;
    resetAutoAdvance(true);
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
        onScrollBeginDrag={() => {
          draggingRef.current = true;
          // Pause the countdown the moment a finger touches — don't advance under them.
          resetAutoAdvance(true);
        }}
        onMomentumScrollEnd={() => {
          draggingRef.current = false;
          // Full read window starts when the page you swiped to settles.
          resetAutoAdvance(true);
        }}
        onScrollEndDrag={() => {
          // If there's no momentum (short drag), still clear the dragging flag
          draggingRef.current = false;
        }}
        scrollEventThrottle={16}
        // "normal" snaps gentler than "fast" so a swipe doesn't feel yanked.
        decelerationRate="normal"
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

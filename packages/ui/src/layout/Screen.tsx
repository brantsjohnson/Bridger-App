// ============================================
// WHAT THIS FILE DOES (plain English):
// The scaffold every screen is built from, so all screens share the same shape:
//  - Screen: fills the display and paints the background (eggshell canvas by
//    default; onboarding/fill flows may go full color). Shares a tiny
//    "has the user scrolled?" memory with its header and body.
//  - ScreenHeader: floats over the top as one full-width row — pixel title on
//    the left, Edit (or other trailing) + profile photo on the right. Tucks
//    away when you scroll down, slides back when you scroll up (same idea as
//    Magic Patterns). Respects Reduce Motion.
//  - ScreenBody: the scrolling content area; reports scroll so the header
//    can hide/show, padded so the floating tab bar never covers the last item.
// ============================================
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { Avatar } from '../primitives/Avatar';
import { PixelHeading } from '../primitives/PixelHeading';
import { AnalyticsRegion, withAnalyticsPress } from '../lib/analytics';
import { useProfileLink } from './ProfileLink';
import { SynthGrid } from './SynthGrid';

type ScreenTone = 'canvas' | 'color' | 'synth' | 'plain';

/*
  --- TWEAK THESE if title spacing feels wrong on every tab ---

  HEADER_TOP_PAD     = air above "Events" / "Home" (bigger = more room at the top)
  HEADER_BOTTOM_PAD  = air under the title row itself
  GAP_BELOW_HEADER   = air between the title row and the first section
                       ("Touch grass", "Announcements", …)
                       (bigger = more room under the title)

  The scrolling body reserves:
    safe-area + TOP + 44 (title row) + BOTTOM + GAP
*/
const HEADER_TOP_PAD = 16;
const HEADER_BOTTOM_PAD = 8;
// Air between "Friends" / "Home" and the first section title. Keep this small —
// too much reads as a blank band under the page title.
const GAP_BELOW_HEADER = 10;
const HEADER_ROW = 44;

type ScreenContextValue = {
  /** true = header is tucked off the top */
  headerHidden: boolean;
  setHeaderHidden: (hidden: boolean) => void;
  hasHeader: boolean;
  registerHeader: () => void;
  /** body calls this on every scroll so the header can react */
  onBodyScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  headerPad: number;
};

const ScreenContext = React.createContext<ScreenContextValue>({
  headerHidden: false,
  setHeaderHidden: () => undefined,
  hasHeader: false,
  registerHeader: () => undefined,
  onBodyScroll: () => undefined,
  headerPad: 0
});

export function Screen({
  children,
  tone = 'canvas',
  accent,
  className
}: {
  children: React.ReactNode;
  /** eggshell by default; 'color' for onboarding/fill flows; 'synth' = Discover grid. */
  tone?: ScreenTone;
  /** a Tailwind bg class used when tone is 'color', e.g. "bg-purple/20". */
  accent?: string;
  className?: string;
}) {
  const insets = useSafeAreaInsets();
  const [headerHidden, setHeaderHidden] = useState(false);
  const [hasHeader, setHasHeader] = useState(false);
  const lastY = useRef(0);
  // How far we've scrolled in the CURRENT direction since the last flip. We
  // build this up across events so slow scrolling still tucks the header.
  const accum = useRef(0);
  const registerHeader = useCallback(() => setHasHeader(true), []);

  // See HEADER_* constants at the top of this file to tune spacing by hand.
  const headerPad =
    insets.top + HEADER_TOP_PAD + HEADER_ROW + HEADER_BOTTOM_PAD + GAP_BELOW_HEADER;

  // Direction-aware: scroll down → hide, scroll up (or near top) → show.
  // We measure TOTAL travel in one direction, not the jump between two frames,
  // so a slow drag adds up and crosses the threshold the same as a fast flick.
  const onBodyScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const dy = y - lastY.current;
    lastY.current = y;

    // Near the very top: always show the header and forget any built-up travel.
    if (y <= 12) {
      accum.current = 0;
      setHeaderHidden(false);
      return;
    }

    // Ignore sub-pixel noise, but reset the tally whenever direction flips so
    // we don't carry old downward travel into a new upward drag.
    if (dy > 0.5) {
      if (accum.current < 0) accum.current = 0;
      accum.current += dy;
    } else if (dy < -0.5) {
      if (accum.current > 0) accum.current = 0;
      accum.current += dy;
    }

    // Once total travel passes ~10px in a direction, tuck or reveal the header.
    if (accum.current > 10) {
      setHeaderHidden(true);
    } else if (accum.current < -10) {
      setHeaderHidden(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      headerHidden,
      setHeaderHidden,
      hasHeader,
      registerHeader,
      onBodyScroll,
      headerPad
    }),
    [headerHidden, hasHeader, registerHeader, onBodyScroll, headerPad]
  );

  const bg =
    tone === 'color'
      ? accent ?? 'bg-purple/20'
      : tone === 'plain'
        ? ''
        : 'bg-canvas';

  return (
    <ScreenContext.Provider value={value}>
      <View className={cn('flex-1', bg, className)}>
        {/*
          The drifting grid is Bridger's background everywhere now, not just
          Discover — Discover simply gets the boldest version of it. Only
          'plain' screens (things drawn edge to edge, like the story player)
          skip it, because a grid behind a photo just makes it look dirty.
        */}
        {tone === 'plain' ? null : <SynthGrid strength={tone === 'synth' ? 'bold' : 'normal'} />}
        <View className="relative z-10 flex-1">{children}</View>
      </View>
    </ScreenContext.Provider>
  );
}

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** top-right profile photo — falls back to ProfileLink context when omitted */
  onProfile?: () => void;
  profile?: { name: string; emoji?: string; accent?: Accent; photo?: import('react-native').ImageSourcePropType };
  /** hide the profile circle (e.g. already on Profile, or a detail sheet) */
  hideProfile?: boolean;
  trailing?: React.ReactNode;
  /**
   * Analytics surface for this screen (e.g. "home"). When set, the title logs
   * dead_click as `{surface}.top_nav.page_title` and the profile avatar as
   * `{surface}.top_nav.profile_icon`.
   */
  analyticsSurface?: string;
  /** Override the dead-click id on the title (defaults from analyticsSurface). */
  titleAnalyticsId?: string;
  /** Override the profile icon analytics id. */
  profileAnalyticsId?: string;
  /** Override the back button analytics id. */
  backAnalyticsId?: string;
};

export function ScreenHeader({
  title,
  onBack,
  onProfile,
  profile,
  hideProfile = false,
  trailing,
  analyticsSurface,
  titleAnalyticsId,
  profileAnalyticsId,
  backAnalyticsId
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const link = useProfileLink();
  const { headerHidden, registerHeader, headerPad } = React.useContext(ScreenContext);
  const [reduceMotion, setReduceMotion] = useState(false);
  const slide = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    registerHeader();
  }, [registerHeader]);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  // ACCESSIBILITY: Reduce Motion → snap; otherwise ease the tuck.
  useEffect(() => {
    Animated.timing(slide, {
      toValue: headerHidden ? 1 : 0,
      duration: reduceMotion ? 0 : 280,
      useNativeDriver: true
    }).start();
  }, [headerHidden, reduceMotion, slide]);

  const openProfile = onProfile ?? link.open;
  const face = profile ?? link.profile;
  const showProfile = !hideProfile && !!openProfile && !!face;

  // Analytics IDs — reuse element names; surface tells us which screen.
  const resolvedTitleId =
    titleAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.page_title` : undefined);
  const resolvedProfileId =
    profileAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.profile_icon` : undefined);
  const resolvedBackId =
    backAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.back` : undefined);

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -(headerPad + 8)]
  });
  const opacity = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });

  return (
    <Animated.View
      pointerEvents={headerHidden ? 'none' : 'box-none'}
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        zIndex: 20,
        paddingTop: insets.top + HEADER_TOP_PAD,
        transform: [{ translateY }],
        opacity
      }}
    >
      {/*
        Layout lives on a plain View — Animated.View on web often ignores
        flexDirection, which stacked Edit + profile under the title.
      */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          paddingBottom: HEADER_BOTTOM_PAD,
          minHeight: HEADER_ROW
        }}
      >
        {onBack ? (
          <Pressable
            onPress={withAnalyticsPress(resolvedBackId, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Back"
            className="h-9 w-9 items-center justify-center rounded-full border border-ink-line bg-surface active:opacity-80"
          >
            <ChevronLeftIcon size={20} color={c.ink} strokeWidth={2.5} />
          </Pressable>
        ) : null}

        {/*
          Title takes all the free space so trailing + profile sit on the far
          right. The flex wrapper is a plain View so it works even when there's
          no analytics id (AnalyticsRegion drops its wrapper without one).
        */}
        <View style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' }}>
          <AnalyticsRegion
            analyticsId={resolvedTitleId}
            interactive={false}
            accessibilityLabel={title}
          >
            <PixelHeading size="lg" numberOfLines={1}>
              {title}
            </PixelHeading>
          </AnalyticsRegion>
        </View>

        {/* Edit (and any other trailing) + profile stay on the right, one row */}
        {trailing || showProfile ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {trailing}
            {showProfile ? (
              <Pressable
                onPress={withAnalyticsPress(resolvedProfileId, openProfile)}
                accessibilityRole="button"
                accessibilityLabel="Your profile"
                className="shrink-0 active:opacity-80"
              >
                <Avatar
                  name={face.name}
                  emoji={face.emoji}
                  accent={face.accent}
                  photo={face.photo}
                  size="header"
                />
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

export function ScreenBody({
  children,
  padded = true,
  /** leave room for the floating tab bar (turn off on auth / full-screen flows) */
  tabBarInset = true,
  className
}: {
  children: React.ReactNode;
  padded?: boolean;
  tabBarInset?: boolean;
  className?: string;
}) {
  const { onBodyScroll, hasHeader, headerPad } = React.useContext(ScreenContext);

  return (
    <ScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={false}
      scrollEventThrottle={16}
      onScroll={onBodyScroll}
      contentContainerStyle={{
        paddingHorizontal: padded ? 20 : 0,
        // leave room under the floating header so the first line isn't covered
        paddingTop: hasHeader ? headerPad : 8,
        // leave room so the floating tab bar never hides the last item
        paddingBottom: tabBarInset ? 140 : 32
      }}
    >
      {children}
    </ScrollView>
  );
}

/** A plain error/empty label helper used in a few placeholder spots. */
export function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('font-sans text-[14px] text-ink-mute', className)}>{children}</Text>;
}

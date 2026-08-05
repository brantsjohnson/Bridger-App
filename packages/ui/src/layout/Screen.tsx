// ============================================
// WHAT THIS FILE DOES (plain English):
// The scaffold every screen is built from, so all screens share the same shape:
//  - Screen: fills the display and paints the background (eggshell canvas by
//    default; onboarding/fill flows may go full color).
//  - ScreenHeader: the page title row (pixel title, Edit, profile). It lives
//    at the top of the scrolling page — it scrolls off as you go down, and
//    only comes back when you return to the very top. No mid-page tuck/reveal.
//    Back uses solid ink + canvas chevron so it stays visible in dark mode.
//  - ScreenBody: the scrolling content; renders the registered header first,
//    then the screen's children. Padded so the floating tab bar never covers
//    the last item.
// ============================================
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
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
*/
const HEADER_TOP_PAD = 16;
const HEADER_BOTTOM_PAD = 8;
// Air between "Friends" / "Home" and the first section title. Keep this small —
// too much reads as a blank band under the page title.
const GAP_BELOW_HEADER = 10;
const HEADER_ROW = 44;

type ScreenContextValue = {
  hasHeader: boolean;
  /** ScreenHeader mounts its chrome here so ScreenBody can scroll it away. */
  headerChrome: React.ReactNode;
  setHeaderChrome: (node: React.ReactNode) => void;
};

const ScreenContext = React.createContext<ScreenContextValue>({
  hasHeader: false,
  headerChrome: null,
  setHeaderChrome: () => undefined
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
  const [headerChrome, setHeaderChrome] = useState<React.ReactNode>(null);

  const value = useMemo(
    () => ({
      hasHeader: headerChrome != null,
      headerChrome,
      setHeaderChrome
    }),
    [headerChrome]
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
  profile?: {
    name: string;
    emoji?: string;
    accent?: Accent;
    photo?: import('react-native').ImageSourcePropType;
  };
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

/**
 * Builds the title row chrome. ScreenHeader registers this into the scroll
 * body so it leaves the screen by scrolling, not by sliding away mid-page.
 */
function HeaderChrome({
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

  const openProfile = onProfile ?? link.open;
  const face = profile ?? link.profile;
  const showProfile = !hideProfile && !!openProfile && !!face;

  const resolvedTitleId =
    titleAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.page_title` : undefined);
  const resolvedProfileId =
    profileAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.profile_icon` : undefined);
  const resolvedBackId =
    backAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.back` : undefined);

  return (
    <View
      style={{
        paddingTop: insets.top + HEADER_TOP_PAD,
        paddingBottom: HEADER_BOTTOM_PAD + GAP_BELOW_HEADER
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          paddingHorizontal: 20,
          minHeight: HEADER_ROW
        }}
      >
        {onBack ? (
          <Pressable
            onPress={withAnalyticsPress(resolvedBackId, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={4}
            // Solid ink fill + canvas chevron so dark mode never washes the
            // arrow into the near-black header (border-only looked invisible).
            className="h-11 w-11 items-center justify-center rounded-full bg-ink active:opacity-80"
          >
            <ChevronLeftIcon size={22} color={c.canvas} strokeWidth={3} />
          </Pressable>
        ) : null}

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
    </View>
  );
}

/**
 * Declares the page header. The chrome is scrolled with ScreenBody — it does
 * not float or auto-hide mid-scroll.
 */
export function ScreenHeader(props: ScreenHeaderProps) {
  const { setHeaderChrome } = React.useContext(ScreenContext);

  useLayoutEffect(() => {
    setHeaderChrome(<HeaderChrome {...props} />);
    return () => setHeaderChrome(null);
    // Re-register when any header prop changes (title, trailing Edit, etc.).
  }, [
    setHeaderChrome,
    props.title,
    props.onBack,
    props.onProfile,
    props.profile,
    props.hideProfile,
    props.trailing,
    props.analyticsSurface,
    props.titleAnalyticsId,
    props.profileAnalyticsId,
    props.backAnalyticsId
  ]);

  // Chrome lives inside ScreenBody's ScrollView — nothing to paint here.
  return null;
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
  const { headerChrome, hasHeader } = React.useContext(ScreenContext);

  return (
    <ScrollView
      className={cn('flex-1', className)}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        // Header is full-bleed (own horizontal pad). Body content is padded below.
        paddingTop: hasHeader ? 0 : 8,
        paddingBottom: tabBarInset ? 140 : 32
      }}
    >
      {/* Title row scrolls away with the page; returns only at the top. */}
      {headerChrome}
      <View style={{ paddingHorizontal: padded ? 20 : 0 }}>{children}</View>
    </ScrollView>
  );
}

/** A plain error/empty label helper used in a few placeholder spots. */
export function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('font-sans text-[14px] text-ink-mute', className)}>{children}</Text>;
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The scaffold every screen is built from, so all screens share the same shape:
//  - Screen: fills the display and paints the background (eggshell canvas by
//    default; onboarding/fill flows may go full color).
//  - ScreenHeader: the page title row (pixel title, Edit, messages). The title
//    sits flush left now — your profile face moved to the far-right of the
//    bottom nav pill. It lives at the top of the scrolling page — it scrolls
//    off as you go down, and only comes back when you return to the very top.
//    No mid-page tuck/reveal. Back uses solid ink + canvas chevron so it stays
//    visible in dark mode.
//  - ScreenBody: the scrolling content; renders the registered header first,
//    then the screen's children. Padded so the floating tab bar never covers
//    the last item.
// ============================================
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeftIcon, SendIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { useThemeColors } from '../tokens';
import { cn } from '../lib/cn';
import { PixelHeading } from '../primitives/PixelHeading';
import { AnalyticsRegion, withAnalyticsPress } from '../lib/analytics';
import { useProfileLink } from './ProfileLink';
import { useGridColor } from './GridColor';
import { SynthGrid } from './SynthGrid';

type ScreenTone = 'canvas' | 'color' | 'synth' | 'plain' | 'intro';

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

/** Solid ink pill so header icons stay visible in dark mode (matches Back). */
const HEADER_ICON_BTN =
  'h-10 w-10 items-center justify-center rounded-full bg-ink active:opacity-80';

type ScreenHeaderProps = {
  title: string;
  onBack?: () => void;
  /** profile photo (now LEFT of the title) — falls back to ProfileLink context */
  onProfile?: () => void;
  profile?: {
    name: string;
    emoji?: string;
    accent?: Accent;
    photo?: import('react-native').ImageSourcePropType;
  };
  /** hide the profile circle (e.g. already on Profile, or a detail sheet) */
  hideProfile?: boolean;
  /** open the Messages inbox (top-right shortcut) — falls back to ProfileLink context */
  onMessages?: () => void;
  /** hide the messages shortcut (e.g. you're already on Messages, or a detail sheet) */
  hideMessages?: boolean;
  trailing?: React.ReactNode;
  /**
   * Analytics surface for this screen (e.g. "home"). When set, the title logs
   * dead_click as `{surface}.top_nav.page_title`, the profile avatar as
   * `{surface}.top_nav.profile_icon`, and the messages shortcut as
   * `{surface}.top_nav.messages_icon`.
   */
  analyticsSurface?: string;
  /** Override the dead-click id on the title (defaults from analyticsSurface). */
  titleAnalyticsId?: string;
  /** Override the profile icon analytics id. */
  profileAnalyticsId?: string;
  /** Override the messages icon analytics id. */
  messagesAnalyticsId?: string;
  /** Override the back button analytics id. */
  backAnalyticsId?: string;
};

type ScreenContextValue = {
  hasHeader: boolean;
  /**
   * Latest title-row props. ScreenBody paints HeaderChrome from these so the
   * header is not a throwaway React element in state (that remounted buttons
   * and let taps fall through — e.g. Friends + opening Recap).
   */
  headerProps: ScreenHeaderProps | null;
  setHeaderProps: (props: ScreenHeaderProps | null) => void;
  /**
   * Legacy slot used by older ScreenHeader builds during Metro half-refresh.
   * Prefer setHeaderProps. Kept so "setHeaderChrome is not a function" cannot crash.
   */
  headerChrome: React.ReactNode;
  setHeaderChrome: (node: React.ReactNode) => void;
  /** So the title row can flip to light type on black intro gates. */
  tone: ScreenTone;
};

const ScreenContext = React.createContext<ScreenContextValue>({
  hasHeader: false,
  headerProps: null,
  setHeaderProps: () => undefined,
  headerChrome: null,
  setHeaderChrome: () => undefined,
  tone: 'canvas'
});

export function Screen({
  children,
  tone = 'canvas',
  accent,
  className
}: {
  children: React.ReactNode;
  /** eggshell by default; 'color' for onboarding/fill; 'synth' = Discover grid; 'intro' = black first-look gates. */
  tone?: ScreenTone;
  /** a Tailwind bg class used when tone is 'color', e.g. "bg-purple/20". */
  accent?: string;
  className?: string;
}) {
  const [headerProps, setHeaderPropsState] = useState<ScreenHeaderProps | null>(null);
  const [headerChrome, setHeaderChrome] = useState<React.ReactNode>(null);
  // Personal grid tint from onboarding (defaults to classic purple).
  const { gridColor } = useGridColor();

  // THIS SECTION DOES: update header props without remounting when nothing
  // meaningful changed (same trailing node identity = same + / Edit buttons).
  const setHeaderProps = React.useCallback((props: ScreenHeaderProps | null) => {
    setHeaderPropsState((prev) => {
      if (props == null) return null;
      if (
        prev &&
        prev.title === props.title &&
        prev.onBack === props.onBack &&
        prev.onProfile === props.onProfile &&
        prev.profile === props.profile &&
        prev.hideProfile === props.hideProfile &&
        prev.onMessages === props.onMessages &&
        prev.hideMessages === props.hideMessages &&
        prev.trailing === props.trailing &&
        prev.analyticsSurface === props.analyticsSurface &&
        prev.titleAnalyticsId === props.titleAnalyticsId &&
        prev.profileAnalyticsId === props.profileAnalyticsId &&
        prev.messagesAnalyticsId === props.messagesAnalyticsId &&
        prev.backAnalyticsId === props.backAnalyticsId
      ) {
        return prev;
      }
      return props;
    });
    // New path owns the header; clear any leftover legacy chrome node.
    if (props != null) setHeaderChrome(null);
  }, []);

  const value = useMemo(
    () => ({
      hasHeader: headerProps != null || headerChrome != null,
      headerProps,
      setHeaderProps,
      headerChrome,
      setHeaderChrome,
      tone
    }),
    [headerProps, setHeaderProps, headerChrome, tone]
  );

  // THIS SECTION DOES: pick the canvas. Intro gates stay black (same as
  // Discover's first look). Everything else stays eggshell unless it is plain.
  const bg =
    tone === 'color'
      ? accent ?? 'bg-purple/20'
      : tone === 'plain'
        ? ''
        : tone === 'intro'
          ? 'bg-canvas-dark'
          : 'bg-canvas';

  return (
    <ScreenContext.Provider value={value}>
      <View
        className={cn('flex-1', bg, className)}
        // NativeWind `bg-black` can fail to paint on web; pin intro to near-black.
        // Width/height 100% keeps every tab filling the real window on web,
        // instead of locking to a leftover phone-sized box with a white gutter.
        style={{
          width: '100%',
          height: '100%',
          ...(tone === 'intro' ? { backgroundColor: '#0E0E0E' } : null)
        }}
      >
        {/*
          The drifting grid is Bridger's background everywhere now, not just
          Discover — Discover simply gets the boldest version of it. Only
          'plain' screens (things drawn edge to edge, like the story player)
          skip it, because a grid behind a photo just makes it look dirty.
          Intro gates (Events first look, Discover first look) keep the black
          canvas and still get the grid so the first look matches the rest of
          the app.
        */}
        {tone === 'plain' ? null : (
          <SynthGrid
            strength={tone === 'synth' ? 'bold' : 'normal'}
            color={gridColor}
          />
        )}
        <View className="relative z-10 flex-1" style={{ backgroundColor: 'transparent' }}>
          {children}
        </View>
      </View>
    </ScreenContext.Provider>
  );
}

/**
 * Builds the title row chrome. ScreenHeader registers this into the scroll
 * body so it leaves the screen by scrolling, not by sliding away mid-page.
 */
function HeaderChrome({
  title,
  onBack,
  onMessages,
  hideMessages = false,
  trailing,
  analyticsSurface,
  titleAnalyticsId,
  messagesAnalyticsId,
  backAnalyticsId
}: ScreenHeaderProps) {
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const link = useProfileLink();
  const { tone } = React.useContext(ScreenContext);
  const intro = tone === 'intro';

  // THIS SECTION DOES: figure out which chrome buttons this header shows.
  // Your profile face no longer lives here — it moved to the far-right of the
  // bottom nav pill. Detail screens still keep the Back arrow on the left;
  // top-level tabs now start with the title itself (nothing on the left), so
  // the title shifts left to fill the old avatar's spot. Messages stays RIGHT.
  const backMode = !!onBack;
  const openMessages = onMessages ?? link.openMessages;
  // Messages shortcut only rides in the top-right of top-level tabs (never in
  // back mode, so detail screens stay clean).
  const showMessages = !backMode && !hideMessages && !!openMessages;

  const resolvedTitleId =
    titleAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.page_title` : undefined);
  const resolvedMessagesId =
    messagesAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.messages_icon` : undefined);
  const resolvedBackId =
    backAnalyticsId ??
    (analyticsSurface ? `${analyticsSurface}.top_nav.back` : undefined);

  // --- THE MESSAGES BUTTON: paper-airplane; opens your inbox ---
  const messagesButton = showMessages ? (
    <Pressable
      onPress={withAnalyticsPress(resolvedMessagesId, openMessages)}
      accessibilityRole="button"
      accessibilityLabel="Messages"
      className={HEADER_ICON_BTN}
    >
      <SendIcon size={18} color={c.canvas} strokeWidth={2.2} />
    </Pressable>
  ) : null;

  // Left slot: Back arrow on detail screens; nothing on top-level tabs so the
  // title sits flush left (Profile opens from the bottom-nav person icon).
  const leading = backMode ? (
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
  ) : null;

  // Right slot: screen's own trailing controls, then Messages (top-level tabs).
  const rightExtra = backMode ? null : messagesButton;

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
        {leading}

        <View style={{ flex: 1, minWidth: 0, minHeight: 44, justifyContent: 'center' }}>
          <AnalyticsRegion
            analyticsId={resolvedTitleId}
            interactive={false}
            accessibilityLabel={title}
          >
            <PixelHeading
              size="lg"
              numberOfLines={1}
              className={intro ? 'text-white' : undefined}
              style={intro ? { color: '#FFFFFF' } : undefined}
            >
              {title}
            </PixelHeading>
          </AnalyticsRegion>
        </View>

        {trailing || rightExtra ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {trailing}
            {rightExtra}
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
  const { setHeaderProps, setHeaderChrome } = React.useContext(ScreenContext);

  // THIS SECTION DOES: push the latest title-row props into Screen. We never
  // clear to null on a normal update (that left a hole taps could fall through).
  // Runs every commit so trailing / Edit stay in sync; setHeaderProps no-ops
  // when nothing meaningful changed (keeps the + button from remounting).
  // Falls back to setHeaderChrome if Metro still has an older Screen provider.
  useLayoutEffect(() => {
    if (typeof setHeaderProps === 'function') {
      setHeaderProps(props);
      return;
    }
    if (typeof setHeaderChrome === 'function') {
      setHeaderChrome(<HeaderChrome {...props} />);
    }
  });

  // Only clear when this screen's header unmounts for real.
  useLayoutEffect(() => {
    return () => {
      if (typeof setHeaderProps === 'function') setHeaderProps(null);
      if (typeof setHeaderChrome === 'function') setHeaderChrome(null);
    };
  }, [setHeaderProps, setHeaderChrome]);

  // Chrome lives inside ScreenBody's ScrollView — nothing to paint here.
  return null;
}

export function ScreenBody({
  children,
  padded = true,
  /** leave room for the floating tab bar (turn off on auth / full-screen flows) */
  tabBarInset = true,
  /**
   * KEYBOARD: only turn this on for screens with mid-page text fields.
   * Off by default because iOS can leave a tall empty scroll gap after the
   * keyboard closes (or leak that gap onto other screens). Sheets already
   * lift themselves; use this only when a field lives in the page scroll.
   */
  adjustKeyboardInsets = false,
  /** Set false while dragging roster rows so the page doesn't fight the finger. */
  scrollEnabled = true,
  /**
   * Park children in the vertical middle of the space under the header
   * (News coming-soon, empty gates). Header stays pinned at the top.
   */
  centerContent = false,
  className
}: {
  children: React.ReactNode;
  padded?: boolean;
  tabBarInset?: boolean;
  adjustKeyboardInsets?: boolean;
  scrollEnabled?: boolean;
  centerContent?: boolean;
  className?: string;
}) {
  const { headerProps, headerChrome, hasHeader } = React.useContext(ScreenContext);

  return (
    <ScrollView
      className={cn('flex-1', className)}
      scrollEnabled={scrollEnabled}
      showsVerticalScrollIndicator={false}
      // Transparent so intro's black canvas shows through (web ScrollView
      // otherwise paints white and the gate looks like graph paper).
      style={{ backgroundColor: 'transparent' }}
      keyboardShouldPersistTaps="handled"
      // KEYBOARD: opt-in only. Default off so Home / Co-op / Friends do not
      // show a blank keyboard-sized hole when you are not typing.
      automaticallyAdjustKeyboardInsets={
        adjustKeyboardInsets && Platform.OS === 'ios'
      }
      contentContainerStyle={{
        // Grow so centerContent can middle the body under the header.
        flexGrow: 1,
        // Header is full-bleed (own horizontal pad). Body content is padded below.
        paddingTop: hasHeader ? 0 : 8,
        // Tab pill clearance only (not keyboard height). Sheets / opt-in
        // adjustKeyboardInsets handle typing space.
        paddingBottom: tabBarInset ? 108 : 32
      }}
    >
      {/* Title row scrolls away with the page; zIndex keeps + taps on the header. */}
      {headerProps ? (
        <View collapsable={false} style={{ zIndex: 20, elevation: 20 }}>
          <HeaderChrome {...headerProps} />
        </View>
      ) : headerChrome ? (
        <View collapsable={false} style={{ zIndex: 20, elevation: 20 }}>
          {headerChrome}
        </View>
      ) : null}
      <View
        style={{
          paddingHorizontal: padded ? 20 : 0,
          ...(centerContent
            ? { flexGrow: 1, justifyContent: 'center' as const }
            : null)
        }}
      >
        {children}
      </View>
    </ScrollView>
  );
}

/** A plain error/empty label helper used in a few placeholder spots. */
export function Muted({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Text className={cn('font-sans text-[14px] text-ink-mute', className)}>{children}</Text>;
}

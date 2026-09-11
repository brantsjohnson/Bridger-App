// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared frame every onboarding screen sits in. One ask per screen on the
// SAME background as Home: eggshell canvas (`bg-canvas`) plus the drifting
// SynthGrid. A square back box, a segmented step bar with "3/14" beside it, a
// small amber tag saying why we're asking, the huge blue all-caps question,
// the screen's body, and the hot pink Continue button (plus an underlined
// "Skip for now" when the step is optional).
//
// Paint for chips / boxes comes from onboarding-theme.ts and onboarding-ui.tsx.
// The page backdrop is the shared Screen look so first-run never feels like a
// different app.
//
// LAYOUT: the screen is pinned to the display height. The body scrolls (or fills)
// inside a KeyboardAvoidingView; Continue stays pinned below that area so the
// keyboard never shoves the button up over the fields you are typing in.
//
// By default the body does NOT scroll: the whole screen must fit. Birthday,
// color, co-op, confirm, and places opt into scrolling because their content
// is too tall. When the body scrolls, we show the system scroll bar and a soft
// fade at the bottom so it is obvious there is more below.
//
// ACCESSIBILITY: the SynthGrid is decorative and hidden from screen readers;
// the step bar announces "Step 3 of 14"; every button says what it does and is
// comfortably past 44pt. The top bar clears the notch and the footer clears the
// home indicator.
// ============================================
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import {
  ACCENT_HEX,
  AnalyticsRegion,
  SynthGrid,
  THEME,
  useGridColor,
  useResponsiveLayout,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { headingColorFor } from './onboarding-new-flow';
import { OnboardingBurstHost, OnboardingLookProvider } from './onboarding-chrome';
import { OB, OB_BORDER } from './onboarding-theme';
import {
  OBBody,
  OBCTA,
  OBChip,
  OBHeading,
  OBKicker,
  OBProgress,
  OBSkipLink
} from './onboarding-ui';

/**
 * Lets a field inside a scrolling step ask the page to scroll it into view
 * when the keyboard opens (so the typing box is not hidden under it), and
 * freeze page scroll while a horizontal slider / spectrum drag is happening
 * so the page does not fight the finger.
 */
type BodyScrollApi = {
  ensureVisible: (target: View | null) => void;
  /** True = lock the body ScrollView (used by color fine-tune + spectrum). */
  setScrollLocked: (locked: boolean) => void;
};

const OnboardingBodyScrollContext = createContext<BodyScrollApi | null>(null);

/** Hook used by fields (place search, etc.) to stay on screen above the keyboard. */
export function useOnboardingBodyScroll(): BodyScrollApi {
  return (
    useContext(OnboardingBodyScrollContext) ?? {
      ensureVisible: () => undefined,
      setScrollLocked: () => undefined
    }
  );
}

type Props = {
  step: number;
  total?: number;
  /** Optional short "why" line above the question (the small amber tag). */
  purpose?: string;
  /** the question itself — omit when the step draws its own headline in the body */
  ask?: string;
  /** Optional sentence under the question. */
  blurb?: string;
  /** Optional small pink all-caps hint, e.g. "Pick any that apply". */
  kicker?: string;
  children?: React.ReactNode;
  cta?: string;
  ctaDisabled?: boolean;
  loading?: boolean;
  onContinue?: () => void;
  onSkip?: () => void;
  /** step back to fix a previous answer; hidden on the very first ask */
  onBack?: () => void;
  /** override the "Skip for now" label (e.g. "Use free") */
  skipLabel?: string;
  /**
   * Kept so every existing screen still compiles. Onboarding is one tan room
   * now, so this no longer paints the background.
   */
  accent?: Accent;
  /** override the default chrome ids when a step wants its own (e.g. co-op) */
  continueAnalyticsId?: string;
  skipAnalyticsId?: string;
  /** replace the default Continue/Skip footer (e.g. co-op payment buttons) */
  footer?: React.ReactNode;
  /** Omit the footer entirely (birthday picker confirms inside the body). */
  hideFooter?: boolean;
  /** Let the step body grow to fill space above the footer (default: true). */
  fillBody?: boolean;
  /** Opt into scrolling when content cannot fit (birthday, color only). */
  scrollBody?: boolean;
  /** Use the smaller heading size on screens with a lot of content. */
  smallAsk?: boolean;
  /**
   * Emojis for the Continue shower. Places passes the favorite country's flag
   * so Continue explodes that flag instead of the default party mix.
   */
  burstEmojis?: string[];
  /**
   * New onboarding dress. Omit on Old screens so they keep the classic look.
   * action = your turn (progress + amber pill + blue heading).
   * info = we are telling you something (inverted canvas, no progress bar).
   */
  tone?: 'action' | 'info';
  /** Right-side chrome label on action screens (e.g. Getting started). */
  conceptLabel?: string;
  /** Heading color. Action screens stay blue. Info screens use the concept. */
  headingColor?: string;
  /** ⓘ that takes the chrome slot on information screens. */
  headerNote?: React.ReactNode;
  /** Quiet line under the CTA, e.g. "You can change this anytime." */
  ctaNote?: string;
  /** New screens use sentence case. Old screens stay all-caps. */
  sentenceCase?: boolean;
};

/** Side padding for the whole run, straight from the design (24px). */
const PAGE_X = 24;

export function OnboardingStep({
  step,
  total = 13,
  purpose,
  ask,
  blurb,
  kicker,
  children,
  cta = 'Continue',
  ctaDisabled,
  loading,
  onContinue,
  onSkip,
  onBack,
  continueAnalyticsId,
  skipAnalyticsId,
  skipLabel = 'Skip for now',
  footer,
  hideFooter,
  fillBody = true,
  scrollBody = false,
  smallAsk = false,
  burstEmojis,
  tone,
  conceptLabel,
  headingColor,
  headerNote,
  ctaNote,
  sentenceCase = false,
  accent
}: Props) {
  const insets = useSafeAreaInsets();
  // Same canvas + grid tint as Home / every other Screen.
  const theme = useThemeColors();
  const { gridColor } = useGridColor();
  const { contentMaxWidth } = useResponsiveLayout();
  const dressed = tone === 'action' || tone === 'info';
  const info = tone === 'info';
  const hideBar = info || (dressed && step <= 0);
  // Info screens flip the phone's mode so "being told" feels different from
  // "your turn." Action screens stay on the app canvas.
  const phoneDark = theme.canvas.toLowerCase() === THEME.dark.canvas.toLowerCase();
  const onDark = info ? !phoneDark : phoneDark;
  const pageCanvas = dressed
    ? onDark
      ? THEME.dark.canvas
      : THEME.light.canvas
    : theme.canvas;
  const pageInk = dressed ? (onDark ? THEME.dark.ink : THEME.light.ink) : theme.ink;
  const pageInkSoft = dressed
    ? onDark
      ? THEME.dark.inkSoft
      : THEME.light.inkSoft
    : theme.inkSoft;
  const pageInkMute = dressed
    ? onDark
      ? THEME.dark.inkMute
      : THEME.light.inkMute
    : theme.inkMute;
  const askColor =
    headingColor ??
    (dressed && accent
      ? headingColorFor(tone ?? 'action', accent, onDark)
      : info
        ? ACCENT_HEX.pink
        : OB.blue);
  const askStyle = sentenceCase || dressed
    ? {
        fontSize: smallAsk ? 30 : 34,
        lineHeight: smallAsk ? 34 : 38,
        letterSpacing: -0.6,
        textTransform: 'none' as const,
        color: askColor
      }
    : undefined;

  // THIS SECTION DOES: decide whether the body fills the screen or scrolls.
  const bodyFills = fillBody && !scrollBody;

  // Air above the top bar (clears the notch). Footer pad is set inline so Skip
  // stays tight under Continue and the CTA sits near the bottom.
  const topPad = insets.top + 10;

  // THIS SECTION DOES: remember whether the scroll body still has more below,
  // so we can show a soft fade that says "keep going."
  const scrollRef = useRef<ScrollView>(null);
  // Outer box around the ScrollView. We measure this ref (not e.currentTarget)
  // because on web onLayout's currentTarget is often undefined.
  const scrollFrameRef = useRef<View>(null);
  const scrollWindow = useRef({ x: 0, y: 0, height: 0 });
  const pendingVisible = useRef<View | null>(null);
  const contentH = useRef(0);
  const layoutH = useRef(0);
  const scrollY = useRef(0);
  const [moreBelow, setMoreBelow] = useState(false);
  const [atScrollTop, setAtScrollTop] = useState(true);
  // True while a child (color slider / spectrum) is dragging, so the page
  // does not scroll under the finger at the same time.
  const [scrollLocked, setScrollLocked] = useState(false);
  // Extra bottom pad only while the keyboard is up (Obsession song field).
  // A permanent 320 pad made Confirm always show a "SCROLL" label over First name.
  const [keyboardPad, setKeyboardPad] = useState(0);
  const refreshMoreBelow = () => {
    const leftover = contentH.current - layoutH.current - scrollY.current;
    setMoreBelow(leftover > 24);
    setAtScrollTop(scrollY.current < 16);
  };

  // THIS SECTION DOES: record where the scroll window sits on screen, safely.
  // Prefer measureInWindow on a real View ref; fall back to layout height on web.
  const rememberScrollWindow = useCallback((fallbackHeight: number) => {
    const node = scrollFrameRef.current;
    if (node && typeof node.measureInWindow === 'function') {
      node.measureInWindow((x, y, _w, h) => {
        scrollWindow.current = { x, y, height: h > 0 ? h : fallbackHeight };
      });
      return;
    }
    scrollWindow.current = { x: 0, y: 0, height: fallbackHeight };
  }, []);

  // THIS SECTION DOES: slide the page so a focused field sits above the keyboard.
  const scrollTargetIntoView = useCallback((target: View | null) => {
    if (!target || !scrollBody) return;
    pendingVisible.current = target;
    // Re-measure the scroll window first (keyboard may have just resized it).
    rememberScrollWindow(layoutH.current);
    if (typeof target.measureInWindow !== 'function') return;
    target.measureInWindow((_tx, ty, _tw, th) => {
      const win = scrollWindow.current;
      if (win.height <= 0) {
        // Measure failed: push far enough that the song field clears the keys.
        scrollRef.current?.scrollToEnd({ animated: true });
        return;
      }
      const pad = 48;
      const visibleTop = win.y + pad;
      const visibleBottom = win.y + win.height - pad;
      const fieldBottom = ty + th;
      let delta = 0;
      if (fieldBottom > visibleBottom) {
        delta = fieldBottom - visibleBottom + 24;
      } else if (ty < visibleTop) {
        delta = ty - visibleTop;
      }
      if (Math.abs(delta) < 4) return;
      scrollRef.current?.scrollTo({
        y: Math.max(0, scrollY.current + delta),
        animated: true
      });
    });
  }, [rememberScrollWindow, scrollBody]);

  const bodyScrollApi = useMemo<BodyScrollApi>(
    () => ({
      ensureVisible: (target) => {
        // Wait for keyboard animation, then retry so late insets still catch it.
        pendingVisible.current = target;
        const run = (delay: number) =>
          setTimeout(() => scrollTargetIntoView(target), delay);
        requestAnimationFrame(() => {
          run(Platform.OS === 'ios' ? 120 : 80);
          run(Platform.OS === 'ios' ? 360 : 220);
          run(Platform.OS === 'ios' ? 560 : 400);
        });
      },
      setScrollLocked
    }),
    [scrollTargetIntoView]
  );

  // After the keyboard finishes opening, re-check the field we were aiming at.
  useEffect(() => {
    if (!scrollBody) return;
    const sub = Keyboard.addListener('keyboardDidShow', (e) => {
      // Use most of the keyboard height as scroll room so the song field
      // clears the keys (0.55 left the field half-covered on iPhone).
      setKeyboardPad(Math.max(220, Math.round((e.endCoordinates?.height ?? 300) * 0.85)));
      // Window height changed; refresh measure then scroll again.
      rememberScrollWindow(layoutH.current);
      const target = pendingVisible.current;
      if (!target) {
        // Obsession: if we lost the anchor, still lift the bottom of the page.
        scrollRef.current?.scrollToEnd({ animated: true });
        return;
      }
      setTimeout(() => scrollTargetIntoView(target), 40);
      setTimeout(() => scrollTargetIntoView(target), 280);
      setTimeout(() => scrollTargetIntoView(target), 520);
    });
    return () => sub.remove();
  }, [rememberScrollWindow, scrollBody, scrollTargetIntoView]);

  // THIS SECTION DOES: when the keyboard closes, pull the scroll back if we
  // overscrolled into empty padding (Confirm / Obsession "can't scroll up").
  useEffect(() => {
    if (!scrollBody) return;
    const sub = Keyboard.addListener('keyboardDidHide', () => {
      pendingVisible.current = null;
      setKeyboardPad(0);
      const maxY = Math.max(0, contentH.current - layoutH.current);
      if (scrollY.current > maxY + 8) {
        scrollRef.current?.scrollTo({ y: maxY, animated: true });
      }
    });
    return () => sub.remove();
  }, [scrollBody]);

  // THIS SECTION DOES: New screens get rounded boxes and a page-level emoji
  // shower that never blocks scrolling. Old screens stay square.
  return (
    <OnboardingLookProvider dressed={dressed}>
    <OnboardingBurstHost>
    <View
      className="flex-1 bg-canvas"
      style={{
        flex: 1,
        width: '100%',
        alignSelf: 'stretch',
        height: '100%',
        backgroundColor: pageCanvas,
        overflow: 'hidden'
      }}
    >
      {/* Same drifting grid Home uses, not the old graph-paper corner patches. */}
      <SynthGrid strength="normal" color={dressed && onDark ? 'rgba(255,255,255,0.08)' : gridColor} />

      {/* Soft concept blobs sit at the bottom so they never cover Back. */}
      {dressed ? (
        <View pointerEvents="none" accessible={false} style={{ position: 'absolute', inset: 0 }}>
          <View
            style={{
              position: 'absolute',
              bottom: -96,
              left: -80,
              width: 240,
              height: 240,
              borderRadius: 999,
              backgroundColor: onDark ? '#FFFFFF' : askColor,
              opacity: onDark ? 0.09 : 0.18
            }}
          />
          <View
            style={{
              position: 'absolute',
              bottom: -128,
              right: -64,
              width: 208,
              height: 208,
              borderRadius: 999,
              backgroundColor: onDark ? '#FFFFFF' : OB.pink,
              opacity: onDark ? 0.05 : 0.14
            }}
          />
        </View>
      ) : null}

      <View
        className="relative z-10 flex-1"
        style={{
          backgroundColor: 'transparent',
          width: '100%',
          maxWidth: contentMaxWidth,
          alignSelf: 'center'
        }}
      >
      {/* TOP BAR: square back box (to fix an earlier answer) + the step bar. */}
      <View
        style={{
          paddingTop: topPad,
          paddingHorizontal: PAGE_X,
          paddingBottom: 6,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14
        }}
      >
        {onBack ? (
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            style={{
              width: 40,
              height: 40,
              flexShrink: 0,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: dressed ? (onDark ? THEME.dark.surface : THEME.light.surface) : theme.canvas,
              borderWidth: OB_BORDER,
              // Theme ink so the box stays visible on a dark canvas.
              borderColor: pageInk,
              borderRadius: dressed ? 999 : 0
            }}
          >
            <ArrowLeftIcon size={18} color={pageInk} strokeWidth={2.6} />
          </Pressable>
        ) : null}
        {hideBar ? (
          <View style={{ flex: 1 }} />
        ) : (
          <View style={{ flex: 1 }}>
            <OBProgress step={step} total={total} analyticsId={ONBOARDING.chrome.progress_bar} />
          </View>
        )}
        {headerNote ??
          (dressed && !info && conceptLabel ? (
            <Text className="font-sans-b text-[12px]" style={{ color: pageInkMute }}>
              {conceptLabel}
            </Text>
          ) : null)}
      </View>

      {/* THE ASK: why we're asking, the big question, and an optional sentence.
          Some steps (taste intro) skip this and put the headline in the body. */}
      {purpose || ask || blurb || kicker || (dressed && !info) ? (
        <View style={{ paddingHorizontal: PAGE_X, paddingTop: 14, paddingBottom: 8, gap: 12 }}>
          {(purpose || (dressed && !info)) ? (
            <OBChip>{purpose ?? 'Your turn'}</OBChip>
          ) : null}
          {ask ? (
            <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
              <OBHeading small={smallAsk} style={askStyle}>
                {ask}
              </OBHeading>
            </AnalyticsRegion>
          ) : null}
          {blurb ? (
            dressed ? (
              <Text
                style={{
                  fontSize: 15,
                  lineHeight: 21,
                  fontWeight: '600',
                  color: pageInkSoft,
                  maxWidth: 300
                }}
              >
                {blurb}
              </Text>
            ) : (
              <OBBody>{blurb}</OBBody>
            )
          ) : null}
          {kicker ? <OBKicker>{kicker}</OBKicker> : null}
        </View>
      ) : null}

      {/* THIS SECTION DOES: body + Continue share one KeyboardAvoidingView so
          Continue lifts above the keyboard, and the first tap on Continue
          always advances (no "dismiss keyboard, then tap again"). */}
      <View style={{ flex: 1, minHeight: 0 }}>
        <OnboardingBodyScrollContext.Provider value={bodyScrollApi}>
        <KeyboardAvoidingView
          style={{ flex: 1, minHeight: 0 }}
          // One keyboard owner: iOS ScrollView insets + ensureVisible.
          // Extra KAV padding fought the scroll and left people stuck mid-page.
          behavior={undefined}
          keyboardVerticalOffset={0}
        >
          {bodyFills ? (
            <View
              style={{
                flex: 1,
                minHeight: 0,
                paddingHorizontal: PAGE_X,
                paddingTop: 8,
                // Clip so a tall body cannot paint under the pinned Continue.
                overflow: 'hidden'
              }}
            >
              {children}
            </View>
          ) : (
            <View
              ref={scrollFrameRef}
              style={{ flex: 1, minHeight: 0 }}
              onLayout={(e) => {
                // Remember where the scroll window sits on the phone screen.
                rememberScrollWindow(e.nativeEvent.layout.height);
              }}
            >
              <ScrollView
                ref={scrollRef}
                style={{ flex: 1, minHeight: 0, backgroundColor: 'transparent' }}
                // Show the bar so a long list (co-op perks) does not look finished.
                showsVerticalScrollIndicator
                // Freeze while a child claims the drag (color slider / spectrum).
                scrollEnabled={!scrollLocked}
                keyboardShouldPersistTaps="always"
                keyboardDismissMode="on-drag"
                // iOS: lift content with the keyboard so focused fields stay visible.
                automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
                onLayout={(e) => {
                  layoutH.current = e.nativeEvent.layout.height;
                  rememberScrollWindow(e.nativeEvent.layout.height);
                  refreshMoreBelow();
                }}
                onContentSizeChange={(_w, h) => {
                  contentH.current = h;
                  refreshMoreBelow();
                }}
                onScroll={(e: NativeSyntheticEvent<NativeScrollEvent>) => {
                  scrollY.current = e.nativeEvent.contentOffset.y;
                  refreshMoreBelow();
                }}
                scrollEventThrottle={16}
                contentContainerStyle={{
                  // Do not flexGrow when content is tall: that padded empty space
                  // made Confirm / Obsession feel stuck scrolled down.
                  paddingHorizontal: PAGE_X,
                  paddingTop: 8,
                  // Quiet base pad; grow only while the keyboard is open so the
                  // song field can scroll above the keys without a permanent
                  // "SCROLL" label sitting on First name.
                  paddingBottom: 48 + keyboardPad
                }}
              >
                {children}
              </ScrollView>
              {/* Soft fade + hint: between the list and Continue, never painted
                  over a typing box. */}
              {moreBelow && atScrollTop ? (
                <View
                  pointerEvents="none"
                  accessible={false}
                  style={{
                    height: 22,
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Text
                    className="font-sans-sb text-[10px]"
                    style={{
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      color: theme.inkMute
                    }}
                  >
                    Scroll
                  </Text>
                </View>
              ) : null}
            </View>
          )}

          {hideFooter ? null : (
            <View
              style={{
                paddingHorizontal: PAGE_X,
                paddingTop: 14,
                // Less air under Skip so Continue sits closer to the home indicator.
                paddingBottom: Math.max(insets.bottom, 12) + 8,
                gap: 6
              }}
            >
              {footer ?? (
                <>
                  <OBCTA
                    label={cta}
                    disabled={ctaDisabled || loading}
                    analyticsId={continueAnalyticsId ?? ONBOARDING.chrome.continue}
                    onPress={onContinue}
                    burstEmojis={burstEmojis}
                  />
                  {ctaNote ? (
                    <Text
                      className="text-center font-sans-sb text-[12px]"
                      style={{ color: pageInkMute }}
                    >
                      {ctaNote}
                    </Text>
                  ) : null}
                  {onSkip ? (
                    <OBSkipLink
                      label={skipLabel}
                      onPress={onSkip}
                      analyticsId={skipAnalyticsId ?? ONBOARDING.chrome.skip}
                    />
                  ) : null}
                </>
              )}
            </View>
          )}
        </KeyboardAvoidingView>
        </OnboardingBodyScrollContext.Provider>
      </View>
      </View>
    </View>
    </OnboardingBurstHost>
    </OnboardingLookProvider>
  );
}

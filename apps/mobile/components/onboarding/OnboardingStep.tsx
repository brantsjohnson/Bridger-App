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
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeftIcon } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import {
  AnalyticsRegion,
  SynthGrid,
  useGridColor,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
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
  burstEmojis
}: Props) {
  const insets = useSafeAreaInsets();
  // Same canvas + grid tint as Home / every other Screen.
  const theme = useThemeColors();
  const { gridColor } = useGridColor();

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
  // True while a child (color slider / spectrum) is dragging, so the page
  // does not scroll under the finger at the same time.
  const [scrollLocked, setScrollLocked] = useState(false);
  const refreshMoreBelow = () => {
    const leftover = contentH.current - layoutH.current - scrollY.current;
    setMoreBelow(leftover > 12);
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
      if (win.height <= 0) return;
      const pad = 28;
      const visibleTop = win.y + pad;
      const visibleBottom = win.y + win.height - pad;
      const fieldBottom = ty + th;
      let delta = 0;
      if (fieldBottom > visibleBottom) {
        delta = fieldBottom - visibleBottom;
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
        // Wait for KeyboardAvoidingView + keyboard animation, then scroll.
        pendingVisible.current = target;
        requestAnimationFrame(() => {
          setTimeout(
            () => scrollTargetIntoView(target),
            Platform.OS === 'ios' ? 280 : 160
          );
        });
      },
      setScrollLocked
    }),
    [scrollTargetIntoView]
  );

  // After the keyboard finishes opening, re-check the field we were aiming at.
  useEffect(() => {
    if (!scrollBody) return;
    const sub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardDidShow' : 'keyboardDidShow',
      () => {
        // Window height changed; refresh measure then scroll again.
        rememberScrollWindow(layoutH.current);
        const target = pendingVisible.current;
        if (!target) return;
        setTimeout(() => scrollTargetIntoView(target), 60);
      }
    );
    return () => sub.remove();
  }, [rememberScrollWindow, scrollBody, scrollTargetIntoView]);

  // Soft fade into the live canvas color (matches Home, including dark mode).
  const fadeTop = `${theme.canvas}00`;
  const fadeBottom = theme.canvas;

  return (
    <View
      className="flex-1 bg-canvas"
      style={{
        flex: 1,
        width: '100%',
        alignSelf: 'stretch',
        height: '100%',
        backgroundColor: theme.canvas,
        overflow: 'hidden'
      }}
    >
      {/* Same drifting grid Home uses, not the old graph-paper corner patches. */}
      <SynthGrid strength="normal" color={gridColor} />

      <View className="relative z-10 flex-1" style={{ backgroundColor: 'transparent' }}>
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
              backgroundColor: theme.canvas,
              borderWidth: OB_BORDER,
              // Theme ink so the box stays visible on a dark canvas.
              borderColor: theme.ink
            }}
          >
            <ArrowLeftIcon size={18} color={theme.ink} strokeWidth={2.6} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <OBProgress step={step} total={total} analyticsId={ONBOARDING.chrome.progress_bar} />
        </View>
      </View>

      {/* THE ASK: why we're asking, the big question, and an optional sentence.
          Some steps (taste intro) skip this and put the headline in the body. */}
      {purpose || ask || blurb || kicker ? (
        <View style={{ paddingHorizontal: PAGE_X, paddingTop: 14, paddingBottom: 8, gap: 16 }}>
          {purpose ? <OBChip>{purpose}</OBChip> : null}
          {ask ? (
            <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
              <OBHeading small={smallAsk}>{ask}</OBHeading>
            </AnalyticsRegion>
          ) : null}
          {blurb ? <OBBody>{blurb}</OBBody> : null}
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
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
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
                  flexGrow: 1,
                  paddingHorizontal: PAGE_X,
                  paddingTop: 8,
                  // Extra air so the last field clears the Scroll fade + keyboard.
                  paddingBottom: 160
                }}
              >
                {children}
              </ScrollView>
              {/* Soft fade + hint: only while there is still content below.
                  Kept short so it does not paint over the last typing box. */}
              {moreBelow ? (
                <View
                  pointerEvents="none"
                  accessible={false}
                  style={{
                    position: 'absolute',
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 36,
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingBottom: 2
                  }}
                >
                  <LinearGradient
                    colors={[fadeTop, fadeBottom]}
                    style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                  />
                  <Text
                    className="font-sans-sb text-[10px]"
                    style={{
                      letterSpacing: 1,
                      textTransform: 'uppercase',
                      // Theme ink: dark navy disappears on a dark canvas.
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
  );
}

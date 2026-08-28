// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared frame every onboarding screen sits in. One ask per screen on the
// same eggshell canvas as the rest of Bridger: a square back box, a segmented
// step bar with "3/14" beside it, a small amber tag saying why we're asking,
// the huge blue all-caps question, the screen's body, and the hot pink Continue
// button (plus an underlined "Skip for now" when the step is optional).
//
// Paint comes from onboarding-theme.ts and parts from onboarding-ui.tsx. The
// canvas matches Home so first-run does not feel like a different app. It is
// light-only on purpose, so dark mode never washes out the page.
//
// LAYOUT (this is what keeps Continue still): the screen is pinned to the real
// height of the display, so it is always one full page, never as short as
// whatever happens to be on it. Inside, the order is fixed: top bar, question,
// body (takes all the leftover room), then the button glued to the bottom.
// Because the body absorbs the leftover space, the button sits in the exact same
// spot on every step instead of sliding up and down. When the keyboard opens the
// button rises with it, the way a normal app behaves.
//
// By default the body does NOT scroll: the whole screen must fit. Birthday,
// color, and co-op opt into scrolling because their content is too tall. When
// the body scrolls, we show the system scroll bar and a soft fade at the bottom
// so it is obvious there is more below.
//
// ACCESSIBILITY: the grid paper and the button's shadow block are decorative and
// hidden from screen readers; the step bar announces "Step 3 of 14"; every
// button says what it does and is comfortably past 44pt. The top bar clears the
// notch and the footer clears the home indicator.
// ============================================
import React, { useRef, useState } from 'react';
import {
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OB, OB_BORDER } from './onboarding-theme';
import {
  OBBody,
  OBCTA,
  OBChip,
  OBGridPatch,
  OBHeading,
  OBKicker,
  OBProgress,
  OBSkipLink
} from './onboarding-ui';

type Props = {
  step: number;
  total?: number;
  /** Optional short "why" line above the question (the small amber tag). */
  purpose?: string;
  /** the question itself */
  ask: string;
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
};

/** Side padding for the whole run, straight from the design (24px). */
const PAGE_X = 24;

export function OnboardingStep({
  step,
  total = 14,
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
  smallAsk = false
}: Props) {
  const insets = useSafeAreaInsets();

  // THIS SECTION DOES: decide whether the body fills the screen or scrolls.
  const bodyFills = fillBody && !scrollBody;

  // Air above the top bar (clears the notch) and under the footer (clears the
  // home indicator), with a sensible floor for phones that report no inset.
  const topPad = insets.top + 10;
  const bottomPad = Math.max(insets.bottom, 16) + 16;

  // THIS SECTION DOES: remember whether the scroll body still has more below,
  // so we can show a soft fade that says "keep going."
  const contentH = useRef(0);
  const layoutH = useRef(0);
  const scrollY = useRef(0);
  const [moreBelow, setMoreBelow] = useState(false);
  const refreshMoreBelow = () => {
    const leftover = contentH.current - layoutH.current - scrollY.current;
    setMoreBelow(leftover > 12);
  };

  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        alignSelf: 'stretch',
        height: '100%',
        backgroundColor: OB.canvas,
        overflow: 'hidden'
      }}
    >
      {/* THE PAPER: faint graph-paper squares in two corners, like the design. */}
      <OBGridPatch size={270} right={-70} top={-40} />
      <OBGridPatch size={300} left={-30} bottom={-40} opacity={0.75} />

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
              backgroundColor: OB.canvas,
              borderWidth: OB_BORDER,
              borderColor: OB.navy
            }}
          >
            <Text className="font-sans-b text-[17px]" style={{ color: OB.navy }} accessible={false}>
              ←
            </Text>
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <OBProgress step={step} total={total} analyticsId={ONBOARDING.chrome.progress_bar} />
        </View>
      </View>

      {/* THE ASK: why we're asking, the big question, and an optional sentence. */}
      <View style={{ paddingHorizontal: PAGE_X, paddingTop: 14, paddingBottom: 8, gap: 12 }}>
        {purpose ? <OBChip>{purpose}</OBChip> : null}
        <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
          <OBHeading small={smallAsk}>{ask}</OBHeading>
        </AnalyticsRegion>
        {blurb ? <OBBody>{blurb}</OBBody> : null}
        {kicker ? <OBKicker>{kicker}</OBKicker> : null}
      </View>

      {/* THIS SECTION DOES: everything under the question lives in one column -
          the body first, taking all the leftover room, then the buttons. That is
          what keeps the buttons parked at the bottom on every single step. */}
      <KeyboardAvoidingView
        style={{ flex: 1, minHeight: 0 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {bodyFills ? (
          <View style={{ flex: 1, minHeight: 0, paddingHorizontal: PAGE_X, paddingTop: 8 }}>
            {children}
          </View>
        ) : (
          <View style={{ flex: 1, minHeight: 0 }}>
            <ScrollView
              style={{ flex: 1, minHeight: 0, backgroundColor: 'transparent' }}
              // Show the bar so a long list (co-op perks) does not look finished.
              showsVerticalScrollIndicator
              keyboardShouldPersistTaps="handled"
              onLayout={(e) => {
                layoutH.current = e.nativeEvent.layout.height;
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
                // Extra air so the last perk can peek under the fade.
                paddingBottom: 28
              }}
            >
              {children}
            </ScrollView>
            {/* Soft fade + chevron: only while there is still content below. */}
            {moreBelow ? (
              <View
                pointerEvents="none"
                accessible={false}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 56,
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingBottom: 4
                }}
              >
                <LinearGradient
                  colors={['rgba(250,248,242,0)', OB.canvas]}
                  style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
                />
                <Text
                  className="font-sans-sb text-[11px]"
                  style={{ letterSpacing: 1, textTransform: 'uppercase', color: OB.navy }}
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
              paddingBottom: bottomPad,
              gap: 14
            }}
          >
            {footer ?? (
              <>
                <OBCTA
                  label={cta}
                  disabled={ctaDisabled || loading}
                  analyticsId={continueAnalyticsId ?? ONBOARDING.chrome.continue}
                  onPress={onContinue}
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
    </View>
  );
}

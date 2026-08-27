// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared frame every onboarding screen sits in. One ask per screen: a
// colored canvas washed in the step's accent, a soft blob behind it, a step
// progress bar, a small "purpose" pill (the why), the big question, the step's
// body, and a Continue button (plus an optional "Skip for now"). Moving through
// onboarding should feel like walking through a set of colored rooms.
//
// By default the body does NOT scroll: the whole screen must fit. Only birthday
// and color opt into scrolling because their pickers are too tall for a small
// phone. Use scrollBody for those two.
//
// ACCESSIBILITY: the progress bar and blob are decorative; the Continue/Skip
// buttons carry clear labels and are full-width, comfortably past 44pt.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronLeftIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  ButtonPrimary,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  StepProgress,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';

type Props = {
  step: number;
  total?: number;
  /** Optional short "why" line above the question (omit when the ask is enough). */
  purpose?: string;
  /** the question itself */
  ask: string;
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
  /** every step owns a color, so the run reads as a sequence, not a form */
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
};

export function OnboardingStep({
  step,
  total = 9,
  purpose,
  ask,
  children,
  cta = 'Continue',
  ctaDisabled,
  loading,
  onContinue,
  onSkip,
  onBack,
  accent = 'purple',
  continueAnalyticsId,
  skipAnalyticsId,
  skipLabel = 'Skip for now',
  footer,
  hideFooter,
  fillBody = true,
  scrollBody = false
}: Props) {
  const token = ACCENTS[accent];
  const theme = useThemeColors();

  // THIS SECTION DOES: decide whether the body fills the screen or scrolls.
  const bodyFills = fillBody && !scrollBody;

  return (
    <Screen tone="color" accent={token.tintSolid} className="flex-1">
      {/* a big soft shape in the step's color, behind everything */}
      <View
        aria-hidden
        pointerEvents="none"
        style={{
          position: 'absolute',
          right: -96,
          top: -112,
          height: 288,
          width: 288,
          borderTopLeftRadius: 999,
          borderTopRightRadius: 999,
          borderBottomRightRadius: 44,
          borderBottomLeftRadius: 999,
          opacity: 0.7
        }}
        className={token.tintSolid}
      />

      {/* back arrow (to fix an earlier answer) + the progress bar */}
      <View className="relative flex-row items-center gap-2 px-5 pb-1.5 pt-4">
        {onBack ? (
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-ink active:opacity-80"
          >
            <ChevronLeftIcon size={20} color={theme.canvas} strokeWidth={2.6} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <AnalyticsRegion analyticsId={ONBOARDING.chrome.progress_bar} interactive={false}>
            <StepProgress step={step} total={total} accent={accent} onColorWash />
          </AnalyticsRegion>
        </View>
      </View>

      <View className="relative px-5 pb-3 pt-3">
        {purpose ? (
          <View className={cn('self-start rounded-full px-3 py-1.5', token.bg)}>
            <Text className={cn('font-sans-b text-[12px] leading-snug', token.text)}>
              {purpose}
            </Text>
          </View>
        ) : null}
        <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
          <PixelHeading size="lg" className={cn(purpose ? 'mt-2.5' : undefined, 'text-onaccent')}>
            {ask}
          </PixelHeading>
        </AnalyticsRegion>
      </View>

      {bodyFills ? (
        <View className="min-h-0 flex-1">
          <ScreenBody tabBarInset={false} scrollEnabled={false} className="flex-1" padded={false}>
            <View className="min-h-0 flex-1 px-5">{children}</View>
          </ScreenBody>
        </View>
      ) : (
        <ScreenBody className="relative pb-4">{children}</ScreenBody>
      )}

      {hideFooter ? null : (
      <View className="relative gap-2.5 px-5 pb-6 pt-3">
        {footer ? (
          footer
        ) : onSkip ? (
          <>
            {/* flat solid CTA when there's also a skip, per Magic Patterns */}
            <ButtonSecondary
              full
              size="lg"
              tone="solid"
              loading={loading}
              disabled={ctaDisabled}
              analyticsId={continueAnalyticsId ?? ONBOARDING.chrome.continue}
              onPress={onContinue}
              accessibilityLabel={cta}
            >
              {cta}
            </ButtonSecondary>
            <ButtonSecondary
              full
              tone="ghost"
              onColorWash
              analyticsId={skipAnalyticsId ?? ONBOARDING.chrome.skip}
              onPress={onSkip}
              accessibilityLabel={skipLabel}
            >
              {skipLabel}
            </ButtonSecondary>
          </>
        ) : (
          // metallic CTA when Continue is the only choice on the screen
          <ButtonPrimary
            full
            loading={loading}
            disabled={ctaDisabled}
            analyticsId={continueAnalyticsId ?? ONBOARDING.chrome.continue}
            onPress={onContinue}
            accessibilityLabel={cta}
          >
            {cta}
          </ButtonPrimary>
        )}
      </View>
      )}
    </Screen>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The shared frame every onboarding screen sits in. One ask per screen: a
// colored canvas washed in the step's accent, a soft blob behind it, a step
// progress bar, a small "purpose" pill (the why), the big question, the step's
// body, and a Continue button (plus an optional "Skip for now"). Moving through
// onboarding should feel like walking through a set of colored rooms.
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
  withAnalyticsPress
} from '@bridger/ui';

type Props = {
  step: number;
  total?: number;
  /** the short "why" line above the question */
  purpose: string;
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
  footer
}: Props) {
  const token = ACCENTS[accent];

  return (
    <Screen tone="color" accent={token.tint}>
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
      <View className="relative flex-row items-center gap-2 px-5 pb-2 pt-5">
        {onBack ? (
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.chrome.back, onBack)}
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            className="h-9 w-9 items-center justify-center rounded-full bg-surface"
          >
            <ChevronLeftIcon size={20} color="#1C1B16" strokeWidth={2.6} />
          </Pressable>
        ) : null}
        <View className="flex-1">
          <AnalyticsRegion analyticsId={ONBOARDING.chrome.progress_bar} interactive={false}>
            <StepProgress step={step} total={total} accent={accent} />
          </AnalyticsRegion>
        </View>
      </View>

      <View className="relative px-5 pb-4 pt-4">
        <View className={cn('self-start rounded-full px-3 py-1.5', token.bg)}>
          <Text className={cn('font-sans-b text-[12px] leading-snug', token.text)}>
            {purpose}
          </Text>
        </View>
        <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
          <PixelHeading size="lg" className="mt-2.5">
            {ask}
          </PixelHeading>
        </AnalyticsRegion>
      </View>

      <ScreenBody className="relative pb-4">{children}</ScreenBody>

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
    </Screen>
  );
}

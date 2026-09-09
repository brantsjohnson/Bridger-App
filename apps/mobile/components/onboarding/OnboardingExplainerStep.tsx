// ============================================
// WHAT THIS FILE DOES (plain English):
// A New-onboarding teaching screen: one idea, a picture, and a Continue
// button (sometimes a second quieter button). Same chrome as the rest of
// onboarding.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { OnboardingStep } from './OnboardingStep';
import { OBCTA, OBSkipLink } from './onboarding-ui';
import { VisualSlot } from './tour/VisualSlot';
import type { CtaSpec } from './onboarding-new-copy';

export function OnboardingExplainerStep({
  step,
  total,
  chip,
  header,
  subheader,
  kicker,
  visualId,
  visualCaption,
  primaryCta,
  secondaryCta,
  onPrimary,
  onSecondary,
  onBack
}: {
  step: number;
  total: number;
  chip?: string;
  header: string;
  subheader?: string;
  kicker?: string;
  visualId?: string;
  visualCaption?: string;
  primaryCta: CtaSpec;
  secondaryCta?: CtaSpec;
  onPrimary: () => void;
  onSecondary?: () => void;
  onBack?: () => void;
}) {
  const footer = secondaryCta ? (
    <View style={{ gap: 10 }}>
      <OBCTA
        label={primaryCta.label}
        analyticsId={primaryCta.analyticsId}
        onPress={onPrimary}
        accessibilityLabel={primaryCta.label}
      />
      <OBSkipLink
        label={secondaryCta.label}
        analyticsId={secondaryCta.analyticsId}
        onPress={onSecondary ?? (() => undefined)}
      />
    </View>
  ) : undefined;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose={chip}
      ask={header}
      blurb={subheader}
      kicker={kicker}
      smallAsk
      scrollBody
      cta={primaryCta.label}
      continueAnalyticsId={primaryCta.analyticsId}
      onContinue={secondaryCta ? undefined : onPrimary}
      footer={footer}
      onBack={onBack}
    >
      <VisualSlot visualId={visualId} caption={visualCaption} />
    </OnboardingStep>
  );
}

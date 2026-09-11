// ============================================
// WHAT THIS FILE DOES (plain English):
// A New-onboarding teaching screen: one idea, a picture, and a Continue
// button (sometimes a second quieter button). Same chrome as the rest of
// onboarding. Continue always sprays emojis.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { newShellFromSpec } from './new-shell';
import { VisualSlot } from './tour/VisualSlot';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

export function OnboardingExplainerStep({
  spec,
  formStep,
  formTotal,
  visualCaption,
  lastInTour,
  onPrimary,
  onSecondary,
  onBack,
  children
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  visualCaption?: string;
  /** Last picked feature: CTA becomes the co-op handoff. */
  lastInTour?: boolean;
  onPrimary: () => void;
  onSecondary?: () => void;
  onBack?: () => void;
  children?: React.ReactNode;
}) {
  const shell = newShellFromSpec(spec, formStep, formTotal);
  const cta = lastInTour ? 'Why is Bridger different? →' : spec.primaryCta.label;

  return (
    <OnboardingStep
      {...shell}
      cta={cta}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onPrimary}
      onSkip={
        spec.secondaryCta
          ? onSecondary
          : undefined
      }
      skipLabel={spec.secondaryCta?.label}
      skipAnalyticsId={spec.secondaryCta?.analyticsId}
      onBack={onBack}
      headerNote={
        spec.infoNote ? (
          <OnboardingInfoNote label={spec.infoNote.label} body={spec.infoNote.body} />
        ) : undefined
      }
    >
      <View style={{ gap: 12 }}>
        {children ?? <VisualSlot visualId={spec.visualId} caption={visualCaption} />}
      </View>
    </OnboardingStep>
  );
}

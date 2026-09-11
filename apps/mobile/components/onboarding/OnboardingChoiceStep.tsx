// ============================================
// WHAT THIS FILE DOES (plain English):
// A New-onboarding screen where you tick one or more rows, then Continue.
// A row with an emoji sprays that emoji. Continue always sprays too.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ACCENT_HEX } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { OnboardingPickRow } from './OnboardingPickRow';
import { newShellFromSpec } from './new-shell';
import { CONCEPT } from './onboarding-new-flow';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

export function OnboardingChoiceStep({
  spec,
  formStep,
  formTotal,
  selectedIds,
  optionAnalyticsId,
  onToggle,
  onPrimary,
  onSecondary,
  onBack
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  selectedIds: string[];
  optionAnalyticsId: string;
  onToggle: (id: string) => void;
  onPrimary: () => void;
  onSecondary?: () => void;
  onBack?: () => void;
}) {
  const canContinue = spec.allowEmpty || selectedIds.length > 0;
  const shell = newShellFromSpec(spec, formStep, formTotal);
  const fill = ACCENT_HEX[CONCEPT[spec.concept].accent] ?? ACCENT_HEX.teal;

  return (
    <OnboardingStep
      {...shell}
      cta={spec.primaryCta.label}
      ctaDisabled={!canContinue}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onPrimary}
      onSkip={spec.secondaryCta ? onSecondary : undefined}
      skipLabel={spec.secondaryCta?.label}
      skipAnalyticsId={spec.secondaryCta?.analyticsId}
      onBack={onBack}
      headerNote={
        spec.infoNote ? (
          <OnboardingInfoNote label={spec.infoNote.label} body={spec.infoNote.body} />
        ) : undefined
      }
    >
      <View style={{ gap: 8 }}>
        {(spec.options ?? []).map((opt) => (
          <OnboardingPickRow
            key={opt.id}
            label={opt.label}
            sublabel={opt.sublabel}
            emoji={opt.emoji}
            selected={selectedIds.includes(opt.id)}
            fillColor={fill}
            analyticsId={optionAnalyticsId}
            analyticsProps={{ option: opt.id }}
            onPress={() => onToggle(opt.id)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// One question: your birthday. It uses the drill-down picker (year → month →
// day). Picking the day fills the answer and lets you continue. Skippable, and
// you can step back to fix it. PRIVACY: who can see this is chosen next, in the
// visibility step.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { BirthdayPicker } from './BirthdayPicker';

export function BirthdayStep({
  step,
  total,
  value,
  onChange,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends love a heads-up."
      ask="When's your birthday?"
      accent="teal"
      ctaDisabled={value.trim().length === 0}
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <BirthdayPicker
          value={value}
          onChange={onChange}
          onComplete={onNext}
          analyticsId={ONBOARDING.basics.answer}
        />
      </View>
    </OnboardingStep>
  );
}

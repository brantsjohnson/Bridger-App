// ============================================
// WHAT THIS FILE DOES (plain English):
// One question: your birthday. It uses the drill-down picker (year → month →
// day). Confirming "Yes, that's right" saves and moves on — no separate Continue.
// Required — no skip. PRIVACY: who can see this is chosen later in the privacy step.
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
  onBack
}: {
  step: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends love a heads-up."
      ask="When's your birthday?"
      accent="teal"
      fillBody
      scrollBody
      hideFooter
      onBack={onBack}
    >
      <View className="min-h-0 flex-1">
        <BirthdayPicker
          value={value}
          onChange={onChange}
          onComplete={onNext}
          onColorWash
          analyticsId={ONBOARDING.basics.answer}
        />
      </View>
    </OnboardingStep>
  );
}

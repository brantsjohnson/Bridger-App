// ============================================
// WHAT THIS FILE DOES (plain English):
// One question: your birthday. The screen shows the amber "Friends love a
// heads-up" tag, the big blue all-caps question, and then the drill-down picker
// (year, then month, then day). Confirming "Yes, that's right" inside the picker
// saves and moves on, which is why this screen hides the usual Continue button.
// Required, so there is no skip. PRIVACY: who can see this is chosen later in
// the privacy step.
//
// LOOK: the frame (tan paper, grid paper, back box, step bar, tag, heading) all
// comes from the shared onboarding parts. Everything below the question is the
// picker's own white square cells.
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
      // The picker is taller than a small phone, so this step is allowed to
      // scroll, and it confirms inside itself instead of using Continue.
      fillBody
      scrollBody
      hideFooter
      onBack={onBack}
    >
      <View style={{ flex: 1, minHeight: 0 }}>
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

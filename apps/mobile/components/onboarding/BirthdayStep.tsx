// ============================================
// WHAT THIS FILE DOES (plain English):
// One question: your birthday. New onboarding uses the copy-deck heading and a
// required * . Old onboarding still shows the amber "Friends love a heads-up"
// tag. Confirming "Yes, that's right" inside the picker saves and moves on,
// which is why this screen hides the usual Continue button. Required, so there
// is no skip. PRIVACY: who can see this is chosen later.
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
  onBack,
  ask,
  blurb,
  cta,
  continueAnalyticsId
}: {
  step: number;
  total: number;
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
  ask?: string;
  blurb?: string;
  cta?: string;
  continueAnalyticsId?: string;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose={ask ? undefined : 'Friends love a heads-up.'}
      ask={`${ask ?? "When's your birthday?"} *`}
      blurb={blurb}
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

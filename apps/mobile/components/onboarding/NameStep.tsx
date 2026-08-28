// ============================================
// WHAT THIS FILE DOES (plain English):
// The first thing we ask: your first and last name. That's it — no clever copy,
// just the name your friends already know you by. Continue stays disabled until
// both fields have something in them (name is the one required answer).
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { TextField } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

export function NameStep({
  step,
  total,
  first,
  last,
  onChangeFirst,
  onChangeLast,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  first: string;
  last: string;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const ready = first.trim().length > 0 && last.trim().length > 0;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="First, the basics."
      ask="What's your name?"
      accent="purple"
      ctaDisabled={!ready}
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-3">
        {/* Default labelTone uses text-ink so labels stay readable on dark canvas. */}
        <TextField
          label="First name"
          value={first}
          onChange={onChangeFirst}
          placeholder="Yo"
          analyticsId={ONBOARDING.name.first_input}
        />
        <TextField
          label="Last name"
          value={last}
          onChange={onChangeLast}
          placeholder="Mamma"
          analyticsId={ONBOARDING.name.last_input}
        />
      </View>
    </OnboardingStep>
  );
}

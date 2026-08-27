// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10A — "Right now." Two light text fields: what you do now, and the thing
// you'd love to do. Nothing is required; Skip moves on. These become profile
// facts (their audience is chosen later on the Privacy & Control screen).
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { TextField } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

export function RightNowStep({
  step,
  total,
  currentJob,
  dreamJob,
  onChangeCurrent,
  onChangeDream,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  currentJob: string;
  dreamJob: string;
  onChangeCurrent: (v: string) => void;
  onChangeDream: (v: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="What you're up to these days."
      ask="What do you do, and what would you love to do?"
      accent="blue"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <TextField
          labelTone="onaccent"
          label="Current job"
          value={currentJob}
          onChange={onChangeCurrent}
          placeholder="Barista, student, nurse..."
          analyticsId={ONBOARDING.taste.current_input}
        />
        <TextField
          labelTone="onaccent"
          label="Dream job"
          value={dreamJob}
          onChange={onChangeDream}
          placeholder="What you'd love to do"
          analyticsId={ONBOARDING.taste.dream_input}
        />
      </View>
    </OnboardingStep>
  );
}

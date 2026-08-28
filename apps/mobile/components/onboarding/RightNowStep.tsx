// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10A - "Right now." Two typing boxes: what you do now, and the thing you
// would love to do. Nothing is required; Skip moves on. These become profile
// facts (their audience is chosen later on the Privacy & Control screen).
//
// LOOK: the amber chip says "Let's have some fun!", the big question is the
// two job lines, a pink "change anytime" hint sits under it, then two white
// boxes with a hard navy outline. All the paint comes from the shared parts.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OBField } from './onboarding-ui';

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
      purpose="Let's have some fun!"
      ask={"What's your current job?\nWhat's your dream job?"}
      kicker="Change anytime. Always optional."
      smallAsk
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: the two answers, today's job and the dream one. */}
      <View style={{ gap: 20, paddingTop: 12 }}>
        <OBField
          label="Current job"
          value={currentJob}
          onChange={onChangeCurrent}
          placeholder="Barista, student, nurse..."
          analyticsId={ONBOARDING.taste.current_input}
        />
        <OBField
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

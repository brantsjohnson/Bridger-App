// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10A - "Right now." Two questions, each with its own typing box right
// under it: what you currently do, then what you dream to do. Nothing is
// required; Skip moves on. These become profile facts (their audience is chosen
// later on the Privacy & Control screen).
//
// LOOK: the amber chip says "Let's have some fun!", a pink "change anytime"
// hint sits under it, then each question as a big blue heading with its white
// box underneath. All the paint comes from the shared parts.
//
// KEYBOARD: Enter on the first box jumps to the dream box. Enter on the dream
// box moves forward (same as Continue). Long answers still wrap and grow.
// ============================================
import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion } from '@bridger/ui';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OBField, OBHeading, OBKicker } from './onboarding-ui';

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
  // THIS SECTION DOES: keep the typing box above the keyboard when focused.
  const { ensureVisible } = useOnboardingBodyScroll();
  // THIS SECTION DOES: let Enter on "currently do" land in the dream box.
  const dreamRef = useRef<TextInput>(null);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Let's have some fun!"
      // Questions live in the body so each one sits right above its field.
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
      scrollBody
    >
      {/* THIS SECTION DOES: two stacked asks. Current job first, dream job second. */}
      <View style={{ gap: 28, paddingTop: 4 }}>
        <OBKicker>Change anytime. Always optional.</OBKicker>

        {/* Current job: the question, then the typing box. */}
        <View style={{ gap: 12 }}>
          <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
            <OBHeading small>What do you currently do?</OBHeading>
          </AnalyticsRegion>
          <OBField
            value={currentJob}
            onChange={onChangeCurrent}
            placeholder="Barista, student, nurse..."
            analyticsId={ONBOARDING.taste.current_input}
            accessibilityLabel="What you currently do"
            multiline
            returnKeyType="next"
            onSubmitEditing={() => dreamRef.current?.focus()}
            onFocusExtra={(anchor) => ensureVisible(anchor)}
          />
        </View>

        {/* Dream: the question, then the typing box. */}
        <View style={{ gap: 12 }}>
          <AnalyticsRegion analyticsId={ONBOARDING.chrome.step_title} interactive={false}>
            <OBHeading small>If anything were possible, what would you do?</OBHeading>
          </AnalyticsRegion>
          <OBField
            value={dreamJob}
            onChange={onChangeDream}
            placeholder="What you'd love to do"
            analyticsId={ONBOARDING.taste.dream_input}
            accessibilityLabel="If anything were possible, what would you do"
            multiline
            inputRef={dreamRef}
            returnKeyType="go"
            onSubmitEditing={onNext}
            onFocusExtra={(anchor) => ensureVisible(anchor)}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// One required name screen: first name and last name together. Continue stays
// off until both boxes have a name. Enter on first name jumps to last name.
// ============================================
import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { newShellFromSpec } from './new-shell';
import { OBField } from './onboarding-ui';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

export function NameBothStep({
  spec,
  formStep,
  formTotal,
  first,
  last,
  onChangeFirst,
  onChangeLast,
  onNext,
  onBack
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  first: string;
  last: string;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const ready = first.trim().length > 0 && last.trim().length > 0;
  const shell = newShellFromSpec(spec, formStep, formTotal);

  return (
    <OnboardingStep
      {...shell}
      cta={spec.primaryCta.label}
      ctaDisabled={!ready}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onNext}
      onBack={onBack}
      headerNote={
        spec.infoNote ? (
          <OnboardingInfoNote label={spec.infoNote.label} body={spec.infoNote.body} />
        ) : undefined
      }
    >
      <NameFields
        first={first}
        last={last}
        onChangeFirst={onChangeFirst}
        onChangeLast={onChangeLast}
        onNext={onNext}
        ready={ready}
      />
    </OnboardingStep>
  );
}

function NameFields({
  first,
  last,
  onChangeFirst,
  onChangeLast,
  onNext,
  ready
}: {
  first: string;
  last: string;
  onChangeFirst: (v: string) => void;
  onChangeLast: (v: string) => void;
  onNext: () => void;
  ready: boolean;
}) {
  // THIS SECTION DOES: sit inside the step so the keyboard can scroll a box up.
  const { ensureVisible } = useOnboardingBodyScroll();
  const lastRef = useRef<TextInput>(null);
  return (
      <View style={{ gap: 12 }}>
        <OBField
          label="First name"
          required
          value={first}
          onChange={onChangeFirst}
          placeholder="Riley"
          autoCapitalize="words"
          analyticsId={ONBOARDING.name.first_input}
          accessibilityHint="Required"
          onFocusExtra={(anchor) => ensureVisible(anchor)}
          returnKeyType="next"
          blurOnSubmit={false}
          onSubmitEditing={() => lastRef.current?.focus()}
        />
        <OBField
          label="Last name"
          required
          value={last}
          onChange={onChangeLast}
          placeholder="Okafor"
          autoCapitalize="words"
          analyticsId={ONBOARDING.name.last_input}
          accessibilityHint="Required"
          onFocusExtra={(anchor) => ensureVisible(anchor)}
          inputRef={lastRef}
          returnKeyType="go"
          onSubmitEditing={() => {
            if (ready) onNext();
          }}
        />
      </View>
  );
}

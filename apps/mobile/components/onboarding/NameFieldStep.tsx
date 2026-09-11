// ============================================
// WHAT THIS FILE DOES (plain English):
// One required typing screen for first name or last name. Continue stays off
// until the box has a name. The * means required.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OBField } from './onboarding-ui';

export function NameFieldStep({
  step,
  total,
  which,
  header,
  subheader,
  value,
  ctaLabel,
  continueAnalyticsId,
  onChange,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  which: 'first' | 'last';
  header: string;
  subheader: string;
  value: string;
  ctaLabel: string;
  continueAnalyticsId: string;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const { ensureVisible } = useOnboardingBodyScroll();
  const ready = value.trim().length > 0;
  const label = which === 'first' ? 'First name' : 'Last name';
  const analyticsId =
    which === 'first' ? ONBOARDING.name.first_input : ONBOARDING.name.last_input;

  return (
    <OnboardingStep
      step={step}
      total={total}
      ask={header}
      blurb={subheader}
      cta={ctaLabel}
      ctaDisabled={!ready}
      continueAnalyticsId={continueAnalyticsId}
      onContinue={onNext}
      onBack={onBack}
    >
      <View>
        <OBField
          label={label}
          required
          value={value}
          onChange={onChange}
          placeholder={which === 'first' ? 'Jordan' : 'Lee'}
          autoCapitalize="words"
          analyticsId={analyticsId}
          accessibilityHint="Required"
          onFocusExtra={(anchor) => ensureVisible(anchor)}
          returnKeyType="go"
          onSubmitEditing={() => {
            if (ready) onNext();
          }}
        />
      </View>
    </OnboardingStep>
  );
}

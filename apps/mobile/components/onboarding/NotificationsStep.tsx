// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 9 - "What should we notify you about?" Six on/off rows, one per kind of
// reminder. Whatever you pick becomes your notification prefs; Settings later
// expands each one into fine-grained kinds. Skippable.
//
// LOOK: a stack of white rows on tan paper, each with a small switch on the
// right. When it is on, the track fills green and the knob stays white. All the
// paint comes from the shared onboarding parts.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { ONBOARDING, ONBOARDING_NOTIFICATION_GROUPS } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OBTile } from './onboarding-ui';

const PREFS = ONBOARDING_NOTIFICATION_GROUPS.map((g) => ({
  id: g.id,
  label: g.label
}));

export function NotificationsStep({
  step,
  total,
  picked,
  onToggle,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  picked: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Tech should help you stay close."
      ask="What should we notify you about?"
      blurb="Turn on only what matters to you."
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      {/* THIS SECTION DOES: one switch row per reminder type. */}
      <View style={{ gap: 9 }}>
        {PREFS.map((p) => (
          <OBTile
            key={p.id}
            label={p.label}
            variant="switch"
            selected={picked.includes(p.id)}
            analyticsId={ONBOARDING.notifications.pref}
            analyticsProps={{ pref: p.id }}
            onPress={() => onToggle(p.id)}
          />
        ))}
      </View>
    </OnboardingStep>
  );
}

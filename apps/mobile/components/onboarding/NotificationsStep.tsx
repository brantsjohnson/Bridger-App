// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 9 — "What should we notify you about?" Six on/off rows using the same
// Toggle the rest of the app uses (Settings → Notifications). Whatever you
// pick becomes your notification prefs; Settings later expands each into
// fine-grained kinds. Skippable.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING, ONBOARDING_NOTIFICATION_GROUPS } from '@bridger/shared';
import { ListRow, Toggle, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY } from './onboarding-wash';

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
      accent="amber"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <Text className={cn('px-1 font-sans-sb text-[14px] leading-snug', WASH_BODY)}>
          Turn on only what matters to you.
        </Text>

        {/* THIS SECTION DOES: one Toggle row per reminder type. */}
        <View className="gap-1.5">
          {PREFS.map((p) => {
            const on = picked.includes(p.id);
            return (
              <ListRow
                key={p.id}
                label={p.label}
                trailing="none"
                action={
                  <Toggle
                    checked={on}
                    onChange={() => onToggle(p.id)}
                    label={p.label}
                    analyticsId={ONBOARDING.notifications.pref}
                    analyticsProps={{ pref: p.id }}
                  />
                }
              />
            );
          })}
        </View>
      </View>
    </OnboardingStep>
  );
}

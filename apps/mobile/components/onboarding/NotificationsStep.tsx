// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 2 — "What should we nudge you about?" A multi-select of the few things
// worth a notification (close friends' updates, birthdays, big moments,
// events). Whatever they pick becomes their notification prefs. Skippable.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING, ONBOARDING_NOTIFICATION_GROUPS } from '@bridger/shared';
import { ACCENTS, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

/** Coarse chips — Settings expands each into individual kind toggles. */
const PREFS: Array<{ id: string; label: string; emoji: string; accent: Accent }> =
  ONBOARDING_NOTIFICATION_GROUPS.map((g, i) => ({
    id: g.id,
    label: g.label,
    emoji: (['💬', '🎂', '✨', '📅'] as const)[i] ?? '🔔',
    accent: (['purple', 'pink', 'amber', 'teal'] as const)[i] ?? 'amber'
  }));

const SHAPES = [
  { borderTopLeftRadius: 28, borderTopRightRadius: 10, borderBottomRightRadius: 28, borderBottomLeftRadius: 10 },
  { borderTopLeftRadius: 10, borderTopRightRadius: 28, borderBottomRightRadius: 10, borderBottomLeftRadius: 28 }
];

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
      ask="What should we nudge you about?"
      accent="amber"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="flex-row flex-wrap justify-between">
        {PREFS.map((p, i) => {
          const on = picked.includes(p.id);
          const token = ACCENTS[p.accent];
          return (
            <View key={p.id} className="mb-3 w-[48.5%]">
              <Pressable
                onPress={withAnalyticsPress(ONBOARDING.notifications.pref, () => onToggle(p.id))}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={p.label}
                style={SHAPES[i % 2]}
                className={cn(
                  'min-h-[92px] items-start gap-2 px-4 py-5',
                  on ? token.bg : 'border border-ink-line bg-surface'
                )}
              >
                <Text className="text-[26px]" accessible={false}>
                  {p.emoji}
                </Text>
                <Text
                  className={cn(
                    'font-sans-b text-[14px] leading-tight',
                    on ? token.text : 'text-ink'
                  )}
                >
                  {p.label}
                </Text>
                {on ? (
                  <View className="absolute right-3 top-3 h-5 w-5 items-center justify-center rounded-full bg-white">
                    <CheckIcon size={12} color="#1C1B16" strokeWidth={3.5} />
                  </View>
                ) : null}
              </Pressable>
            </View>
          );
        })}
      </View>
    </OnboardingStep>
  );
}

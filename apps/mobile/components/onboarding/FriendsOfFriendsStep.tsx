// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 7 — "Stop swiping to meet people." Bridger only ever introduces you to
// friends of friends, never strangers. Here you pick what you want those
// introductions to be based on: humor, values, personality, hobbies, or
// communication style. Checkbox rows plus "All of the above." Skippable.
//
// PRIVACY: these are opaque preference keys (never free text). They shape which
// friends-of-friends the matcher surfaces; they are not shown to other people.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY, WASH_MUTED } from './onboarding-wash';

/** The five ways to be matched. Keys are opaque; labels are what you see. */
export const CONNECTION_STYLES: Array<{ id: string; label: string }> = [
  { id: 'humor', label: 'Humor' },
  { id: 'values', label: 'Values' },
  { id: 'personality', label: 'Personality' },
  { id: 'hobbies', label: 'Hobbies' },
  { id: 'communication', label: 'Communication style' }
];

const ALL_IDS = CONNECTION_STYLES.map((s) => s.id);

export function FriendsOfFriendsStep({
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
  const allOn = ALL_IDS.every((id) => picked.includes(id));

  // THIS SECTION DOES: turn every style on, or clear them all.
  const toggleAll = () => {
    if (allOn) {
      for (const id of ALL_IDS) {
        if (picked.includes(id)) onToggle(id);
      }
    } else {
      for (const id of ALL_IDS) {
        if (!picked.includes(id)) onToggle(id);
      }
    }
  };

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Friends of your friends, never strangers."
      ask="Stop swiping to meet people"
      accent="green"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-3">
        <Text className={cn('px-1 font-sans-sb text-[14px] leading-snug', WASH_BODY)}>
          Bridger finds friends of friends you should know. What should we connect you on?
        </Text>
        <Text className={cn('px-1 font-sans-b text-[11px] uppercase tracking-wide', WASH_MUTED)}>
          Pick any that apply
        </Text>

        {/* THIS SECTION DOES: one checkbox row per matching style. */}
        <View className="gap-1.5">
          {CONNECTION_STYLES.map((s) => {
            const on = picked.includes(s.id);
            return (
              <CheckRow
                key={s.id}
                label={s.label}
                on={on}
                analyticsId={ONBOARDING.friends_of_friends.style}
                analyticsProps={{ style: s.id }}
                onPress={() => onToggle(s.id)}
              />
            );
          })}
          <CheckRow
            label="All of the above"
            on={allOn}
            analyticsId={ONBOARDING.friends_of_friends.all}
            onPress={toggleAll}
          />
        </View>
      </View>
    </OnboardingStep>
  );
}

/** One rounded checkbox row. */
function CheckRow({
  label,
  on,
  analyticsId,
  analyticsProps,
  onPress
}: {
  label: string;
  on: boolean;
  analyticsId: string;
  analyticsProps?: Record<string, string>;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { analyticsProps })}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: on }}
      accessibilityLabel={label}
      className={cn(
        'min-h-[48px] flex-row items-center gap-3 rounded-card border px-4',
        on ? 'border-teal bg-teal/15' : 'border-ink-line bg-surface'
      )}
    >
      <View
        className={cn(
          'h-5 w-5 items-center justify-center rounded-md border',
          on ? 'border-teal bg-teal' : 'border-ink-line bg-surface'
        )}
      >
        {on ? <CheckIcon size={12} color="#FFFFFF" strokeWidth={3.5} /> : null}
      </View>
      <Text className={cn('font-sans-sb text-[15px]', on ? 'text-onaccent' : 'text-ink')}>
        {label}
      </Text>
    </Pressable>
  );
}

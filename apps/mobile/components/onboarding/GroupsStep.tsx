// ============================================
// WHAT THIS FILE DOES (plain English):
// Before we ask anything personal, we teach the one idea that makes Bridger
// work: your people live in three circles — Close friends, Friends, and
// Acquaintances — and you decide what each circle sees. Then we nudge the most
// important first move: invite a best friend, because Bridger is empty (and
// useless) until someone you actually know is on it.
//
// The three circle cards are explanatory (not tappable). The only action here
// is "Invite a friend".
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { UserPlusIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, AnalyticsRegion, ButtonSecondary, Card, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY } from './onboarding-wash';

/** Each circle owns a color here and everywhere tiers appear later. */
const CIRCLES: { label: string; line: string; accent: Accent }[] = [
  { label: 'Close friends', line: 'The few you tell everything.', accent: 'pink' },
  { label: 'Friends', line: 'The people you actually know.', accent: 'blue' },
  { label: 'Acquaintances', line: 'Everyone else you have added.', accent: 'teal' }
];

export function GroupsStep({
  step,
  total,
  invited,
  onInvite,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  invited: boolean;
  onInvite: () => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Bridger only works with a friend on it."
      ask="Your people, in three circles"
      cta={invited ? 'Continue' : 'Do this later'}
      accent="blue"
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-4">
        {/* the three circles — explanatory, so they log dead-clicks */}
        <AnalyticsRegion analyticsId={ONBOARDING.groups.tier_card} interactive={false}>
          <View className="gap-2.5">
            {CIRCLES.map((c) => (
              <View
                key={c.label}
                className="flex-row items-center gap-3.5 rounded-card border border-ink-line bg-surface px-4 py-3"
              >
                <View
                  accessible={false}
                  className={cn('h-10 w-10 shrink-0 rounded-full', ACCENTS[c.accent].bg)}
                />
                <View className="min-w-0 flex-1">
                  <Text className="font-sans-b text-[14px] text-ink">{c.label}</Text>
                  <Text className="font-sans-sb text-[12px] text-ink-mute">{c.line}</Text>
                </View>
              </View>
            ))}
          </View>
        </AnalyticsRegion>

        <Text className={cn('px-1 font-sans-sb text-[13px] leading-snug', WASH_BODY)}>
          You decide what each circle sees. So invite a best friend to start —
          Bridger is empty until someone you know is here.
        </Text>

        <ButtonSecondary
          full
          size="lg"
          tone={invited ? 'positive' : 'solid'}
          icon={<UserPlusIcon size={18} strokeWidth={2.5} color="#FFFFFF" />}
          analyticsId={ONBOARDING.groups.invite}
          onPress={onInvite}
          accessibilityLabel="Invite a best friend"
        >
          {invited ? 'Invite sent' : 'Invite a friend to get access'}
        </ButtonSecondary>
      </View>
    </OnboardingStep>
  );
}

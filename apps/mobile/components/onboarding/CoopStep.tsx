// ============================================
// WHAT THIS FILE DOES (plain English):
// The sales moment: an invitation to join the co-op. It leads with the promise
// ("you're the member, not the product"), shows what membership unlocks as a
// quick grid of colorful cards (scannable, not a wall of text), states the
// honest price, and lets you pay the way you already pay: Apple Pay, Google Pay,
// or a card. "Use Free Limited Version" is always right there — never a paywall.
//
// PAYMENT: co-op membership is sold in-app. The live build must route these
// through the platform's in-app purchase where required (Apple/Google) and a
// card processor for the web (see CURSOR-RULES.md). Here the buttons are wired
// as demo intents only.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { CreditCardIcon } from 'lucide-react-native';
import type { Accent } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, ButtonSecondary, PixelHeading, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

/** What membership unlocks — shown as bright, scannable cards. */
const PERKS: { emoji: string; label: string; accent: Accent }[] = [
  { emoji: '🎨', label: 'A profile you decorate', accent: 'purple' },
  { emoji: '⭕', label: 'Bigger circles + custom groups', accent: 'pink' },
  { emoji: '🎥', label: 'Video updates and replies', accent: 'teal' },
  { emoji: '📼', label: 'Daily recaps, unlimited storage', accent: 'amber' }
];

export function CoopStep({
  step,
  total,
  onJoin,
  onUseFree,
  onBack
}: {
  step: number;
  total: number;
  onJoin: () => void;
  onUseFree: () => void;
  onBack: () => void;
}) {
  const footer = (
    <View className="gap-2.5">
      {/* Pay the way you already pay */}
      <ButtonSecondary
        full
        size="lg"
        tone="solid"
        analyticsId={ONBOARDING.coop.apple_pay}
        onPress={onJoin}
        accessibilityLabel="Join with Apple Pay"
      >
        Apple Pay
      </ButtonSecondary>
      <View className="flex-row gap-2.5">
        <View className="flex-1">
          <ButtonSecondary
            full
            size="lg"
            tone="outline"
            analyticsId={ONBOARDING.coop.google_pay}
            onPress={onJoin}
            accessibilityLabel="Join with Google Pay"
          >
            Google Pay
          </ButtonSecondary>
        </View>
        <View className="flex-1">
          <ButtonSecondary
            full
            size="lg"
            tone="outline"
            icon={<CreditCardIcon size={16} strokeWidth={2.5} />}
            analyticsId={ONBOARDING.coop.card}
            onPress={onJoin}
            accessibilityLabel="Join with a card"
          >
            Card
          </ButtonSecondary>
        </View>
      </View>
      <ButtonSecondary
        full
        tone="ghost"
        analyticsId={ONBOARDING.coop.use_free}
        onPress={onUseFree}
        accessibilityLabel="Use the free limited version"
      >
        Use Free Limited Version
      </ButtonSecondary>
    </View>
  );

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="A tool for you, not an ad machine."
      ask="Join the co-op"
      accent="coral"
      onBack={onBack}
      footer={footer}
    >
      <View className="gap-4">
        {/* the hook + the honest price, big and confident */}
        <View className="rounded-card bg-carbon px-5 py-5">
          <Text className="font-sans-b text-[15px] leading-snug text-white">
            Elsewhere you're the product. Here you're the member.
          </Text>
          <View className="mt-3 flex-row items-end gap-2">
            <PixelHeading size="lg" className="text-[38px] leading-none text-white">
              $24
            </PixelHeading>
            <Text className="mb-1 font-sans-b text-[14px] text-white/70">a year</Text>
          </View>
          <Text className="mt-1 font-sans-sb text-[12px] text-white/70">
            That's it. No ads. Never sold.
          </Text>
        </View>

        {/* what you unlock — bright cards, easy to scan */}
        <View className="flex-row flex-wrap justify-between">
          {PERKS.map((p) => {
            const token = ACCENTS[p.accent];
            return (
              <View key={p.label} className="mb-2.5 w-[48.5%]">
                <View className={cn('min-h-[92px] gap-2 rounded-card px-3.5 py-3.5', token.bg)}>
                  <Text className="text-[24px]" accessible={false}>
                    {p.emoji}
                  </Text>
                  <Text className={cn('font-sans-b text-[13px] leading-tight', token.text)}>
                    {p.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* the honest free line, so the choice is real */}
        <View className="rounded-card border border-ink-line bg-surface px-4 py-3">
          <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
            Free forever: meeting people, adding anyone, messages, and events. You never pay to
            connect.
          </Text>
        </View>
      </View>
    </OnboardingStep>
  );
}

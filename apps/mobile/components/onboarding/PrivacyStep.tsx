// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 1 — the trust screen. Before we ask a single question, we make three
// plain promises about privacy. It's an acknowledgment ("I understand"), not a
// form, so people start the run knowing their info is theirs.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, ColorCard, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';

const PROMISES: Array<{ emoji: string; text: string; accent: Accent }> = [
  { emoji: '🔒', text: 'You control all of it. Every field, every circle.', accent: 'blue' },
  { emoji: '🚫', text: 'Never sold. No ads, ever.', accent: 'coral' },
  { emoji: '🌉', text: 'Only used to connect you with people worth knowing.', accent: 'teal' }
];

export function PrivacyStep({
  step,
  total,
  onNext
}: {
  step: number;
  total: number;
  onNext: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Privacy is crucial, and it's yours."
      ask="How this works"
      cta="I understand"
      accent="blue"
      onContinue={onNext}
    >
      <View className="gap-3">
        {PROMISES.map((p) => (
          <ColorCard key={p.text} accent={p.accent} className="flex-row items-center gap-3.5">
            <View
              accessible={false}
              className="h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/25"
            >
              <Text className="text-[22px]">{p.emoji}</Text>
            </View>
            <Text
              className={cn(
                'min-w-0 flex-1 font-sans-b text-[14px] leading-snug',
                ACCENTS[p.accent].text
              )}
            >
              {p.text}
            </Text>
          </ColorCard>
        ))}
      </View>
    </OnboardingStep>
  );
}

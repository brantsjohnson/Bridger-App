// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10 — the little intro card before the fun, low-pressure questions (job,
// song, nights out, color, places, recap). It names what is coming up as a
// simple list, then one button: "Let's go." Everything after this is skippable.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, cn } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY, WASH_MUTED } from './onboarding-wash';

/** The playful things we are about to ask, as a preview list. */
const COMING_UP: { label: string; dot: string }[] = [
  { label: 'Current job', dot: '#FF3E8A' },
  { label: 'Dream job', dot: '#FFB515' },
  { label: 'Song on repeat', dot: '#00A676' },
  { label: 'Your color', dot: '#1D6FE8' },
  { label: 'Your places', dot: '#FF5A1F' },
  { label: 'Your weekly recap', dot: '#FF007F' }
];

export function TasteIntroStep({
  step,
  total,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="It got addictive. Let's try again."
      ask="A taste of Bridger"
      cta="Let's go"
      accent="coral"
      continueAnalyticsId={ONBOARDING.taste.start}
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-4">
        <Text className={cn('px-1 font-sans-sb text-[14px] leading-snug', WASH_BODY)}>
          Now a few questions to get us started. You can answer more once you are in the app to get
          more out of it.
        </Text>

        {/* THIS SECTION DOES: a non-tappable preview of what's coming next. */}
        <AnalyticsRegion analyticsId={ONBOARDING.taste.preview_list} interactive={false}>
          <View>
            <Text className={cn('mb-2 font-sans-b text-[11px] uppercase tracking-wide', WASH_MUTED)}>
              {"What's coming up"}
            </Text>
            <View>
              {COMING_UP.map((item, i) => (
                <View
                  key={item.label}
                  className={cn(
                    'flex-row items-center gap-3 py-3',
                    i < COMING_UP.length - 1 ? 'border-b border-ink-line/40' : undefined
                  )}
                >
                  <View
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: item.dot }}
                    accessible={false}
                  />
                  <Text className="font-sans-md text-[16px] text-onaccent">{item.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </AnalyticsRegion>
      </View>
    </OnboardingStep>
  );
}

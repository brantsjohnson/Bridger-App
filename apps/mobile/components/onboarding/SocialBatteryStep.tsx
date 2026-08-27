// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10C — "Social battery." In a normal week, how many nights do you like
// going out? A battery of seven cells that fill as you tap, plus "None,
// thanks." Skippable. This helps Bridger pace how often it nudges you toward
// plans; it is not shown to other people as a number.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_BODY } from './onboarding-wash';

const CELLS = [1, 2, 3, 4, 5, 6, 7];

function fillColor(nights: number): string {
  if (nights <= 2) return '#1D6FE8';
  if (nights <= 5) return '#FFB515';
  return '#6B2FEA';
}

export function SocialBatteryStep({
  step,
  total,
  nights,
  onPick,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  nights: number | null;
  onPick: (n: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const value = nights ?? 0;
  const label =
    value === 0
      ? 'No nights out'
      : value === 7
        ? '7+ nights a week'
        : value === 1
          ? '1 night a week'
          : `${value} nights a week`;
  const color = fillColor(value || 3);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="So we pace the nudges to you."
      ask="In a normal week, how many nights out feel good?"
      accent="teal"
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-4">
        <Text className={cn('px-1 font-sans-sb text-[14px] leading-snug', WASH_BODY)}>
          Tap your social battery. Fuller means more plans.
        </Text>

        {/* THIS SECTION DOES: the battery body with seven fillable cells. */}
        <View className="flex-row items-center gap-2">
          <View className="min-h-[88px] flex-1 flex-row gap-1.5 rounded-card border-2 border-blue bg-surface p-2">
            {CELLS.map((n) => {
              const filled = value >= n;
              const cellLabel = n === 7 ? '7+' : String(n);
              return (
                <Pressable
                  key={n}
                  onPress={withAnalyticsPress(ONBOARDING.taste.nights_option, () => onPick(n), {
                    analyticsProps: { nights: n }
                  })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: value === n }}
                  accessibilityLabel={`${cellLabel} nights`}
                  className="min-h-[44px] flex-1 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: filled ? color : 'rgba(28,27,22,0.08)'
                  }}
                >
                  <Text
                    className={cn(
                      'font-sans-b text-[15px]',
                      filled && value > 2 && value <= 5 ? 'text-ink' : filled ? 'text-white' : 'text-ink/50'
                    )}
                  >
                    {cellLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* battery nub */}
          <View className="h-8 w-2.5 rounded-r-md bg-blue" accessible={false} />
        </View>

        <View className="flex-row items-baseline justify-between">
          <Text className="font-pixel text-[22px] text-onaccent">{label}</Text>
          <Pressable
            onPress={withAnalyticsPress(ONBOARDING.taste.nights_option, () => onPick(0), {
              analyticsProps: { nights: 0 }
            })}
            accessibilityRole="button"
            accessibilityState={{ selected: value === 0 }}
            accessibilityLabel="None, thanks"
            className={cn(
              'rounded-full border px-3.5 py-2.5',
              value === 0 ? 'border-blue bg-blue' : 'border-ink-line bg-surface'
            )}
          >
            <Text
              className={cn(
                'font-sans-sb text-[13px]',
                value === 0 ? 'text-white' : 'text-ink'
              )}
            >
              None, thanks
            </Text>
          </Pressable>
        </View>
      </View>
    </OnboardingStep>
  );
}

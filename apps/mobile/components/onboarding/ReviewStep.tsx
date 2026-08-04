// ============================================
// WHAT THIS FILE DOES (plain English):
// The last question: who can see the two personal things we collected — your
// birthday and your city. The three circles were explained earlier; here you
// put each answer into one. Everything defaults to "Friends"; change it now or
// anytime later. This is where tiers go from explained to used.
// ============================================
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Accent, Tier } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, Card, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import type { VisibilityRow } from '../../data/onboarding';

/** Each circle owns a color here and everywhere else the tiers appear. */
const LEVELS: { id: Tier; short: string; accent: Accent }[] = [
  { id: 'close', short: 'Close', accent: 'pink' },
  { id: 'friend', short: 'Friends', accent: 'blue' },
  { id: 'acquaintance', short: 'All', accent: 'teal' }
];

/** Build the two review rows (birthday + city) from what they entered. */
export function buildReviewRows(birthday: string, city: string): VisibilityRow[] {
  return [
    { id: 'birthday', label: 'Birthday', value: birthday.trim() || 'Not set', tier: 'friend' as Tier },
    { id: 'city', label: 'City', value: city.trim() || 'Not set', tier: 'friend' as Tier }
  ];
}

export function ReviewStep({
  step,
  total,
  rows,
  birthday,
  city,
  onInit,
  onSetTier,
  onSetAll,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  rows: VisibilityRow[];
  birthday: string;
  city: string;
  onInit: (rows: VisibilityRow[]) => void;
  onSetTier: (id: string, tier: Tier) => void;
  onSetAll: (tier: Tier) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  // The first time we land here, seed the rows from what they told us.
  useEffect(() => {
    if (rows.length === 0) onInit(buildReviewRows(birthday, city));
  }, [rows.length, birthday, city, onInit]);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="You decide who sees what."
      ask="Who can see your birthday and city?"
      cta="Looks right"
      accent="blue"
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-3">
        <Card>
          <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
            Set to Friends for now. Change any of it, anytime. You'll build custom groups later.
          </Text>
        </Card>

        <View className="flex-row items-center gap-2">
          <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">Set all</Text>
          <View className="flex-row gap-1.5">
            {LEVELS.map((l) => (
              <Pressable
                key={l.id}
                onPress={withAnalyticsPress(ONBOARDING.review.set_all, () => onSetAll(l.id))}
                accessibilityRole="button"
                accessibilityLabel={`Set all to ${l.short}`}
                className={cn('rounded-full px-3 py-1', ACCENTS[l.accent].bg)}
              >
                <Text className={cn('font-sans-b text-[12px]', ACCENTS[l.accent].text)}>{l.short}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="gap-2">
          {rows.map((r) => (
            <View key={r.id} className="rounded-card border border-ink-line bg-surface px-4 py-3">
              <View className="flex-row items-baseline justify-between gap-3">
                <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                  {r.label}
                </Text>
                <Text numberOfLines={1} className="min-w-0 flex-1 text-right font-sans-sb text-[14px] text-ink">
                  {r.value}
                </Text>
              </View>

              <View
                className="mt-2 flex-row gap-1.5"
                accessibilityRole="radiogroup"
                accessibilityLabel={`Who sees ${r.label}`}
              >
                {LEVELS.map((l) => {
                  const on = r.tier === l.id;
                  return (
                    <View key={l.id} className="flex-1">
                      <Pressable
                        onPress={withAnalyticsPress(ONBOARDING.review.row_audience, () =>
                          onSetTier(r.id, l.id)
                        )}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${r.label}: ${l.short}`}
                        className={cn(
                          'items-center rounded-full px-2 py-1.5',
                          on ? cn(ACCENTS[l.accent].bg) : 'border border-ink-line bg-surface'
                        )}
                      >
                        <Text
                          className={cn(
                            'font-sans-b text-[12px]',
                            on ? ACCENTS[l.accent].text : 'text-ink-soft'
                          )}
                        >
                          {l.short}
                        </Text>
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </View>
      </View>
    </OnboardingStep>
  );
}

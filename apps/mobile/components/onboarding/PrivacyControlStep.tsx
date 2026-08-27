// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 11 — "Privacy & Control." The last question before joining: who can see
// each thing you shared (birthday, job, dream job, favorite place, song, weekly
// recap). Each row has an audience control (Inner Circle / Friends / Friends of
// Friends) plus a "set all." Everything defaults to Friends. A legal footer
// links the Terms and Privacy Policy you agree to by continuing.
//
// PRIVACY (load-bearing): this is where the tier model goes from explained to
// used. The chosen audience is stored per answer (visibleToTier).
// ============================================
import React, { useEffect } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Accent, Tier } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { ACCENTS, Card, cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_CAPTION, WASH_LINK, WASH_MUTED } from './onboarding-wash';
import type { VisibilityRow } from '../../data/onboarding';

/** The three circles, with the words the spec asks for. */
const LEVELS: { id: Tier; short: string; full: string; accent: Accent }[] = [
  { id: 'close', short: 'Inner', full: 'Inner Circle', accent: 'pink' },
  { id: 'friend', short: 'Friends', full: 'Friends', accent: 'blue' },
  { id: 'acquaintance', short: 'FoF', full: 'Friends of Friends', accent: 'teal' }
];

export function PrivacyControlStep({
  step,
  total,
  rows,
  onInit,
  onSetTier,
  onSetAll,
  onNext,
  onBack,
  onOpenTerms,
  onOpenPrivacy
}: {
  step: number;
  total: number;
  rows: VisibilityRow[];
  onInit: () => void;
  onSetTier: (id: string, tier: Tier) => void;
  onSetAll: (tier: Tier) => void;
  onNext: () => void;
  onBack: () => void;
  onOpenTerms: () => void;
  onOpenPrivacy: () => void;
}) {
  // The first time we land here, seed the rows from what they told us.
  useEffect(() => {
    if (rows.length === 0) onInit();
  }, [rows.length, onInit]);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="It controlled us. Let's try again."
      ask="You choose who sees your info"
      cta="Continue"
      accent="blue"
      onContinue={onNext}
      onBack={onBack}
    >
      <View className="gap-3">
        <Card>
          <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
            Set to Friends for now. Change any of it, anytime.
          </Text>
        </Card>

        {/* SET ALL: one tap to apply a circle to every row. */}
        <View className="flex-row flex-wrap items-center gap-2">
          <Text className={cn('font-sans-b text-[12px] uppercase tracking-wide', WASH_MUTED)}>Set all</Text>
          <View className="flex-row gap-1.5">
            {LEVELS.map((l) => (
              <Pressable
                key={l.id}
                onPress={withAnalyticsPress(ONBOARDING.review.set_all, () => onSetAll(l.id), {
                  analyticsProps: { tier: l.id }
                })}
                accessibilityRole="button"
                accessibilityLabel={`Set all to ${l.full}`}
                className={cn('rounded-full px-3 py-1', ACCENTS[l.accent].bg)}
              >
                <Text className={cn('font-sans-b text-[12px]', ACCENTS[l.accent].text)}>{l.short}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* THE ROWS: one per thing shared, each with its own audience. */}
        <View className="gap-2">
          {rows.map((r) => (
            <View key={r.id} className="rounded-card border border-ink-line bg-surface px-4 py-3">
              <View className="flex-row items-baseline justify-between gap-3">
                <Text className="font-sans-b text-[12px] uppercase tracking-wide text-ink-mute">
                  {r.label}
                </Text>
                <Text numberOfLines={1} className="min-w-0 flex-1 text-right font-sans-sb text-[13px] text-ink">
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
                        onPress={withAnalyticsPress(ONBOARDING.review.row_audience, () => onSetTier(r.id, l.id), {
                          analyticsProps: { field: r.id, tier: l.id }
                        })}
                        accessibilityRole="button"
                        accessibilityState={{ selected: on }}
                        accessibilityLabel={`${r.label}: ${l.full}`}
                        className={cn(
                          'items-center rounded-full px-2 py-1.5',
                          on ? cn(ACCENTS[l.accent].bg) : 'border border-ink-line bg-surface'
                        )}
                      >
                        <Text
                          className={cn(
                            'font-sans-b text-[11px]',
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

        {/* LEGAL: what you agree to by continuing. */}
        <Text className={cn('px-1 font-sans-sb text-[12px] leading-snug', WASH_CAPTION)}>
          By continuing, you agree to our{' '}
          <Text
            className={cn('font-sans-b', WASH_LINK)}
            accessibilityRole="link"
            onPress={withAnalyticsPress(ONBOARDING.review.terms, onOpenTerms)}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            className={cn('font-sans-b', WASH_LINK)}
            accessibilityRole="link"
            onPress={withAnalyticsPress(ONBOARDING.review.privacy_policy, onOpenPrivacy)}
          >
            Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </OnboardingStep>
  );
}

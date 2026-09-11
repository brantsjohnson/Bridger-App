// ============================================
// WHAT THIS FILE DOES (plain English):
// Member benefits list. See more opens two extra rows that jump to a short
// explainer. No ads is not listed here, because everyone gets that.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, withAnalyticsPress } from '@bridger/ui';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { OnboardingStep } from './OnboardingStep';
import { newShellFromSpec } from './new-shell';
import { OB } from './onboarding-theme';
import type { NewOnboardingStepKey, OnboardingScreenSpec } from './onboarding-new-copy';

const BENEFITS = [
  { label: 'Voting', emoji: '🗳️' },
  { label: 'Custom groups', emoji: '👥' },
  { label: 'Member-only features', emoji: '✨' }
];

export function CoopBenefitsStep({
  spec,
  formStep,
  formTotal,
  onNext,
  onBack,
  onDetail
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  onNext: () => void;
  onBack?: () => void;
  onDetail: (step: NewOnboardingStepKey) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shell = newShellFromSpec(spec, formStep, formTotal);

  return (
    <OnboardingStep
      {...shell}
      cta={spec.primaryCta.label}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onNext}
      onBack={onBack}
      headerNote={
        spec.infoNote ? (
          <OnboardingInfoNote label={spec.infoNote.label} body={spec.infoNote.body} />
        ) : undefined
      }
    >
      <View style={{ gap: 8 }}>
        {BENEFITS.map((b) => (
          <AnalyticsRegion
            key={b.label}
            analyticsId={ONBOARDING.coop.visual}
            interactive={false}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                backgroundColor: OB.canvas,
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18 }}>{b.emoji}</Text>
              <Text className="font-sans-b text-[14px]" style={{ color: OB.navy }}>
                {b.label}
              </Text>
            </View>
          </AnalyticsRegion>
        ))}

        {expanded ? (
          <>
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.coop.benefit_support, () =>
                onDetail('coop-support')
              )}
              accessibilityRole="button"
              accessibilityLabel="Priority support"
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                backgroundColor: OB.canvas,
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18 }}>💬</Text>
              <Text className="flex-1 font-sans-b text-[14px]" style={{ color: OB.navy }}>
                Priority support
              </Text>
              <Text className="font-sans-b text-[13px]" style={{ color: OB.inkSoft }}>
                →
              </Text>
            </Pressable>
            <Pressable
              onPress={withAnalyticsPress(ONBOARDING.coop.benefit_early, () =>
                onDetail('coop-early')
              )}
              accessibilityRole="button"
              accessibilityLabel="Early access to new features"
              style={{
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                borderRadius: 16,
                backgroundColor: OB.canvas,
                paddingHorizontal: 16,
                paddingVertical: 12
              }}
            >
              <Text style={{ fontSize: 18 }}>🧪</Text>
              <Text className="flex-1 font-sans-b text-[14px]" style={{ color: OB.navy }}>
                Early access to new features
              </Text>
              <Text className="font-sans-b text-[13px]" style={{ color: OB.inkSoft }}>
                →
              </Text>
            </Pressable>
          </>
        ) : null}

        <Pressable
          onPress={withAnalyticsPress(ONBOARDING.coop.see_more_benefits, () =>
            setExpanded((e) => !e)
          )}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Fewer features' : 'See more features'}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 4
          }}
        >
          <Text className="font-sans-b text-[13px]" style={{ color: OB.navy }}>
            {expanded ? 'Fewer features' : 'See more features'}
          </Text>
          <ChevronDownIcon
            size={16}
            color={OB.navy}
            strokeWidth={3}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </Pressable>
      </View>
    </OnboardingStep>
  );
}

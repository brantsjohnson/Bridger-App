// ============================================
// WHAT THIS FILE DOES (plain English):
// Who can see your birthday. Groups nest: picking Friends also ticks Close
// Friends and Only Me. The row color never changes. Only the check fills.
// User-facing word is Groups, never circles or tiers.
//
// PRIVACY: we store an opaque group key (none / close / friend / acquaintance).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import type { Tier } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { newShellFromSpec } from './new-shell';
import { INFO } from './onboarding-new-flow';
import { OB, OB_RADIUS } from './onboarding-theme';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

const ORDER: Tier[] = ['none', 'close', 'friend', 'acquaintance'];

export function OnboardingPrivacyPickerStep({
  spec,
  formStep,
  formTotal,
  value,
  onChange,
  onPrimary,
  onBack
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  value: Tier | null;
  onChange: (tier: Tier) => void;
  onPrimary: () => void;
  onBack?: () => void;
}) {
  const shell = newShellFromSpec(spec, formStep, formTotal);
  const pickedIndex = value ? ORDER.indexOf(value) : -1;

  return (
    <OnboardingStep
      {...shell}
      cta={spec.primaryCta.label}
      ctaDisabled={!value}
      ctaNote={spec.ctaNote}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onPrimary}
      onBack={onBack}
      headerNote={
        <OnboardingInfoNote label="How privacy works" body={INFO.privacy} />
      }
    >
      <View style={{ gap: 8 }} accessibilityRole="radiogroup">
        {(spec.options ?? []).map((opt, i) => {
          const ticked = pickedIndex >= 0 && i <= pickedIndex;
          const active = value === opt.id;
          return (
            <Pressable
              key={opt.id}
              onPress={withAnalyticsPress(ONBOARDING.privacy.group_option, () =>
                onChange(opt.id as Tier)
              , { analyticsProps: { option: opt.id } })}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={
                opt.sublabel ? `${opt.label}. ${opt.sublabel}` : opt.label
              }
              style={{
                minHeight: 52,
                flexDirection: 'row',
                alignItems: 'center',
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                backgroundColor: '#FFFFFF',
                borderWidth: 0,
                borderRadius: OB_RADIUS
              }}
            >
              <View
                accessible={false}
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  borderWidth: 2,
                  borderColor: ticked ? OB.blue : 'rgba(28,27,22,0.25)',
                  backgroundColor: ticked ? OB.blue : '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {ticked ? <CheckIcon size={14} color="#FFFFFF" strokeWidth={3.5} /> : null}
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text className="font-sans-b text-[15px]" style={{ color: OB.navy }}>
                  {opt.label}
                </Text>
                {opt.sublabel ? (
                  <Text className="font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
                    {opt.sublabel}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
        {!value ? (
          <Text
            className="pt-1 text-center font-sans-b text-[13px]"
            style={{ color: OB.inkSoft }}
          >
            Choose one to continue
          </Text>
        ) : null}
      </View>
    </OnboardingStep>
  );
}

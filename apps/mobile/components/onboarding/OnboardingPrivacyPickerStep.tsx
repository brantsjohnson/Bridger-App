// ============================================
// WHAT THIS FILE DOES (plain English):
// The birthday privacy picker. You pick Close Friends, Friends, or
// Acquaintances. That choice becomes the audience for your birthday.
// User-facing word is Groups, never circles or tiers.
//
// PRIVACY: we store an opaque group key (close / friend / acquaintance), never
// a list of names.
// ============================================
import React from 'react';
import { View } from 'react-native';
import type { Tier } from '@bridger/shared';
import { ONBOARDING } from '@bridger/shared';
import { OnboardingStep } from './OnboardingStep';
import { OBCTA, OBTile } from './onboarding-ui';
import { VisualSlot } from './tour/VisualSlot';
import type { CtaSpec, OnboardingChoiceOption } from './onboarding-new-copy';

const TIER_LABEL: Record<string, string> = {
  close: 'Close Friends',
  friend: 'Friends',
  acquaintance: 'Acquaintances'
};

export function OnboardingPrivacyPickerStep({
  step,
  total,
  chip,
  header,
  subheader,
  visualId,
  options,
  value,
  primaryCta,
  onChange,
  onPrimary,
  onBack
}: {
  step: number;
  total: number;
  chip?: string;
  header: string;
  subheader?: string;
  visualId?: string;
  options: OnboardingChoiceOption[];
  value: Tier | null;
  primaryCta: CtaSpec;
  onChange: (tier: Tier) => void;
  onPrimary: () => void;
  onBack?: () => void;
}) {
  const caption = value ? `Visible to ${TIER_LABEL[value] ?? value}` : undefined;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose={chip}
      ask={header}
      blurb={subheader}
      smallAsk
      scrollBody
      footer={
        <OBCTA
          label={primaryCta.label}
          analyticsId={primaryCta.analyticsId}
          onPress={onPrimary}
          disabled={!value}
          accessibilityLabel={primaryCta.label}
        />
      }
      onBack={onBack}
    >
      <View style={{ gap: 12 }}>
        <VisualSlot visualId={visualId} caption={caption} />
        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const selected = value === opt.id;
            return (
              <OBTile
                key={opt.id}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={selected}
                variant="plain"
                mark={selected ? '✓' : undefined}
                analyticsId={ONBOARDING.privacy.group_option}
                analyticsProps={{ option: opt.id }}
                onPress={() => onChange(opt.id as Tier)}
                accessibilityLabel={
                  opt.sublabel ? `${opt.label}. ${opt.sublabel}` : opt.label
                }
              />
            );
          })}
        </View>
      </View>
    </OnboardingStep>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// A New-onboarding screen where you tick one or more rows, then Continue.
// Multi-select uses checkboxes. Single-select uses a plain row with a mark.
// ============================================
import React from 'react';
import { View } from 'react-native';
import { OnboardingStep } from './OnboardingStep';
import { OBCTA, OBSkipLink, OBTile } from './onboarding-ui';
import { VisualSlot } from './tour/VisualSlot';
import type { CtaSpec, OnboardingChoiceOption } from './onboarding-new-copy';

export function OnboardingChoiceStep({
  step,
  total,
  chip,
  header,
  subheader,
  kicker,
  visualId,
  options,
  selectedIds,
  multiSelect,
  allowEmpty,
  optionAnalyticsId,
  primaryCta,
  secondaryCta,
  onToggle,
  onPrimary,
  onSecondary,
  onBack
}: {
  step: number;
  total: number;
  chip?: string;
  header: string;
  subheader?: string;
  kicker?: string;
  visualId?: string;
  options: OnboardingChoiceOption[];
  selectedIds: string[];
  multiSelect?: boolean;
  allowEmpty?: boolean;
  optionAnalyticsId: string;
  primaryCta: CtaSpec;
  secondaryCta?: CtaSpec;
  onToggle: (id: string) => void;
  onPrimary: () => void;
  onSecondary?: () => void;
  onBack?: () => void;
}) {
  const canContinue = allowEmpty || selectedIds.length > 0;

  const footer = (
    <View style={{ gap: 10 }}>
      <OBCTA
        label={primaryCta.label}
        analyticsId={primaryCta.analyticsId}
        onPress={onPrimary}
        disabled={!canContinue}
        accessibilityLabel={primaryCta.label}
      />
      {secondaryCta ? (
        <OBSkipLink
          label={secondaryCta.label}
          analyticsId={secondaryCta.analyticsId}
          onPress={onSecondary ?? (() => undefined)}
        />
      ) : null}
    </View>
  );

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose={chip}
      ask={header}
      blurb={subheader}
      kicker={kicker}
      smallAsk
      scrollBody
      footer={footer}
      onBack={onBack}
    >
      <View style={{ gap: 12 }}>
        <VisualSlot visualId={visualId} />
        <View style={{ gap: 8 }}>
          {options.map((opt) => {
            const selected = selectedIds.includes(opt.id);
            return (
              <OBTile
                key={opt.id}
                label={opt.label}
                sublabel={opt.sublabel}
                selected={selected}
                variant={multiSelect ? 'checkbox' : 'plain'}
                mark={!multiSelect && selected ? '✓' : undefined}
                analyticsId={optionAnalyticsId}
                analyticsProps={{ option: opt.id }}
                onPress={() => onToggle(opt.id)}
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

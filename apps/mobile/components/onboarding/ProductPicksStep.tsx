// ============================================
// WHAT THIS FILE DOES (plain English):
// "What do you want Bridger to help you with?" Four main rows, then See more
// for the rest. Each emoji row sprays that emoji. You must pick at least one.
// ============================================
import React, { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ChevronDownIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { ACCENT_HEX, withAnalyticsPress } from '@bridger/ui';
import { FEATURES } from './onboarding-new-flow';
import { OnboardingInfoNote } from './OnboardingInfoNote';
import { OnboardingPickRow } from './OnboardingPickRow';
import { OnboardingStep } from './OnboardingStep';
import { newShellFromSpec } from './new-shell';
import type { OnboardingScreenSpec } from './onboarding-new-copy';

export function ProductPicksStep({
  spec,
  formStep,
  formTotal,
  selectedIds,
  onToggle,
  onNext,
  onBack
}: {
  spec: OnboardingScreenSpec;
  formStep: number;
  formTotal: number;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
  onBack?: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? FEATURES : FEATURES.filter((f) => !f.more);
  const shell = newShellFromSpec(spec, formStep, formTotal);

  return (
    <OnboardingStep
      {...shell}
      cta={spec.primaryCta.label}
      ctaDisabled={selectedIds.length === 0}
      continueAnalyticsId={spec.primaryCta.analyticsId}
      onContinue={onNext}
      onBack={onBack}
      headerNote={
        spec.infoNote ? (
          <OnboardingInfoNote label={spec.infoNote.label} body={spec.infoNote.body} />
        ) : undefined
      }
    >
      <View style={{ gap: 12 }}>
        {shown.map((f) => (
          <OnboardingPickRow
            key={f.id}
            label={f.chip}
            emoji={f.emoji}
            selected={selectedIds.includes(f.id)}
            fillColor={ACCENT_HEX.purple}
            analyticsId={ONBOARDING.product.option}
            analyticsProps={{ option: f.id }}
            onPress={() => onToggle(f.id)}
          />
        ))}
        <Pressable
          onPress={withAnalyticsPress(ONBOARDING.product.see_more, () =>
            setExpanded((e) => !e)
          )}
          accessibilityRole="button"
          accessibilityState={{ expanded }}
          accessibilityLabel={expanded ? 'Fewer features' : 'See more features'}
          style={{
            minHeight: 44,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4
          }}
        >
          <Text className="font-sans-b text-[13px]" style={{ color: ACCENT_HEX.purple }}>
            {expanded ? 'Fewer features' : 'See more features'}
          </Text>
          <ChevronDownIcon
            size={16}
            color={ACCENT_HEX.purple}
            strokeWidth={3}
            style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}
          />
        </Pressable>
      </View>
    </OnboardingStep>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// A short story card. It can tap-to-advance, and it can auto-advance after a
// few seconds. If the phone asks for reduced motion, we never auto-advance
// and we always show the button.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Pressable, View } from 'react-native';
import { useReduceMotion } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OBCTA } from './onboarding-ui';
import { VisualSlot } from './tour/VisualSlot';
import type { CtaSpec } from './onboarding-new-copy';

export function OnboardingStoryCard({
  step,
  total,
  chip,
  header,
  subheader,
  visualId,
  visualCaption,
  autoAdvanceMs,
  primaryCta,
  onPrimary,
  onBack
}: {
  step: number;
  total: number;
  chip?: string;
  header: string;
  subheader?: string;
  visualId?: string;
  visualCaption?: string;
  autoAdvanceMs?: number;
  primaryCta: CtaSpec;
  onPrimary: () => void;
  onBack?: () => void;
}) {
  const reduce = useReduceMotion();
  const fired = useRef(false);
  const onPrimaryRef = useRef(onPrimary);
  onPrimaryRef.current = onPrimary;

  // THIS SECTION DOES: auto-advance only when motion is allowed.
  useEffect(() => {
    if (reduce || !autoAdvanceMs) return;
    fired.current = false;
    const t = setTimeout(() => {
      if (fired.current) return;
      fired.current = true;
      onPrimaryRef.current();
    }, autoAdvanceMs);
    return () => clearTimeout(t);
  }, [autoAdvanceMs, reduce]);

  const go = () => {
    if (fired.current) return;
    fired.current = true;
    onPrimaryRef.current();
  };

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
          onPress={go}
          accessibilityLabel={primaryCta.label}
        />
      }
      onBack={onBack}
    >
      <Pressable
        onPress={go}
        accessibilityRole="button"
        accessibilityLabel={primaryCta.label}
        // Tap-to-advance uses the same id as the CTA so we do not invent a synonym.
        accessibilityHint="Advances to the next screen"
      >
        <View pointerEvents="none">
          <VisualSlot visualId={visualId} caption={visualCaption} />
        </View>
      </Pressable>
    </OnboardingStep>
  );
}

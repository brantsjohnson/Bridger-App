// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 11, "Privacy & Control." The last question before joining: who can see
// each thing you shared (birthday, job, dream job, favorite place, song, weekly
// recap). Each row has an audience control (Close / Friends / Acquaintances)
// plus a "set all" that paints every row the same. Everything defaults to
// Friends. A legal footer links the Terms and Privacy Policy you agree to by
// continuing.
//
// LOOK: each shared item is a white box with a hard navy outline, and the
// audience you picked is a solid filled square on the right of that box. All the
// paint comes from the shared onboarding parts.
//
// PRIVACY (load-bearing): this is where the tier model goes from explained to
// used. The chosen audience is stored per answer (visibleToTier).
// ============================================
import React, { useEffect, useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Tier } from '@bridger/shared';
import { ONBOARDING, TIER_LABEL } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import type { VisibilityRow } from '../../data/onboarding';

/** The three circles, labeled the way Bridger names them everywhere else. */
const LEVELS: { id: Exclude<Tier, 'none'>; label: string }[] = [
  { id: 'close', label: TIER_LABEL.close },
  { id: 'friend', label: TIER_LABEL.friend },
  { id: 'acquaintance', label: TIER_LABEL.acquaintance }
];

/**
 * One small square in a row of audience choices. Picked means a solid blue
 * square with light type; not picked means a white square with blue type. The
 * screen reader is told which one is selected, so it never depends on color.
 */
function AudienceSquare({
  label,
  selected,
  onPress,
  accessibilityLabel,
  analyticsId,
  analyticsProps
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel: string;
  analyticsId: string;
  analyticsProps?: Record<string, string | number | boolean | undefined>;
}) {
  return (
    <Pressable
      onPress={withAnalyticsPress(analyticsId, onPress, { analyticsProps })}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={{
        minHeight: 44,
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 6,
        paddingVertical: 10,
        backgroundColor: selected ? OB.blue : OB.paper,
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      <Text
        className="font-sans-sb text-[11px]"
        style={{ color: selected ? OB.onColor : OB.navy, textAlign: 'center' }}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

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

  // Which "Set all" square lights up: only when every row shares that tier.
  const setAllSelected = useMemo(() => {
    if (rows.length === 0) return null;
    const first = rows[0]?.tier;
    if (!first || first === 'none') return null;
    return rows.every((r) => r.tier === first) ? first : null;
  }, [rows]);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Privacy First"
      ask="You choose who sees your info"
      blurb="Set to Friends for now. Change any of it, anytime."
      cta="Continue"
      smallAsk
      scrollBody
      onContinue={onNext}
      onBack={onBack}
    >
      <View style={{ gap: 14 }}>
        {/* SET ALL: one tap to apply the same circle to every row below. The
            lit square matches the shared tier so you can see it worked. */}
        <View style={{ gap: 8 }}>
          <Text
            className="font-sans-sb text-[12px]"
            style={{ letterSpacing: 0.6, color: OB.navy }}
          >
            Set all
          </Text>
          <View
            style={{ flexDirection: 'row', gap: 6 }}
            accessibilityRole="radiogroup"
            accessibilityLabel="Set all rows to one audience"
          >
            {LEVELS.map((l) => (
              <AudienceSquare
                key={l.id}
                label={l.label}
                selected={setAllSelected === l.id}
                onPress={() => onSetAll(l.id)}
                accessibilityLabel={`Set all to ${l.label}`}
                analyticsId={ONBOARDING.review.set_all}
                analyticsProps={{ tier: l.id }}
              />
            ))}
          </View>
        </View>

        {/* THE ROWS: one white box per thing shared, each with its own audience. */}
        <View style={{ gap: 8 }}>
          {rows.map((r) => (
            <View
              key={r.id}
              style={{
                gap: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                backgroundColor: OB.paper,
                borderWidth: OB_BORDER,
                borderColor: OB.borderMuted
              }}
            >
              <View style={{ minWidth: 0 }}>
                <Text className="font-sans-sb text-[15px]" style={{ color: OB.ink }}>
                  {r.label}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[12px]"
                  style={{ color: 'rgba(0,0,0,0.5)' }}
                >
                  {r.value}
                </Text>
              </View>

              <View
                style={{ flexDirection: 'row', gap: 6 }}
                accessibilityRole="radiogroup"
                accessibilityLabel={`Who sees ${r.label}`}
              >
                {LEVELS.map((l) => (
                  <AudienceSquare
                    key={l.id}
                    label={l.label}
                    selected={r.tier === l.id}
                    onPress={() => onSetTier(r.id, l.id)}
                    accessibilityLabel={`${r.label}: ${l.label}`}
                    analyticsId={ONBOARDING.review.row_audience}
                    analyticsProps={{ field: r.id, tier: l.id }}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>

        {/* LEGAL: what you agree to by continuing. */}
        <Text style={{ fontSize: 11.5, lineHeight: 18, color: 'rgba(0,0,0,0.55)' }}>
          By continuing, you agree to our{' '}
          <Text
            className="font-sans-b"
            style={{ color: OB.blue, textDecorationLine: 'underline' }}
            accessibilityRole="link"
            onPress={withAnalyticsPress(ONBOARDING.review.terms, onOpenTerms)}
          >
            Terms of Service
          </Text>{' '}
          and{' '}
          <Text
            className="font-sans-b"
            style={{ color: OB.blue, textDecorationLine: 'underline' }}
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

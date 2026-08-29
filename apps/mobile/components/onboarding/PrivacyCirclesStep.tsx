// ============================================
// WHAT THIS FILE DOES (plain English):
// The screen right before "who sees what." It teaches the three friend
// circles (Close, Friends, Acquaintances): what each means and how many
// people fit, using Free Lite caps (5 / 30 / unlimited). Co-op can raise
// Close and Friends later. The animated padlock sits beside the blurb so
// this reads as a privacy beat, not just a list.
//
// PRIVACY (load-bearing): people learn the tier model here before they
// pick an audience for each answer on the next screen.
//
// LOOK: same square paper cards and hard outlines as the rest of onboarding.
// The three cards are explanatory only (dead_click), not tappable choices.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { FREE_BENEFITS, ONBOARDING, TIER_LABEL } from '@bridger/shared';
import { ACCENT_HEX, AnalyticsRegion, useThemeColors } from '@bridger/ui';
import { ProfileIntroPadlock } from '../profile/ProfileIntroGraphic';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBBody } from './onboarding-ui';

/** Free Lite caps: what most people start with before they join co-op. */
const CAPS = FREE_BENEFITS.circleCaps;

/** One circle row: name, plain meaning, and how many people fit. */
const CIRCLES: {
  id: 'close' | 'friend' | 'acquaintance';
  label: string;
  meaning: string;
  size: string;
  accent: Accent;
}[] = [
  {
    id: 'close',
    label: TIER_LABEL.close,
    meaning: 'Your innermost circle. The few you tell almost everything.',
    size: `Up to ${CAPS.close} people`,
    accent: 'coral'
  },
  {
    id: 'friend',
    label: TIER_LABEL.friend,
    meaning: 'People you actually know and hang with.',
    size: `Up to ${CAPS.friends} people`,
    accent: 'purple'
  },
  {
    id: 'acquaintance',
    label: TIER_LABEL.acquaintance,
    meaning: 'Everyone else you have added. Connection stays uncapped.',
    size: 'Unlimited',
    accent: 'blue'
  }
];

export function PrivacyCirclesStep({
  step,
  total,
  onNext,
  onBack
}: {
  step: number;
  total: number;
  onNext: () => void;
  onBack: () => void;
}) {
  // Cap note sits on the canvas, so ink follows light/dark.
  const theme = useThemeColors();
  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="Privacy First"
      ask="Three circles. You pick who sees what."
      // Blurb sits beside the lock in the body (not stacked under the ask).
      cta="Got it"
      smallAsk
      scrollBody
      onContinue={onNext}
      onBack={onBack}
    >
      <View style={{ gap: 16 }}>
        {/* LOCK + BLURB: padlock on the left, explainer text on the right. */}
        <AnalyticsRegion
          analyticsId={ONBOARDING.circles.lock}
          interactive={false}
          accessibilityLabel="Privacy lock. Next you will set an audience for each answer. Change any of it anytime."
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              // Keep the open shackle inside this row (no crop at the top).
              overflow: 'visible',
              paddingTop: 2
            }}
          >
            <View style={{ flexShrink: 0 }}>
              <ProfileIntroPadlock tone="onLight" />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <OBBody>
                Next you will set an audience for each answer. Change any of it anytime.
              </OBBody>
            </View>
          </View>
        </AnalyticsRegion>

        {/* THE THREE CIRCLES: meaning + size. Not tappable choices. */}
        <AnalyticsRegion analyticsId={ONBOARDING.circles.tier_card} interactive={false}>
          <View style={{ gap: 8 }}>
            {CIRCLES.map((c) => (
              <View
                key={c.id}
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${c.label}. ${c.meaning} ${c.size}.`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  gap: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 12,
                  backgroundColor: OB.paper,
                  borderWidth: OB_BORDER,
                  borderColor: OB.navy
                }}
              >
                <View
                  accessible={false}
                  style={{
                    width: 12,
                    height: 12,
                    marginTop: 5,
                    backgroundColor: ACCENT_HEX[c.accent]
                  }}
                />
                <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 8
                    }}
                  >
                    <Text className="font-sans-b text-[16px]" style={{ color: OB.ink }}>
                      {c.label}
                    </Text>
                    <Text className="font-sans-sb text-[12px]" style={{ color: OB.blue }}>
                      {c.size}
                    </Text>
                  </View>
                  <Text
                    className="font-sans-sb text-[14px] leading-snug"
                    style={{ color: OB.inkSoft }}
                  >
                    {c.meaning}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AnalyticsRegion>

        <Text
          className="font-sans-sb text-[12px] leading-snug"
          style={{ color: theme.inkMute, paddingHorizontal: 2 }}
        >
          Free Lite starts at {CAPS.close} Close and {CAPS.friends} Friends.
          Co-op raises those caps. Acquaintances stay unlimited either way.
        </Text>
      </View>
    </OnboardingStep>
  );
}

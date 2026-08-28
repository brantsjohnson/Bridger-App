// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10C - "Social battery." How many social events do you like to attend
// a week? One row of square cells that fill up as you tap, starting at 0 for
// "no social events." Skippable. This helps Bridger pace how often it nudges
// you toward plans; it is not shown to other people as a number.
//
// LOOK: a white box with a thick blue outline and a small blue nub on the end,
// like a battery. Every cell up to and including your pick is filled with color,
// the rest are a faint navy tint. Under it, your answer in big blue caps.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB } from './onboarding-theme';
import { OBHeading } from './onboarding-ui';

/**
 * The cells of the battery. Zero is the "no social events" answer, so it lives
 * in the bar itself instead of a separate opt-out box. Seven means "seven or more".
 */
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Empty cells and their numbers are a faint ink wash, matching the app. */
const EMPTY_FILL = OB.fillFaint;
const EMPTY_TEXT = OB.inkFaint;

/** A calm week is blue, a busy one is amber, a packed one is hot pink. */
function fillColor(nights: number): string {
  if (nights <= 2) return OB.blue;
  if (nights <= 5) return OB.amber;
  return OB.pink;
}

/** Amber is light, so its numbers are black; blue and pink take cream. */
function fillTextColor(nights: number): string {
  return nights > 2 && nights <= 5 ? OB.ink : OB.onColor;
}

export function SocialBatteryStep({
  step,
  total,
  nights,
  onPick,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  nights: number | null;
  onPick: (n: number) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  // Nothing is highlighted until they actually tap, so an untouched screen never
  // looks like they already answered "no social events".
  const answered = nights != null;
  const value = nights ?? 0;
  const label = !answered
    ? 'Tap a number'
    : value === 0
      ? 'No social events'
      : value === 7
        ? '7+ social events a week'
        : value === 1
          ? '1 social event a week'
          : `${value} social events a week`;
  const color = fillColor(value || 3);
  const filledText = fillTextColor(value || 3);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="So we pace the nudges to you."
      ask="How many social events do you like to attend a week?"
      blurb="Tap your social battery. Fuller means more plans."
      smallAsk
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View style={{ gap: 18, paddingTop: 16 }}>
        {/* THIS SECTION DOES: the battery body, one tappable cell per count. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Social events you like to attend a week"
            style={{
              flex: 1,
              height: 96,
              flexDirection: 'row',
              gap: 6,
              padding: 8,
              backgroundColor: OB.paper,
              borderWidth: 3,
              borderColor: OB.blue
            }}
          >
            {CELLS.map((n) => {
              // Battery fill: every cell from 0 up to and including the pick lights up.
              const filled = answered && value >= n;
              const cellLabel = n === 7 ? '7+' : String(n);
              const spoken =
                n === 0
                  ? 'No social events'
                  : n === 7
                    ? '7 or more social events a week'
                    : n === 1
                      ? '1 social event a week'
                      : `${n} social events a week`;
              return (
                <Pressable
                  key={n}
                  onPress={withAnalyticsPress(ONBOARDING.taste.nights_option, () => onPick(n), {
                    analyticsProps: { nights: n }
                  })}
                  accessibilityRole="button"
                  accessibilityState={{ selected: answered && value === n }}
                  accessibilityLabel={spoken}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    minHeight: 44,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: filled ? color : EMPTY_FILL
                  }}
                >
                  <Text
                    className="font-sans-b text-[17px]"
                    style={{ color: filled ? filledText : EMPTY_TEXT }}
                  >
                    {cellLabel}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {/* The little blue nub that makes the box read as a battery. */}
          <View
            accessible={false}
            pointerEvents="none"
            style={{ width: 11, height: 34, flexShrink: 0, backgroundColor: OB.blue }}
          />
        </View>

        {/* THIS SECTION DOES: say your answer back to you in words. The "none"
            answer is the 0 cell in the bar now, so there is no opt-out box. */}
        <OBHeading style={{ fontSize: 44, lineHeight: 44, letterSpacing: -1 }}>{label}</OBHeading>
      </View>
    </OnboardingStep>
  );
}

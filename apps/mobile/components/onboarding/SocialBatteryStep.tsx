// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10C - "Social battery." In a normal week, how many nights do you like
// going out? One row of square cells that fill up as you tap, starting at 0 for
// "no nights out." Skippable. This helps Bridger pace how often it nudges you
// toward plans; it is not shown to other people as a number.
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
 * The cells of the battery. Zero is the "no nights out" answer, so it lives in
 * the bar itself instead of a separate opt-out box. Seven means "seven or more".
 */
const CELLS = [0, 1, 2, 3, 4, 5, 6, 7];

/** Empty cells and their numbers are a faint navy, straight from the design. */
const EMPTY_FILL = 'rgba(39,64,135,0.12)';
const EMPTY_TEXT = 'rgba(39,64,135,0.6)';

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
  // looks like they already answered "no nights out".
  const answered = nights != null;
  const value = nights ?? 0;
  const label = !answered
    ? 'Tap a number'
    : value === 0
      ? 'No nights out'
      : value === 7
        ? '7+ nights a week'
        : value === 1
          ? '1 night a week'
          : `${value} nights a week`;
  const color = fillColor(value || 3);
  const filledText = fillTextColor(value || 3);

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="So we pace the nudges to you."
      ask="In a normal week, how many nights out feel good?"
      blurb="Tap your social battery. Fuller means more plans."
      smallAsk
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View style={{ gap: 18, paddingTop: 16 }}>
        {/* THIS SECTION DOES: the battery body, one tappable cell per night. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View
            accessibilityRole="radiogroup"
            accessibilityLabel="Nights out in a normal week"
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
              // The zero cell only lights up on its own; every other cell fills
              // up to and including the number they picked.
              const filled = answered && (n === 0 ? value === 0 : value >= n && n > 0);
              const cellLabel = n === 7 ? '7+' : String(n);
              const spoken =
                n === 0
                  ? 'No nights out'
                  : n === 7
                    ? '7 or more nights a week'
                    : n === 1
                      ? '1 night a week'
                      : `${n} nights a week`;
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

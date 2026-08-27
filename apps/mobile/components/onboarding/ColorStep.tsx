// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10D — "Your color." Tap a hue strip on the spectrum to pick a color that
// feels like you. Below it, a live "Your grid" preview shows the app's grid
// lines tinted in that color. Skippable. scrollBody is on because the spectrum
// plus preview is tall on a small phone.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { CheckIcon } from 'lucide-react-native';
import { ONBOARDING } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { WASH_MUTED } from './onboarding-wash';

/** Turn hue/saturation/lightness into a #rrggbb string (no color libs needed). */
function hslToHex(h: number, s: number, l: number): string {
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l / 100 - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** 24 hues across the rainbow for the spectrum strip. */
const SPECTRUM = Array.from({ length: 24 }, (_, i) => hslToHex(i * 15, 90, 50));

export function ColorStep({
  step,
  total,
  color,
  onPick,
  onNext,
  onSkip,
  onBack
}: {
  step: number;
  total: number;
  color: string | null;
  onPick: (hex: string) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
}) {
  const chosen = color ?? '#FF3E8A';

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="A little bit of you, everywhere."
      ask="What is your favorite color?"
      accent="pink"
      scrollBody
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View className="gap-4">
        {/* THIS SECTION DOES: a tap-anywhere hue spectrum made of 24 strips. */}
        <View
          className="h-[140px] flex-row overflow-hidden rounded-card border border-ink-line"
          accessibilityRole="adjustable"
          accessibilityLabel="Color spectrum"
        >
          {SPECTRUM.map((hex) => {
            const on = color?.toLowerCase() === hex.toLowerCase();
            return (
              <Pressable
                key={hex}
                onPress={withAnalyticsPress(ONBOARDING.taste.color_swatch, () => onPick(hex), {
                  analyticsProps: { color: hex, method: 'spectrum' }
                })}
                accessibilityRole="button"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`Color ${hex}`}
                className="flex-1 items-center justify-center"
                style={{ backgroundColor: hex }}
              >
                {on ? <CheckIcon size={14} color="#FFFFFF" strokeWidth={3.5} /> : null}
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row items-center gap-3">
          <View
            className="h-11 w-11 rounded-card border border-ink-line"
            style={{ backgroundColor: chosen }}
            accessible={false}
          />
          <Text className={cn('font-sans-sb text-[13px]', WASH_MUTED)}>
            Tap anywhere in the spectrum
          </Text>
        </View>

        {/* THIS SECTION DOES: a live grid preview tinted by the pick. */}
        <GridPreview color={chosen} />
      </View>
    </OnboardingStep>
  );
}

/** A small graph-paper square whose lines take the chosen color. */
function GridPreview({ color }: { color: string }) {
  const cols = 7;
  const rows = 4;
  return (
    <View
      className="h-32 w-full overflow-hidden rounded-card border border-ink-line bg-canvas"
      accessible={false}
    >
      {Array.from({ length: cols }, (_, i) => (
        <View
          key={`v${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${((i + 1) / (cols + 1)) * 100}%`,
            width: 2,
            backgroundColor: color,
            opacity: 0.55
          }}
        />
      ))}
      {Array.from({ length: rows }, (_, i) => (
        <View
          key={`h${i}`}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${((i + 1) / (rows + 1)) * 100}%`,
            height: 2,
            backgroundColor: color,
            opacity: 0.55
          }}
        />
      ))}
      <Text className="absolute bottom-3 left-4 font-sans-b text-[11px] uppercase tracking-wide text-ink/50">
        Your grid
      </Text>
    </View>
  );
}

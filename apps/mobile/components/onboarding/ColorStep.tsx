// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10D - "Your color." Tap (or drag) anywhere on a 2D spectrum to pick a
// color that feels like you. Hue runs left to right; lightness runs white at
// the top to black at the bottom. Under it a small swatch shows the pick, and
// a live "Your grid" preview shows the app's grid lines tinted in that color.
// Skippable. scrollBody is on because the spectrum plus preview is tall on a
// small phone.
//
// LOOK: a continuous spectrum box (not stripe columns), the picked swatch beside
// a hint line, and the grid preview on tan paper with its "Your grid" label
// sitting ABOVE the box so it is not drawn on top of the lines.
// ============================================
import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import { OnboardingStep } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';

/**
 * Turn hue/saturation/lightness into a #rrggbb string (no color libs needed).
 * Lightness comes in as 0 to 100, so the first thing we do is turn it into a
 * fraction. Skipping that step produced numbers way out of range and every
 * swatch came out as an invalid color, which is why the spectrum showed up blank.
 */
function hslToHex(h: number, s: number, lightness: number): string {
  const l = lightness / 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/** Rainbow stops for the horizontal hue wash (full circle back to red). */
const HUE_STOPS = [
  '#FF0000',
  '#FF8000',
  '#FFFF00',
  '#80FF00',
  '#00FF00',
  '#00FF80',
  '#00FFFF',
  '#0080FF',
  '#0000FF',
  '#8000FF',
  '#FF00FF',
  '#FF0080',
  '#FF0000'
] as const;

/** How tall the spectrum and the grid preview are. */
const SPECTRUM_PX = 160;
const PREVIEW_PX = 150;

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
  const chosen = color ?? OB.pink;

  return (
    <OnboardingStep
      step={step}
      total={total}
      purpose="A little bit of you, everywhere."
      ask="What is your favorite color?"
      scrollBody
      onContinue={onNext}
      onSkip={onSkip}
      onBack={onBack}
    >
      <View style={{ gap: 16 }}>
        {/* THIS SECTION DOES: the continuous hue × lightness spectrum you tap. */}
        <SpectrumMap color={color} onPick={onPick} />

        {/* THIS SECTION DOES: show the pick in a square swatch with a hint. */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View
            accessible={false}
            pointerEvents="none"
            style={{
              width: 44,
              height: 44,
              flexShrink: 0,
              backgroundColor: chosen,
              borderWidth: OB_BORDER,
              borderColor: OB.navy
            }}
          />
          <Text className="font-sans-sb text-[13px]" style={{ color: 'rgba(0,0,0,0.55)' }}>
            Tap anywhere in the spectrum
          </Text>
        </View>

        {/* THIS SECTION DOES: a live grid preview tinted by the pick. */}
        <GridPreview color={chosen} />
      </View>
    </OnboardingStep>
  );
}

// ============================================
// THE SPECTRUM: hue left→right, white→color→black top→bottom.
// A rainbow wash sits underneath; a white/black fade sits on top so the middle
// stays vivid and the edges go to white and black, matching the design map.
// ============================================
function SpectrumMap({
  color,
  onPick
}: {
  color: string | null;
  onPick: (hex: string) => void;
}) {
  const [size, setSize] = useState({ w: 1, h: 1 });

  // THIS SECTION DOES: turn a tap/drag point into a hex color.
  const pickAt = (x: number, y: number, withAnalytics: boolean) => {
    const nx = Math.max(0, Math.min(1, x / size.w));
    const ny = Math.max(0, Math.min(1, y / size.h));
    const hue = nx * 360;
    // Top of the map is white (100), bottom is black (0).
    const lightness = (1 - ny) * 100;
    const hex = hslToHex(hue, 100, lightness);
    if (withAnalytics) {
      // withAnalyticsPress returns a press handler; call it with no gesture event.
      const press = withAnalyticsPress(ONBOARDING.taste.color_swatch, () => onPick(hex), {
        analyticsProps: { color: hex, method: 'spectrum' }
      });
      press?.({} as never);
    } else {
      onPick(hex);
    }
  };

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel="Color spectrum"
      accessibilityHint="Tap or drag to pick a color. Hue left to right, lighter at the top, darker at the bottom."
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        setSize({ w: Math.max(1, width), h: Math.max(1, height) });
      }}
      // Drag so you can scrub across the map, not only tap once.
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={(e) =>
        pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY, false)
      }
      onResponderMove={(e) =>
        pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY, false)
      }
      onResponderRelease={(e) =>
        pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY, true)
      }
      style={{
        height: SPECTRUM_PX,
        width: '100%',
        overflow: 'hidden',
        borderWidth: OB_BORDER,
        borderColor: OB.navy
      }}
    >
      {/* Rainbow base: every hue across the width. */}
      <LinearGradient
        colors={[...HUE_STOPS]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {/* Lightness wash: white on top, clear in the middle, black at the bottom. */}
      <LinearGradient
        colors={['#FFFFFF', 'rgba(255,255,255,0)', 'rgba(0,0,0,0)', '#000000']}
        locations={[0, 0.42, 0.58, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
      />
      {/* ACCESSIBILITY: announce the current pick without relying on color alone. */}
      {color ? (
        <Text
          accessible
          accessibilityLabel={`Selected color ${color}`}
          style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }}
        >
          {color}
        </Text>
      ) : null}
    </View>
  );
}

/** A square of graph paper on tan stock whose lines take the chosen color. */
function GridPreview({ color }: { color: string }) {
  const cols = 7;
  const rows = 4;
  return (
    <View style={{ gap: 8 }}>
      {/* Label lives ABOVE the box so it is not drawn on top of the grid lines. */}
      <Text
        className="font-sans-b text-[12px]"
        style={{
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.6)'
        }}
      >
        Your grid
      </Text>
      <View
        accessible={false}
        style={{
          height: PREVIEW_PX,
          width: '100%',
          overflow: 'hidden',
          backgroundColor: OB.canvas,
          borderWidth: OB_BORDER,
          borderColor: OB.navy
        }}
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
              backgroundColor: color
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
              backgroundColor: color
            }}
          />
        ))}
      </View>
    </View>
  );
}

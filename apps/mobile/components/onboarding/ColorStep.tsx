// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 10D - "Your color." Tap (or drag) anywhere on a 2D spectrum to pick a
// color that feels like you. Hue runs left to right; lightness runs white at
// the top to black at the bottom. Under the hint, a saturation slider lets you
// fine-tune how vivid the pick is (muted ↔ vivid). A small swatch shows the
// pick, and a live "Your grid" preview shows the app's grid lines tinted in
// that color. Skippable. scrollBody is on because the spectrum plus slider
// plus preview is tall on a small phone. While you drag the slider or
// spectrum, the page scroll freezes so the finger is not fighting the page.
//
// LOOK: a continuous spectrum box (not stripe columns), the picked swatch
// beside a hint line, a fine-tune slider under that hint, and the grid
// preview on tan paper with its "Your grid" label sitting ABOVE the box so
// it is not drawn on top of the lines.
// ============================================
import React, { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ONBOARDING } from '@bridger/shared';
import { withAnalyticsPress, useThemeColors } from '@bridger/ui';
import { OnboardingStep, useOnboardingBodyScroll } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';

/** Hue, saturation (0–100), and lightness (0–100) for one pick. */
type Hsl = { h: number; s: number; l: number };

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

/**
 * Turn a #rrggbb string back into hue / saturation / lightness so the slider
 * and spectrum can stay in sync when the draft already has a saved color.
 */
function hexToHsl(hex: string): Hsl {
  const raw = hex.replace('#', '');
  if (raw.length !== 6) return { h: 330, s: 100, l: 60 };
  const r = parseInt(raw.slice(0, 2), 16) / 255;
  const g = parseInt(raw.slice(2, 4), 16) / 255;
  const b = parseInt(raw.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l: l * 100 };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

/** Starting pick when nothing is saved yet (matches the pink Continue accent). */
const DEFAULT_HSL: Hsl = hexToHsl(OB.pink);

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
/** Track height for the fine-tune slider (thumb sits slightly taller). */
const SLIDER_TRACK_PX = 14;
const SLIDER_THUMB_PX = 28;

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
  // THIS SECTION DOES: keep hue / sat / light in one place so spectrum + slider agree.
  const [hsl, setHsl] = useState<Hsl>(() => (color ? hexToHsl(color) : DEFAULT_HSL));
  // Ref mirrors hsl so slider drags always read the latest hue/lightness.
  const hslRef = useRef(hsl);
  // Hint under the swatch sits on the canvas; follow theme ink in dark mode.
  const theme = useThemeColors();
  hslRef.current = hsl;
  const chosen = hslToHex(hsl.h, hsl.s, hsl.l);

  // THIS SECTION DOES: write a new hex up to the draft whenever HSL changes.
  const commit = (next: Hsl, method: 'spectrum' | 'slider', withAnalytics: boolean) => {
    hslRef.current = next;
    setHsl(next);
    const hex = hslToHex(next.h, next.s, next.l);
    if (withAnalytics) {
      const id =
        method === 'slider' ? ONBOARDING.taste.color_slider : ONBOARDING.taste.color_swatch;
      const press = withAnalyticsPress(id, () => onPick(hex), {
        analyticsProps: { color: hex, method }
      });
      press?.({} as never);
    } else {
      onPick(hex);
    }
  };

  // Spectrum tap sets hue + lightness at full vividness; slider then fine-tunes sat.
  const pickFromSpectrum = (h: number, l: number, withAnalytics: boolean) => {
    commit({ h, s: 100, l }, 'spectrum', withAnalytics);
  };

  const pickFromSlider = (s: number, withAnalytics: boolean) => {
    commit({ ...hslRef.current, s }, 'slider', withAnalytics);
  };

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
        <SpectrumMap color={chosen} onPick={pickFromSpectrum} />

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
          <Text className="font-sans-sb text-[13px]" style={{ color: theme.inkMute }}>
            Tap anywhere in the spectrum
          </Text>
        </View>

        {/* THIS SECTION DOES: saturation slider to fine-tune after the tap. */}
        <SaturationSlider hsl={hsl} onChange={pickFromSlider} />

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
  onPick: (hue: number, lightness: number, withAnalytics: boolean) => void;
}) {
  const [size, setSize] = useState({ w: 1, h: 1 });
  // Freeze the onboarding page scroll while scrubbing the map.
  const { setScrollLocked } = useOnboardingBodyScroll();

  // THIS SECTION DOES: turn a tap/drag point into hue + lightness.
  const pickAt = (x: number, y: number, withAnalytics: boolean) => {
    const nx = Math.max(0, Math.min(1, x / size.w));
    const ny = Math.max(0, Math.min(1, y / size.h));
    const hue = nx * 360;
    // Top of the map is white (100), bottom is black (0).
    const lightness = (1 - ny) * 100;
    onPick(hue, lightness, withAnalytics);
  };

  const endDrag = (x: number, y: number, withAnalytics: boolean) => {
    setScrollLocked(false);
    pickAt(x, y, withAnalytics);
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
      // Keep the drag: do not let the parent ScrollView steal the finger mid-move.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        setScrollLocked(true);
        pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY, false);
      }}
      onResponderMove={(e) =>
        pickAt(e.nativeEvent.locationX, e.nativeEvent.locationY, false)
      }
      onResponderRelease={(e) =>
        endDrag(e.nativeEvent.locationX, e.nativeEvent.locationY, true)
      }
      onResponderTerminate={(e) =>
        endDrag(e.nativeEvent.locationX, e.nativeEvent.locationY, false)
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

// ============================================
// THE FINE-TUNE SLIDER: muted (left) → vivid (right).
// Same hue and lightness as the spectrum pick; only saturation moves.
// ============================================
function SaturationSlider({
  hsl,
  onChange
}: {
  hsl: Hsl;
  onChange: (saturation: number, withAnalytics: boolean) => void;
}) {
  const [trackW, setTrackW] = useState(1);
  // Freeze page scroll while the thumb is moving left/right.
  const { setScrollLocked } = useOnboardingBodyScroll();
  // Gray at this lightness on the left; full-sat color on the right.
  const muted = hslToHex(hsl.h, 0, hsl.l);
  const vivid = hslToHex(hsl.h, 100, hsl.l);
  // "Fine-tune" label sits on the canvas.
  const theme = useThemeColors();
  const thumbLeft = Math.max(
    0,
    Math.min(trackW - SLIDER_THUMB_PX, (hsl.s / 100) * (trackW - SLIDER_THUMB_PX))
  );

  // THIS SECTION DOES: map a finger X on the track to 0–100 saturation.
  const setFromX = (x: number, withAnalytics: boolean) => {
    const usable = Math.max(1, trackW - SLIDER_THUMB_PX);
    const nx = Math.max(0, Math.min(1, (x - SLIDER_THUMB_PX / 2) / usable));
    onChange(nx * 100, withAnalytics);
  };

  const endDrag = (x: number, withAnalytics: boolean) => {
    setScrollLocked(false);
    setFromX(x, withAnalytics);
  };

  return (
    <View style={{ gap: 8 }}>
      <Text
        className="font-sans-sb text-[12px]"
        style={{ color: theme.inkMute }}
        accessibilityRole="header"
      >
        Fine-tune
      </Text>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Color vividness"
        accessibilityHint="Slide left for more muted, right for more vivid."
        accessibilityValue={{ min: 0, max: 100, now: Math.round(hsl.s) }}
        onLayout={(e) => setTrackW(Math.max(1, e.nativeEvent.layout.width))}
        // Claim the drag immediately so vertical page scroll cannot start first.
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          setScrollLocked(true);
          setFromX(e.nativeEvent.locationX, false);
        }}
        onResponderMove={(e) => setFromX(e.nativeEvent.locationX, false)}
        onResponderRelease={(e) => endDrag(e.nativeEvent.locationX, true)}
        onResponderTerminate={(e) => endDrag(e.nativeEvent.locationX, false)}
        style={{
          // Taller hit area so the thumb is easy to grab without grazing the page.
          height: SLIDER_THUMB_PX + 16,
          width: '100%',
          justifyContent: 'center',
          // Extra vertical pad so a slightly diagonal swipe still feels like a slide.
          paddingVertical: 8
        }}
      >
        {/* Track: gray → current hue at full saturation. */}
        <View
          pointerEvents="none"
          style={{
            height: SLIDER_TRACK_PX,
            width: '100%',
            overflow: 'hidden',
            borderWidth: OB_BORDER,
            borderColor: OB.navy
          }}
        >
          <LinearGradient
            colors={[muted, vivid]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
          />
        </View>
        {/* Square thumb that matches onboarding outlines. */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: thumbLeft,
            // Center the thumb in the taller hit box.
            top: 8,
            width: SLIDER_THUMB_PX,
            height: SLIDER_THUMB_PX,
            backgroundColor: hslToHex(hsl.h, hsl.s, hsl.l),
            borderWidth: OB_BORDER,
            borderColor: OB.navy
          }}
        />
      </View>
    </View>
  );
}

/** A square of graph paper on tan stock whose lines take the chosen color. */
function GridPreview({ color }: { color: string }) {
  const cols = 7;
  const rows = 4;
  // Label sits above the box on the page canvas.
  const theme = useThemeColors();
  return (
    <View style={{ gap: 8 }}>
      {/* Label lives ABOVE the box so it is not drawn on top of the grid lines. */}
      <Text
        className="font-sans-b text-[12px]"
        style={{
          letterSpacing: 1.2,
          textTransform: 'uppercase',
          color: theme.inkMute
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

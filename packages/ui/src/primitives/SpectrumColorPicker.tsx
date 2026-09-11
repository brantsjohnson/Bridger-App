// ============================================
// WHAT THIS FILE DOES (plain English):
// A real color picker, like the one in Pinterest. Instead of a handful of
// fixed dots, you get a full rainbow square you can drag your finger across to
// mix ANY color, plus a rainbow bar to pick the base hue. It also keeps a row
// of quick swatches (starter colors + the custom colors you have mixed) so you
// can tap to reuse a color. Any color you mix is added to that row.
//
// It is "controlled": it tells the parent the new hex color as your finger
// moves (onChange), and tells the parent to remember a mixed color when you
// lift your finger (onCommit).
// ============================================
import React, { useMemo, useRef, useState } from 'react';
import {
  PanResponder,
  Pressable,
  ScrollView,
  Text,
  View,
  type LayoutChangeEvent
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { cn } from '../lib/cn';
import { withAnalyticsPress } from '../lib/analytics';

// --- Color math: convert between the hex we store and the H/S/V a picker uses ---

/** Clamp a number into 0..1. */
function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

/** Turn hue/saturation/value (0..1 each, hue 0..360) into an #rrggbb string. */
export function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const to = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${to(r)}${to(g)}${to(b)}`.toUpperCase();
}

/** Turn an #rrggbb string into hue/saturation/value. Bad input reads as black. */
export function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = (hex ?? '').replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255 || 0;
  const g = parseInt(full.slice(2, 4), 16) / 255 || 0;
  const b = parseInt(full.slice(4, 6), 16) / 255 || 0;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

const HUE_STOPS = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'] as const;
const SAT_STOPS = ['#FFFFFF', 'rgba(255,255,255,0)'] as const;
const VAL_STOPS = ['rgba(0,0,0,0)', '#000000'] as const;

// --- The picker itself ---

export function SpectrumColorPicker({
  value,
  onChange,
  onCommit,
  presets = [],
  recents = [],
  analyticsId,
  spectrumAnalyticsId,
  className
}: {
  /** The current color as #rrggbb. */
  value: string;
  /** Called as the finger moves so the page updates live. */
  onChange: (hex: string) => void;
  /** Called when the finger lifts, so a mixed color can be remembered. */
  onCommit?: (hex: string) => void;
  /** Starter swatches shown first. */
  presets?: ReadonlyArray<string>;
  /** Colors the person has mixed before (shown after presets). */
  recents?: ReadonlyArray<string>;
  /** Analytics id for tapping a quick swatch. */
  analyticsId?: string;
  /** Analytics id for opening / closing the rainbow spectrum. */
  spectrumAnalyticsId?: string;
  className?: string;
}) {
  // THIS SECTION DOES: remember whether the big rainbow square is open.
  const [open, setOpen] = useState(false);
  // THIS SECTION DOES: the working hue/saturation/value, seeded from the value.
  const seed = useMemo(() => hexToHsv(value), [value]);
  const hsv = useRef(seed);
  hsv.current = seed;
  const [svBox, setSvBox] = useState({ w: 0, h: 0 });
  const [hueW, setHueW] = useState(0);
  const svBoxRef = useRef(svBox);
  svBoxRef.current = svBox;
  const hueWRef = useRef(hueW);
  hueWRef.current = hueW;

  const pushLive = (h: number, s: number, v: number) => {
    hsv.current = { h, s, v };
    onChange(hsvToHex(h, s, v));
  };

  // THIS SECTION DOES: drag inside the square to set saturation (x) + value (y).
  const svPan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const s = clamp01(locationX / (svBoxRef.current.w || 1));
        const v = 1 - clamp01(locationY / (svBoxRef.current.h || 1));
        pushLive(hsv.current.h, s, v);
      },
      onPanResponderMove: (e) => {
        const { locationX, locationY } = e.nativeEvent;
        const s = clamp01(locationX / (svBoxRef.current.w || 1));
        const v = 1 - clamp01(locationY / (svBoxRef.current.h || 1));
        pushLive(hsv.current.h, s, v);
      },
      onPanResponderRelease: () => {
        onCommit?.(hsvToHex(hsv.current.h, hsv.current.s, hsv.current.v));
      }
    })
  ).current;

  // THIS SECTION DOES: drag along the rainbow bar to set the base hue.
  const huePan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const h = clamp01(e.nativeEvent.locationX / (hueWRef.current || 1)) * 360;
        pushLive(h, hsv.current.s || 1, hsv.current.v || 1);
      },
      onPanResponderMove: (e) => {
        const h = clamp01(e.nativeEvent.locationX / (hueWRef.current || 1)) * 360;
        pushLive(h, hsv.current.s || 1, hsv.current.v || 1);
      },
      onPanResponderRelease: () => {
        onCommit?.(hsvToHex(hsv.current.h, hsv.current.s, hsv.current.v));
      }
    })
  ).current;

  const onSvLayout = (e: LayoutChangeEvent) =>
    setSvBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height });

  const hueColor = hsvToHex(hsv.current.h, 1, 1);
  const handleLeft = svBox.w * hsv.current.s;
  const handleTop = svBox.h * (1 - hsv.current.v);
  const hueLeft = hueW * (hsv.current.h / 360);

  // De-dupe swatches so a mixed color does not show twice.
  const swatches = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const c of [...recents, ...presets]) {
      const key = c.toUpperCase();
      if (!seen.has(key)) {
        seen.add(key);
        out.push(c);
      }
    }
    return out;
  }, [recents, presets]);

  return (
    <View className={cn('gap-3', className)}>
      {/* THE SWATCH ROW: rainbow toggle first, then quick colors. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, alignItems: 'center', paddingRight: 8 }}
      >
        <Pressable
          onPress={withAnalyticsPress(spectrumAnalyticsId, () => setOpen((o) => !o))}
          accessibilityRole="button"
          accessibilityLabel="Custom color"
          accessibilityState={{ expanded: open }}
          className="h-11 w-11 items-center justify-center rounded-full"
          style={{ borderWidth: open ? 3 : 1, borderColor: open ? '#0E0E0E' : 'rgba(28,27,22,0.25)' }}
        >
          <LinearGradient
            colors={HUE_STOPS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: 'absolute', inset: 0, borderRadius: 999 }}
          />
          <Text accessible={false} style={{ fontSize: 16 }}>
            🎨
          </Text>
        </Pressable>
        {swatches.map((c) => {
          const on = c.toUpperCase() === (value ?? '').toUpperCase();
          return (
            <Pressable
              key={c}
              onPress={withAnalyticsPress(
                analyticsId,
                () => onChange(c),
                { analyticsProps: { color: c } }
              )}
              accessibilityRole="button"
              accessibilityLabel={`Color ${c}`}
              accessibilityState={{ selected: on }}
              className="h-11 w-11 rounded-full"
              style={{
                backgroundColor: c,
                borderWidth: on ? 3 : 1,
                borderColor: on ? '#0E0E0E' : 'rgba(28,27,22,0.2)'
              }}
            />
          );
        })}
      </ScrollView>

      {/* THE SPECTRUM: a rainbow square you drag your finger across. */}
      {open ? (
        <View className="gap-3">
          <View
            onLayout={onSvLayout}
            {...svPan.panHandlers}
            className="h-40 w-full overflow-hidden rounded-2xl"
            style={{ backgroundColor: hueColor }}
            accessibilityRole="adjustable"
            accessibilityLabel="Color spectrum. Drag to mix a color."
          >
            {/* left→right: white to clear (saturation) */}
            <LinearGradient
              colors={SAT_STOPS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', inset: 0 }}
            />
            {/* top→bottom: clear to black (value) */}
            <LinearGradient
              colors={VAL_STOPS}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={{ position: 'absolute', inset: 0 }}
            />
            <View
              pointerEvents="none"
              className="absolute h-6 w-6 rounded-full border-2 border-white"
              style={{
                left: handleLeft - 12,
                top: handleTop - 12,
                backgroundColor: value,
                shadowColor: '#000',
                shadowOpacity: 0.4,
                shadowRadius: 3
              }}
            />
          </View>

          {/* THE HUE BAR: pick the base rainbow color. */}
          <View
            onLayout={(e) => setHueW(e.nativeEvent.layout.width)}
            {...huePan.panHandlers}
            className="h-8 w-full justify-center overflow-hidden rounded-full"
            accessibilityRole="adjustable"
            accessibilityLabel="Hue"
          >
            <LinearGradient
              colors={HUE_STOPS}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ position: 'absolute', inset: 0 }}
            />
            <View
              pointerEvents="none"
              className="absolute h-8 w-8 rounded-full border-[3px] border-white"
              style={{ left: Math.min(Math.max(0, hueLeft - 16), Math.max(0, hueW - 32)) }}
            />
          </View>

          <View className="flex-row items-center gap-2">
            <View
              className="h-6 w-6 rounded-full"
              style={{ backgroundColor: value, borderWidth: 1, borderColor: 'rgba(28,27,22,0.2)' }}
            />
            <Text
              className="text-[13px] text-ink/70"
              style={{ fontFamily: 'AnonymousPro_700Bold' }}
            >
              {(value ?? '').toUpperCase()}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

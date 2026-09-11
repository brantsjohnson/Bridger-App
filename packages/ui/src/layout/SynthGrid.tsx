// ============================================
// WHAT THIS FILE DOES (plain English):
// The drifting perspective grid that sits behind the app — Bridger's 80s synth
// backdrop. It runs on every screen; Discover gets the boldest version. Still
// atmospheric enough that text on top of it stays easy to read.
// ACCESSIBILITY: when Reduce Motion is on, the grid stays still.
// Dark mode bumps line opacity so the grid still reads on a near-black canvas.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, useColorScheme, View } from 'react-native';

const ROWS = 14;
const COLS = 16;

// Purple lines (same idea as Magic Patterns). Fixed rgba so themed `ink`
// never turns the grid into a bright white stripe. Personal onboarding color
// overrides this via the `color` prop.
const DEFAULT_LINE_LIGHT = 'rgba(127, 119, 221, 0.5)';
const DEFAULT_LINE_DARK = 'rgba(167, 160, 255, 0.72)';

/**
 * How loud the grid is. 'normal' is the everyday backdrop; 'bold' is Discover,
 * where the grid is part of the point.
 */
const STRENGTH = {
  normal: { opacity: 0.85, darkOpacity: 1 },
  bold: { opacity: 1, darkOpacity: 1 }
};

/**
 * THIS SECTION DOES: make a line color louder on a dark canvas so people can
 * still see the grid (Places onboarding feedback: "didn't notice the grid").
 */
function lineForScheme(line: string, isDark: boolean): string {
  if (!isDark) return line;
  const m = line.match(
    /rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/i
  );
  if (!m) return line;
  const r = Number(m[1]);
  const g = Number(m[2]);
  const b = Number(m[3]);
  const a = Math.min(0.92, Math.max(0.65, (Number(m[4] ?? '0.5') || 0.5) * 1.55));
  // Slight lift toward lavender so thin lines read on #0E0E0E.
  const lift = (c: number) => Math.min(255, Math.round(c + (255 - c) * 0.18));
  return `rgba(${lift(r)}, ${lift(g)}, ${lift(b)}, ${a})`;
}

export function SynthGrid({
  strength = 'normal',
  color
}: {
  strength?: keyof typeof STRENGTH;
  /** Optional personal line tint from onboarding (rgba or hex). */
  color?: string;
}) {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const level = STRENGTH[strength];
  const baseLine = color?.trim()
    ? color
    : isDark
      ? DEFAULT_LINE_DARK
      : DEFAULT_LINE_LIGHT;
  const line = lineForScheme(baseLine, isDark);
  const gridOpacity = isDark ? level.darkOpacity : level.opacity;
  const drift = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      drift.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 16000, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 16000, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, drift]);

  const translateY = drift.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 24]
  });

  // Mild perspective fade — still visible under the title, never a hard cutoff.
  // Dark mode starts a bit louder so the top rows are not invisible.
  const rows = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, i) => ({
        key: `r${i}`,
        opacity: (isDark ? 0.55 : 0.45) + (i / ROWS) * (isDark ? 0.4 : 0.45)
      })),
    [isDark]
  );

  return (
    /*
      Full-screen clip — taps pass straight through to the real content.
      `overflow: hidden` is load-bearing: the grid inside is drawn wider than the
      screen on purpose, and without the clip that extra width makes the whole
      page scroll sideways into empty canvas (it reads as a black bar down one
      edge). Do not remove it.
    */
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { opacity: gridOpacity, overflow: 'hidden' }]}
      accessible={false}
    >
      {/*
        Layout styles are INLINE on purpose. NativeWind classes on Animated.View
        were not applying height on web, so every line stacked into a white bar
        across the Discover header.
      */}
      {/*
        Vertical lines stay put. If they rode the drift with the horizontals,
        the top of the screen would flash empty under the title and it would
        look like the grid just stopped. Horizontals alone do the slow drift.
      */}
      {/*
        Vertical lines run edge to edge (no side pad). An inset pad used to
        read as a purple "picture frame" around the whole app and made
        full-bleed marquees look clipped inside a border.
      */}
      <View
        style={[
          StyleSheet.absoluteFill,
          {
            flexDirection: 'row',
            justifyContent: 'space-between',
            // Nudge past the screen edges so the outermost lines don't form a box.
            left: -StyleSheet.hairlineWidth,
            right: -StyleSheet.hairlineWidth
          }
        ]}
      >
        {Array.from({ length: COLS }).map((_, i) => (
          <View
            key={`c${i}`}
            style={{
              opacity: (isDark ? 0.55 : 0.45) + (Math.abs(i - COLS / 2) / (COLS / 2)) * 0.35,
              height: '100%',
              width: StyleSheet.hairlineWidth,
              backgroundColor: line
            }}
          />
        ))}
      </View>

      <Animated.View
        style={{
          position: 'absolute',
          left: '-20%',
          right: '-20%',
          /*
            Overhang top AND bottom so the drifting horizontals never open a
            blank band. Keep these larger than the drift distance (24px).
          */
          top: -40,
          bottom: -40,
          transform: [{ translateY }]
        }}
      >
        <View style={[StyleSheet.absoluteFill, { justifyContent: 'space-between' }]}>
          {rows.map((r) => (
            <View
              key={r.key}
              style={{
                opacity: r.opacity,
                height: StyleSheet.hairlineWidth,
                width: '100%',
                backgroundColor: line
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The drifting perspective grid that sits behind the app — Bridger's 80s synth
// backdrop. It runs on every screen; Discover gets the boldest version. Still
// atmospheric enough that text on top of it stays easy to read.
// ACCESSIBILITY: when Reduce Motion is on, the grid stays still.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

const ROWS = 14;
const COLS = 16;

// Purple lines (same idea as Magic Patterns). Fixed rgba so dark mode
// never turns the grid into a bright white stripe via themed `ink`.
const LINE = 'rgba(127, 119, 221, 0.5)';

/**
 * How loud the grid is. 'normal' is the everyday backdrop; 'bold' is Discover,
 * where the grid is part of the point.
 */
const STRENGTH = {
  normal: { opacity: 0.85 },
  bold: { opacity: 1 }
};

export function SynthGrid({ strength = 'normal' }: { strength?: keyof typeof STRENGTH }) {
  const level = STRENGTH[strength];
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
  const rows = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, i) => ({
        key: `r${i}`,
        opacity: 0.45 + (i / ROWS) * 0.45
      })),
    []
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
      style={[StyleSheet.absoluteFill, { opacity: level.opacity, overflow: 'hidden' }]}
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
              opacity: 0.45 + (Math.abs(i - COLS / 2) / (COLS / 2)) * 0.35,
              height: '100%',
              width: StyleSheet.hairlineWidth,
              backgroundColor: LINE
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
                backgroundColor: LINE
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

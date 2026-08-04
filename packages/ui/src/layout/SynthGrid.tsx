// ============================================
// WHAT THIS FILE DOES (plain English):
// The faint drifting perspective grid behind Discover — the only place Bridger
// goes full 80s synth. Soft and atmospheric so content stays readable.
// ACCESSIBILITY: when Reduce Motion is on, the grid stays still.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, View } from 'react-native';

const ROWS = 14;
const COLS = 16;

// Soft purple lines (same idea as Magic Patterns). Fixed rgba so dark mode
// never turns the grid into a bright white stripe via themed `ink`.
const LINE = 'rgba(127, 119, 221, 0.22)';

export function SynthGrid() {
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

  // Fainter rows near the "horizon" (top of this block) to fake perspective.
  const rows = useMemo(
    () =>
      Array.from({ length: ROWS }, (_, i) => ({
        key: `r${i}`,
        opacity: 0.12 + (i / ROWS) * 0.28
      })),
    []
  );

  return (
    // Full-screen clip — taps pass through to the real Discover content.
    <View pointerEvents="none" style={StyleSheet.absoluteFill} accessible={false}>
      {/*
        Layout styles are INLINE on purpose. NativeWind classes on Animated.View
        were not applying height on web, so every line stacked into a white bar
        across the Discover header.
      */}
      <Animated.View
        style={{
          position: 'absolute',
          left: '-20%',
          right: '-20%',
          bottom: -32,
          height: '55%',
          transform: [{ translateY }]
        }}
      >
        {/* horizontal lines spaced across the floor plane */}
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
        {/* vertical lines that fan slightly via spacing */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8 }
          ]}
        >
          {Array.from({ length: COLS }).map((_, i) => (
            <View
              key={`c${i}`}
              style={{
                opacity: 0.15 + (Math.abs(i - COLS / 2) / (COLS / 2)) * 0.12,
                height: '100%',
                width: StyleSheet.hairlineWidth,
                backgroundColor: LINE
              }}
            />
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

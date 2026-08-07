// ============================================
// WHAT THIS FILE DOES (plain English):
// The colorful sparkle field behind the Discover intro globe. It draws the exact
// stars from the design (see discoverStars.ts) as real vector shapes, so they
// stay crisp at any size (the old stars.gif looked muddy). Stars twinkle in a
// handful of shared "groups" so the whole field shimmers without animating 3000
// things one by one. Twinkle opacity runs on Animated.View (not animated SVG
// groups), so web does not choke on React Native-only props like collapsable.
// Respects Reduce Motion (holds a steady soft glow instead).
// ACCESSIBILITY: purely decorative, so it never traps focus or reads out.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';
import { STARS_A, STARS_B, STAR_GROUPS, STAR_VIEWBOX, type Star } from './discoverStars';

// THIS SECTION DOES: the three sparkle shapes (4, 5, and 6 point) from the design
const SHAPE: Record<number, string> = {
  4: 'M0.0 -10.0 L1.56 -1.56 L10.0 0.0 L1.56 1.56 L0.0 10.0 L-1.56 1.56 L-10.0 0.0 L-1.56 -1.56Z',
  5: 'M0.0 -10.0 L2.35 -3.24 L9.51 -3.09 L3.8 1.24 L5.88 8.09 L0.0 4.0 L-5.88 8.09 L-3.8 1.24 L-9.51 -3.09 L-2.35 -3.24Z',
  6: 'M0.0 -10.0 L2.2 -3.81 L8.66 -5.0 L4.4 0.0 L8.66 5.0 L2.2 3.81 L0.0 10.0 L-2.2 3.81 L-8.66 5.0 L-4.4 0.0 L-8.66 -5.0 L-2.2 -3.81Z'
};

// THIS SECTION DOES: split each layer's stars into their twinkle groups once
function bucket(stars: Star[]): Star[][] {
  const groups: Star[][] = Array.from({ length: STAR_GROUPS }, () => []);
  for (const s of stars) groups[s[5]].push(s);
  return groups;
}

export function StarField() {
  const reduceMotion = useReduceMotion();

  const groupsA = useMemo(() => bucket(STARS_A), []);
  const groupsB = useMemo(() => bucket(STARS_B), []);

  // One animated value per twinkle group (shared by both layers).
  const twinkle = useRef(
    Array.from({ length: STAR_GROUPS }, () => new Animated.Value(0.55))
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      twinkle.forEach((v) => v.setValue(0.7));
      return;
    }
    // Each group breathes between dim (0.06) and bright (1), like the CSS tw
    // keyframe, but every group runs at a slightly different speed and offset
    // so the field never pulses all at once.
    const loops = twinkle.map((v, g) => {
      const up = 700 + (g % 5) * 260; // 0.7s .. 1.74s
      const down = 900 + ((g + 2) % 6) * 240;
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(v, {
            toValue: 1,
            duration: up,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: NATIVE_DRIVER
          }),
          Animated.timing(v, {
            toValue: 0.06,
            duration: down,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: NATIVE_DRIVER
          })
        ])
      );
      return loop;
    });
    // Stagger the starts so the shimmer feels scattered.
    const timers = loops.map((loop, g) => setTimeout(() => loop.start(), g * 130));
    return () => {
      timers.forEach(clearTimeout);
      loops.forEach((l) => l.stop());
    };
  }, [twinkle, reduceMotion]);

  return (
    <View style={styles.fill} pointerEvents="none" accessible={false}>
      {/* Layer B sits behind at lower opacity for depth */}
      <View style={[styles.fill, { opacity: 0.4 }]}>
        {groupsB.map((group, g) => (
          <TwinkleGroup key={`b-${g}`} stars={group} opacity={twinkle[g]} />
        ))}
      </View>

      {/* Layer A on top, brighter */}
      <View style={[styles.fill, { opacity: 0.6 }]}>
        {groupsA.map((group, g) => (
          <TwinkleGroup key={`a-${g}`} stars={group} opacity={twinkle[g]} />
        ))}
      </View>
    </View>
  );
}

// --- ONE TWINKLE GROUP: its own SVG, opacity animated on a View (web-safe) ---
function TwinkleGroup({
  stars,
  opacity
}: {
  stars: Star[];
  opacity: Animated.Value;
}) {
  return (
    <Animated.View style={[styles.fill, { opacity }]} pointerEvents="none">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${STAR_VIEWBOX.width} ${STAR_VIEWBOX.height}`}
        preserveAspectRatio="xMidYMid slice"
      >
        {stars.map((s, i) => (
          <Path key={i} d={SHAPE[s[0]]} fill={s[4]} translate={[s[1], s[2]]} scale={s[3]} />
        ))}
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }
});

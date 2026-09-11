// ============================================
// WHAT THIS FILE DOES (plain English):
// The "it's alive" element behind the big recap photo. When a friend's voice is
// playing, soft purple rings grow out from behind their picture and fade away,
// over and over — so the screen clearly feels like it's playing, not frozen.
// When it's paused (or the phone has Reduce Motion on), the rings hold still as
// one calm halo instead of pulsing.
// ACCESSIBILITY: purely decorative. It is hidden from screen readers and stops
// animating when the user asked the system to reduce motion.
// ============================================
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, View } from 'react-native';
import { useReduceMotion } from '@bridger/ui';

// THIS SECTION DOES: describe each ring — how much bigger it grows and when it
// starts, so the three rings ripple out one after another instead of together.
const RINGS = [
  { delay: 0, grow: 1.35 },
  { delay: 600, grow: 1.6 },
  { delay: 1200, grow: 1.9 }
];

// Bridger purple, fixed so dark mode never turns the halo into a bright stripe.
const RING_COLOR = 'rgba(127, 119, 221, 0.45)';

/**
 * A ripple halo sized to sit behind a round photo.
 * `size` is the photo's diameter; `playing` turns the ripple on.
 */
export function RecapPulse({ size, playing }: { size: number; playing: boolean }) {
  const reduce = useReduceMotion();

  // One animated value per ring, reused across renders.
  const anims = useMemo(() => RINGS.map(() => new Animated.Value(0)), []);
  const animsRef = useRef(anims);
  animsRef.current = anims;

  // THIS SECTION DOES: start the looping ripple while playing; settle the rings
  // back to a still halo when paused or when Reduce Motion is on.
  useEffect(() => {
    const list = animsRef.current;
    list.forEach((v) => v.stopAnimation());

    if (!playing || reduce) {
      list.forEach((v) => {
        Animated.timing(v, {
          toValue: reduce && playing ? 0.5 : 0,
          duration: 240,
          useNativeDriver: true
        }).start();
      });
      return;
    }

    const loops = list.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(RINGS[i].delay),
          Animated.timing(v, {
            toValue: 1,
            duration: 1800,
            useNativeDriver: true
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true
          })
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [playing, reduce]);

  return (
    <View
      pointerEvents="none"
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      // Sit dead-centre behind the photo without pushing layout around.
      style={{
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      {anims.map((v, i) => {
        const scale = v.interpolate({
          inputRange: [0, 1],
          outputRange: [1, RINGS[i].grow]
        });
        // Fade from visible to gone as the ring grows (still halo when paused).
        const opacity = reduce
          ? 0.35
          : v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.5, 0] });
        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: size,
              height: size,
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Animated.View style={{ opacity, transform: [{ scale }] }}>
              <View
                style={{
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: 2,
                  borderColor: RING_COLOR
                }}
              />
            </Animated.View>
          </View>
        );
      })}
    </View>
  );
}

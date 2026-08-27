// ============================================
// WHAT THIS FILE DOES (plain English):
// The top banner of the Home quiz card. Instead of one static picture, it
// slowly cross-fades through a set of J-name faces so the card feels alive and
// teases the quiz. If the person has turned on Reduce Motion, it just shows the
// first face and never animates.
//
// WEB NOTE: React Native Web needs a real pixel height on <Image>. We also keep
// TWO face layers mounted at all times and only cross-fade between them. The old
// version mounted/unmounted the incoming layer each beat, which on web could
// leave the banner stuck on the dark shell after one full rotation.
// ============================================

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  View,
  type ImageSourcePropType
} from 'react-native';
import { useReduceMotion } from '@bridger/ui';

export function QuizCoverCycler({
  faces,
  heightPx,
  intervalMs = 2600,
  accessibilityLabel = 'J-name faces'
}: {
  faces: ImageSourcePropType[];
  /** Banner height in pixels (must match the parent h-52 / h-28 Tailwind class). */
  heightPx: number;
  /** How long each face is shown before fading to the next. */
  intervalMs?: number;
  accessibilityLabel?: string;
}) {
  const reduce = useReduceMotion();

  // THIS SECTION DOES: two permanent slots — we never unmount either layer, we
  // just fade whichever slot is "back" in over the front one, then swap roles.
  const [visibleSlot, setVisibleSlot] = useState<0 | 1>(0);
  const [slotFace, setSlotFace] = useState<[number, number]>(() => [
    0,
    faces.length > 1 ? 1 : 0
  ]);
  const opacities = useRef([new Animated.Value(1), new Animated.Value(0)]).current;
  const faceIndexRef = useRef(0);
  const visibleSlotRef = useRef<0 | 1>(0);
  const busy = useRef(false);

  const faceStyle = { width: '100%' as const, height: heightPx };

  useEffect(() => {
    faceIndexRef.current = slotFace[visibleSlot];
    visibleSlotRef.current = visibleSlot;
  }, [slotFace, visibleSlot]);

  useEffect(() => {
    if (reduce || faces.length <= 1) return;

    const timer = setInterval(() => {
      if (busy.current) return;
      busy.current = true;

      const nextFace = (faceIndexRef.current + 1) % faces.length;
      const front = visibleSlotRef.current;
      const back: 0 | 1 = front === 0 ? 1 : 0;

      // Load the next face into the hidden slot while it is still invisible.
      setSlotFace((prev) => {
        const next: [number, number] = [...prev];
        next[back] = nextFace;
        return next;
      });

      opacities[back].setValue(0);
      Animated.parallel([
        Animated.timing(opacities[back], {
          toValue: 1,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(opacities[front], {
          toValue: 0,
          duration: 700,
          useNativeDriver: true
        })
      ]).start(({ finished }) => {
        if (finished) {
          faceIndexRef.current = nextFace;
          visibleSlotRef.current = back;
          setVisibleSlot(back);
        }
        busy.current = false;
      });
    }, intervalMs);

    return () => {
      clearInterval(timer);
      busy.current = false;
    };
  }, [faces.length, intervalMs, reduce, opacities]);

  if (!faces.length) {
    return (
      <View
        style={[styles.shell, { height: heightPx }]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <View
      style={[styles.shell, { height: heightPx }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
    >
      {([0, 1] as const).map((slot) => (
        <Animated.Image
          key={slot}
          source={faces[slotFace[slot]]}
          accessibilityIgnoresInvertColors
          resizeMode="cover"
          style={[
            styles.layer,
            faceStyle,
            {
              opacity: reduce ? (slot === 0 ? 1 : 0) : opacities[slot],
              zIndex: slot === visibleSlot ? 1 : 2
            }
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  shell: {
    position: 'relative',
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#101012'
  },
  layer: {
    position: 'absolute',
    top: 0,
    left: 0
  }
});

// ============================================
// WHAT THIS FILE DOES (plain English):
// The signature Venn on Reveal Screen 1 — two overlapping circles (your color
// + theirs) with the shared overlap highlighted. Decorative math only; the
// screen reader gets a spoken label describing the strongest shared thing.
// ACCESSIBILITY: no motion required; reduce-motion just skips a soft pulse.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import type { Accent } from '@bridger/shared';
import { ACCENTS, AnalyticsRegion } from '@bridger/ui';
import { REVEAL } from '@bridger/shared';

type Props = {
  yourAccent: Accent;
  theirAccent: Accent;
  /** Spoken description — e.g. the strongest commonality label */
  label: string;
};

const SIZE = 168;
const CIRCLE = 118;

export function VennDiagram({ yourAccent, theirAccent, label }: Props) {
  const yours = ACCENTS[yourAccent];
  const theirs = ACCENTS[theirAccent];
  const [reduceMotion, setReduceMotion] = useState(false);
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.(
      'reduceMotionChanged',
      setReduceMotion
    );
    return () => sub?.remove?.();
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.04,
          duration: 900,
          useNativeDriver: true
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, pulse]);

  // Overlap sits in the middle — mix both accents toward a bright highlight.
  const overlapColor = '#F5F0E6';

  return (
    <AnalyticsRegion analyticsId={REVEAL.flow.venn} interactive={false}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`What connects you most: ${label}`}
        className="items-center justify-center"
        style={{ width: SIZE + 40, height: SIZE }}
      >
        {/* your circle — left */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            top: (SIZE - CIRCLE) / 2,
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            backgroundColor: yours.hex,
            opacity: 0.85
          }}
        />
        {/* their circle — right */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            right: 0,
            top: (SIZE - CIRCLE) / 2,
            width: CIRCLE,
            height: CIRCLE,
            borderRadius: CIRCLE / 2,
            backgroundColor: theirs.hex,
            opacity: 0.85
          }}
        />
        {/* overlap highlight — the focal point */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            alignSelf: 'center',
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: overlapColor,
            opacity: 0.95,
            transform: [{ scale: pulse }],
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Text className="font-sans-xb text-[18px] text-ink" accessible={false}>
            ✦
          </Text>
        </Animated.View>
      </View>
    </AnalyticsRegion>
  );
}

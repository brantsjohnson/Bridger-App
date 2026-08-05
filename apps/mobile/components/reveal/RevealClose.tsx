// ============================================
// WHAT THIS FILE DOES (plain English):
// Reveal Screen 3 — the close. Confetti, "You two should click.", and the
// promise that this content lives under "In common" forever. The "See their
// profile" button lives in the fixed bottom bar of the reveal screen now, so
// it always sits at the very bottom. Copy is exact from REVEAL.md.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';

export function RevealClose() {
  const [reduceMotion, setReduceMotion] = useState(false);
  const bob = useRef(new Animated.Value(0)).current;

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
      bob.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -6,
          duration: 700,
          useNativeDriver: true
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, bob]);

  return (
    <View className="mt-8 items-center gap-5">
      <Animated.Text
        accessible={false}
        className="text-[48px]"
        style={{ transform: [{ translateY: bob }] }}
      >
        🎉
      </Animated.Text>

      {/* Fixed cream on dark — theme text-canvas flips in dark mode */}
      <Text
        className="text-center font-pixel text-[28px] leading-[32px]"
        style={{ color: '#F5F0E6' }}
      >
        You two should click.
      </Text>

      <Text
        className="text-center font-sans-md text-[13px]"
        style={{ color: 'rgba(245, 240, 230, 0.55)' }}
      >
        Revisit anytime under &quot;In common&quot;
      </Text>
    </View>
  );
}

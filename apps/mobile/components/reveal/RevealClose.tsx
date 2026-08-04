// ============================================
// WHAT THIS FILE DOES (plain English):
// Reveal Screen 3 — the close. Confetti, "You two should click.", a primary
// button to see their profile, and the promise that this content lives under
// "In common" forever. Copy is exact from REVEAL.md.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Text, View } from 'react-native';
import { REVEAL } from '@bridger/shared';
import { ButtonPrimary } from '@bridger/ui';

type Props = {
  firstName: string;
  onSeeProfile: () => void;
};

export function RevealClose({ firstName, onSeeProfile }: Props) {
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

      <Text className="text-center font-pixel text-[28px] leading-[32px] text-canvas">
        You two should click.
      </Text>

      <View className="w-full gap-2">
        <ButtonPrimary
          full
          size="lg"
          analyticsId={REVEAL.flow.see_profile}
          onPress={onSeeProfile}
          accessibilityLabel={`See ${firstName}'s profile`}
        >
          {`See ${firstName}'s profile`}
        </ButtonPrimary>
        <Text className="text-center font-sans-md text-[13px] text-white/55">
          Revisit anytime under &quot;In common&quot;
        </Text>
      </View>
    </View>
  );
}

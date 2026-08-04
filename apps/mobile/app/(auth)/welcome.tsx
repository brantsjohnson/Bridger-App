// ============================================
// WHAT THIS FILE DOES (plain English):
// The first-open Welcome sequence (ONBOARDING.md Phase 0 / Magic Patterns
// welcome.tsx). It auto-plays short text beats — no skip, no back — and when
// the last beat finishes it goes to Create account. Beat 5 is a visual
// "phone-time" bar that fills up, not just plain text.
//
// ACCESSIBILITY: if the device has Reduce Motion on, beats still advance but
// without the rise/fill animation.
// ============================================
import { useEffect, useState } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH, openSurface } from '@bridger/shared';
import { AnalyticsRegion, PixelHeading, Screen } from '@bridger/ui';
import { BEAT_MS, WELCOME_BEATS, WELCOME_SEEN_KEY } from '../../content/welcome';

export default function WelcomeScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);
  const beat = WELCOME_BEATS[index];
  const last = index === WELCOME_BEATS.length - 1;

  // Opacity / rise for each beat; bar height for the phone-time stat.
  const opacity = useSharedValue(1);
  const translateY = useSharedValue(0);
  const barHeight = useSharedValue(0);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  // Welcome is its own analytics surface (auto-play; still measure dead-clicks).
  useEffect(() => {
    openSurface('auth');
  }, []);

  // --- Animate the current beat in (or snap if Reduce Motion is on) ---
  useEffect(() => {
    if (reduceMotion) {
      opacity.value = 1;
      translateY.value = 0;
      barHeight.value = beat.kind === 'stat' ? 160 : 0;
      return;
    }
    opacity.value = 0;
    translateY.value = 12;
    opacity.value = withTiming(1, { duration: 320, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(0, { duration: 320, easing: Easing.out(Easing.cubic) });
    if (beat.kind === 'stat') {
      barHeight.value = 0;
      barHeight.value = withTiming(160, { duration: 1800, easing: Easing.out(Easing.cubic) });
    } else {
      barHeight.value = 0;
    }
  }, [index, reduceMotion, beat.kind, opacity, translateY, barHeight]);

  // --- Auto-advance; on the last beat, mark welcome seen and go to sign-up ---
  useEffect(() => {
    const t = setTimeout(async () => {
      if (last) {
        await AsyncStorage.setItem(WELCOME_SEEN_KEY, '1');
        router.replace('/(auth)/sign-up');
      } else {
        setIndex((i) => i + 1);
      }
    }, BEAT_MS);
    return () => clearTimeout(t);
  }, [index, last, router]);

  const beatStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }]
  }));

  const barStyle = useAnimatedStyle(() => ({
    height: barHeight.value
  }));

  return (
    <Screen tone="canvas">
      <View className="flex-1 justify-between px-7 pb-10 pt-16">
        <AnalyticsRegion
          analyticsId={AUTH.welcome.brand}
          interactive={false}
          accessibilityLabel="Bridger"
        >
          <PixelHeading size="sm" className="text-ink-mute">
            Bridger
          </PixelHeading>
        </AnalyticsRegion>

        <AnalyticsRegion
          analyticsId={AUTH.welcome.beat_body}
          interactive={false}
          className="flex-1"
        >
          <Animated.View style={beatStyle} className="flex-1 pt-16">
            {beat.kind === 'stat' ? (
              <View>
                {/* Square frame with a coral bar that fills from the bottom. */}
                <View className="mb-5 h-40 w-full justify-end overflow-hidden border-2 border-ink">
                  <Animated.View style={barStyle} className="w-full bg-coral" />
                </View>
                <Text className="font-sans-b text-[22px] leading-tight tracking-tight text-ink">
                  {beat.text}
                </Text>
              </View>
            ) : (
              <Text
                className={
                  last
                    ? 'font-pixel text-[34px] leading-tight text-ink'
                    : 'font-sans-b text-[26px] leading-tight tracking-tight text-ink'
                }
              >
                {beat.text}
              </Text>
            )}
          </Animated.View>
        </AnalyticsRegion>

        {/* Progress ticks — filled up to the current beat (dead-click target). */}
        <AnalyticsRegion
          analyticsId={AUTH.welcome.progress_bar}
          interactive={false}
          accessibilityLabel="Welcome progress"
        >
          <View
            className="flex-row gap-1.5"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            {WELCOME_BEATS.map((b, i) => (
              <View key={b.id} className={`h-1 flex-1 ${i <= index ? 'bg-ink' : 'bg-ink/15'}`} />
            ))}
          </View>
        </AnalyticsRegion>
      </View>
    </Screen>
  );
}
// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the little looping "movie" that plays inside the "Add your recap"
// row on Friends. It is pure decoration to make people notice they can record
// their weekly voice recap. It must NEVER look like the phone is recording
// yet (no red REC dot, no "REC" label). The story it tells, on a loop:
//
//   1. Rest: a purple mic + the words "Add your recap".
//   2. The mic does a tiny pulse / flip.
//   3. Soft purple audio bars sweep in (preview energy, not a live mic).
//   4. Bars fade and the phrase returns.
//   5. It waits a few seconds, then plays again.
//
// ACCESSIBILITY: hidden from screen readers (the button already announces
// "Add your recap"). Reduce Motion shows only the calm rest state.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View, type LayoutChangeEvent } from 'react-native';
import { MicIcon } from 'lucide-react-native';
import { NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

// Purple is Bridger's brand. Never use recording-red here (scared testers).
const PURPLE = '#6B2FEA';

const ACTIVE_MS = 9000;
const REST_MS = 5000;
const PHRASE = 'Add your recap';
const BAR_WIDTH = 3;
const BAR_GAP = 1;
const FALLBACK_BARS = 40;

/**
 * The animated contents of the "Add your recap" row: purple mic + phrase that
 * briefly becomes soft audio bars. Drop this inside the row's Pressable.
 */
export function RecapTeaser() {
  const reduce = useReduceMotion();
  const t = useRef(new Animated.Value(0)).current;
  const [barCount, setBarCount] = useState(FALLBACK_BARS);

  const bars = useMemo(
    () => Array.from({ length: barCount }, () => new Animated.Value(0)),
    [barCount]
  );

  const letters = useMemo(() => {
    let k = 0;
    return PHRASE.split('').map((char) => {
      if (char === ' ') return { char, k: null as number | null };
      return { char, k: k++ };
    });
  }, []);

  useEffect(() => {
    if (reduce) {
      t.setValue(0);
      return;
    }
    let cancelled = false;
    const play = () => {
      if (cancelled) return;
      t.setValue(0);
      Animated.timing(t, {
        toValue: 1,
        duration: ACTIVE_MS,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: NATIVE_DRIVER
      }).start(({ finished }) => {
        if (!finished || cancelled) return;
        setTimeout(play, REST_MS);
      });
    };
    play();
    return () => {
      cancelled = true;
      t.stopAnimation();
    };
  }, [reduce, t]);

  // Soft bounce on the preview bars while they are visible.
  // scaleY (not height): native driver cannot animate layout props like height.
  useEffect(() => {
    if (reduce) return;
    const loops = bars.map((b, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(b, {
            toValue: 1,
            duration: 320 + (i % 5) * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE_DRIVER
          }),
          Animated.timing(b, {
            toValue: 0,
            duration: 320 + (i % 5) * 40,
            easing: Easing.inOut(Easing.sin),
            useNativeDriver: NATIVE_DRIVER
          })
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [bars, reduce]);

  const onMiddleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    const n = Math.max(12, Math.floor(w / (BAR_WIDTH + BAR_GAP)));
    if (n !== barCount) setBarCount(n);
  };

  if (reduce) {
    return (
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        className="flex-1 flex-row items-center gap-3"
      >
        <MicIcon size={20} color={PURPLE} strokeWidth={2.4} />
        <Text numberOfLines={1} className="min-w-0 flex-1 font-sans-b text-[14px] text-ink">
          {PHRASE}
        </Text>
      </View>
    );
  }

  const micPulse = t.interpolate({
    inputRange: [0, 0.12, 0.24, 1],
    outputRange: [1, 1.12, 1, 1]
  });
  const phraseOpacity = t.interpolate({
    inputRange: [0, 0.2, 0.28, 0.72, 0.82, 1],
    outputRange: [1, 1, 0, 0, 1, 1]
  });
  const waveOpacity = t.interpolate({
    inputRange: [0, 0.22, 0.3, 0.7, 0.8, 1],
    outputRange: [0, 0, 1, 1, 0, 0]
  });

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className="flex-1 flex-row items-center gap-3"
    >
      <Animated.View style={{ transform: [{ scale: micPulse }] }}>
        <MicIcon size={20} color={PURPLE} strokeWidth={2.4} />
      </Animated.View>

      <View
        onLayout={onMiddleLayout}
        className="min-w-0 flex-1 justify-center overflow-hidden"
        style={{ height: 24 }}
      >
        <Animated.View style={{ opacity: phraseOpacity }}>
          <View className="flex-row items-center">
            {letters.map((l, i) =>
              l.k === null ? (
                <View key={`sp-${i}`} style={{ width: 4 }} />
              ) : (
                <Text key={`ch-${i}`} className="font-sans-b text-[14px] text-ink">
                  {l.char}
                </Text>
              )
            )}
          </View>
        </Animated.View>

        {/* Soft purple preview bars only (never red / REC). */}
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <Animated.View style={{ opacity: waveOpacity }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {bars.map((b, j) => {
              // Grow via scaleY. Size lives on a plain View so native driver
              // never sees height (iOS throws if height is on the animated node).
              const scaleY = b.interpolate({
                inputRange: [0, 1],
                outputRange: [6 / 18, 1]
              });
              return (
                <View
                  key={`bar-${j}`}
                  style={{
                    width: BAR_WIDTH,
                    height: 18,
                    marginRight: BAR_GAP,
                    justifyContent: 'center'
                  }}
                >
                  <Animated.View style={{ transform: [{ scaleY }] }}>
                    <View
                      style={{
                        width: BAR_WIDTH,
                        height: 18,
                        borderRadius: 1,
                        backgroundColor: PURPLE,
                        opacity: 0.55
                      }}
                    />
                  </Animated.View>
                </View>
              );
            })}
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

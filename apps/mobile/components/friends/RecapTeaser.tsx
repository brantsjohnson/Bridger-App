// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the little looping "movie" that plays inside the "Add your recap"
// row on Friends. It is pure decoration to make people notice they can record
// their weekly voice recap. The story it tells, on a loop:
//
//   1. Rest: a purple mic + the words "Add your recap" (how the row normally looks).
//   2. The mic flips over into a red REC dot and the word REC appears.
//   3. The letters of "Add your recap" spin away one by one (like on a skewer).
//   4. A row of little pixel audio bars sweeps in from the left and bounces.
//   5. The bars travel on across the row, and as they pass, the letters spin
//      back in so "Add your recap" is whole again.
//   6. REC spins around and the mic flips back and does a tiny wiggle.
//   7. The bars finish sliding off the right edge, and we are back at rest.
//   8. It waits a few seconds, then plays again.
//
// ACCESSIBILITY: this whole thing is hidden from screen readers (the button
// around it already announces "Add your recap"), and if the person has Reduce
// Motion turned on we show only the calm rest state with no movement at all.
// PERFORMANCE: only opacity + transform are animated, driven by one master
// timeline value, so it stays cheap.
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View, type LayoutChangeEvent } from 'react-native';
import { MicIcon } from 'lucide-react-native';
import { Glow, NATIVE_DRIVER, useReduceMotion } from '@bridger/ui';

// --- COLORS: purple is Bridger's brand; red means "recording" ---
const PURPLE = '#6B2FEA';
const REC_RED = '#E5484D';

// --- TIMING: how long the movie plays, and how long it rests between plays.
// Slower so it lingers on the REC + recording moment. ---
const ACTIVE_MS = 11000;
const REST_MS = 5000;

// --- THE PHRASE: split into characters so each letter can spin on its own ---
const PHRASE = 'Add your recap';

// --- THE WAVE: thick bars, 1px gap. Count is measured so the pack always
// reaches from just after "REC" to the right edge (the "5 questions" label). ---
const BAR_WIDTH = 3;
const BAR_GAP = 1;
/** Room reserved on the left for the word "REC" before the bars start. */
const REC_SLOT = 36;
/** Fallback bar count before the first layout measurement. */
const FALLBACK_BARS = 48;

/**
 * The animated contents of the "Add your recap" row: the flipping mic/REC icon
 * on the left and the phrase-that-becomes-audio-waves in the middle. Drop this
 * inside the row's Pressable; it renders the icon slot plus a flex-1 middle.
 */
export function RecapTeaser() {
  const reduce = useReduceMotion();

  // THIS SECTION DOES: one value that walks 0 to 1 across the whole movie.
  const t = useRef(new Animated.Value(0)).current;

  // THIS SECTION DOES: how wide the middle region is, so we know how many
  // packed bars fit from after REC all the way to the label.
  const [barCount, setBarCount] = useState(FALLBACK_BARS);

  // THIS SECTION DOES: one bouncing value per audio bar, remade when the count
  // changes after layout.
  const bars = useMemo(
    () => Array.from({ length: barCount }, () => new Animated.Value(0)),
    [barCount]
  );

  // THIS SECTION DOES: work out where each letter sits in the spin order, so the
  // letters spin away (and back) one after another, skipping the spaces.
  const letters = useMemo(() => {
    let k = 0;
    return PHRASE.split('').map((char) => {
      if (char === ' ') return { char, k: null as number | null };
      return { char, k: k++ };
    });
  }, []);

  // THIS SECTION DOES: count how many bars fit in the measured middle width.
  function onMiddleLayout(e: LayoutChangeEvent) {
    const width = e.nativeEvent.layout.width;
    const waveWidth = Math.max(0, width - REC_SLOT);
    const step = BAR_WIDTH + BAR_GAP;
    const next = Math.max(8, Math.floor(waveWidth / step));
    setBarCount((prev) => (prev === next ? prev : next));
  }

  // THIS SECTION DOES: run the loop. Rest for a few seconds, play the movie,
  // snap back to rest, repeat. Reduce Motion skips all of it.
  useEffect(() => {
    if (reduce) {
      t.setValue(0);
      return;
    }
    const master = Animated.loop(
      Animated.sequence([
        Animated.delay(REST_MS),
        Animated.timing(t, {
          toValue: 1,
          duration: ACTIVE_MS,
          easing: Easing.linear,
          useNativeDriver: NATIVE_DRIVER
        }),
        Animated.timing(t, { toValue: 0, duration: 0, useNativeDriver: NATIVE_DRIVER })
      ])
    );
    // Each bar breathes on its own little loop so the wave never looks frozen.
    const barLoops = bars.map((b, j) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(j * 40),
          Animated.timing(b, {
            toValue: 1,
            duration: 260 + (j % 5) * 30,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: NATIVE_DRIVER
          }),
          Animated.timing(b, {
            toValue: 0,
            duration: 260 + (j % 5) * 30,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: NATIVE_DRIVER
          })
        ])
      )
    );
    // THIS SECTION DOES: start the master timeline and every bar's bounce loop.
    master.start();
    barLoops.forEach((l) => l.start());
    // THIS SECTION DOES: stop both when the component unmounts or Reduce Motion flips on.
    return () => {
      master.stop();
      barLoops.forEach((l) => l.stop());
    };
  }, [t, bars, reduce]);

  // ============================================
  // REDUCE MOTION: just the calm resting row, nothing moves.
  // ============================================
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

  // THIS SECTION DOES: the mic flips out first (turning into the red dot), then
  // flips right back the moment the red dot leaves, and wiggles a little.
  const micOpacity = t.interpolate({
    inputRange: [0, 0.03, 0.06, 0.58, 0.64, 1],
    outputRange: [1, 1, 0, 0, 1, 1]
  });
  const micRotateY = t.interpolate({
    inputRange: [0, 0.06, 0.58, 0.66, 1],
    outputRange: ['0deg', '90deg', '90deg', '0deg', '0deg']
  });
  const micWiggle = t.interpolate({
    inputRange: [0, 0.68, 0.72, 0.76, 1],
    outputRange: ['0deg', '0deg', '8deg', '-6deg', '0deg']
  });

  // THIS SECTION DOES: the red REC dot lives in the same slot as the mic and
  // flips in as the mic flips out. It leaves once the wave has reached the label.
  const dotOpacity = t.interpolate({
    inputRange: [0, 0.03, 0.06, 0.55, 0.62, 1],
    outputRange: [0, 0, 1, 1, 0, 0]
  });
  const dotRotateY = t.interpolate({
    inputRange: [0, 0.06, 1],
    outputRange: ['-90deg', '0deg', '0deg']
  });

  // THIS SECTION DOES: the word "REC" spins in AFTER the phrase has spun away
  // (so they never overlap), holds, then spins a full turn out as the phrase
  // comes back.
  const recOpacity = t.interpolate({
    inputRange: [0, 0.2, 0.26, 0.55, 0.62, 1],
    outputRange: [0, 0, 1, 1, 0, 0]
  });
  const recRotateY = t.interpolate({
    inputRange: [0, 0.2, 0.26, 0.55, 0.62, 1],
    outputRange: ['-90deg', '-90deg', '0deg', '0deg', '-360deg', '-360deg']
  });

  // THIS SECTION DOES: as the wave drains it drifts a touch to the right, to
  // sell "it keeps traveling until it is all gone".
  const waveTranslateX = t.interpolate({
    inputRange: [0, 0.6, 0.95, 1],
    outputRange: [0, 0, 30, 30]
  });

  // THIS SECTION DOES: how many bars to fill, and how fast each one lights / drains.
  const fillStep = barCount > 1 ? 0.25 / (barCount - 1) : 0;
  const drainStep = barCount > 1 ? 0.3 / (barCount - 1) : 0;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      className="flex-1 flex-row items-center gap-3"
    >
      {/* --- ICON SLOT: mic on one side of the flip, red dot on the other --- */}
      <View className="h-6 w-5 items-center justify-center">
        {/* The mic. Perspective makes the flip read as 3D, not a squash. */}
        <Animated.View
          style={{
            position: 'absolute',
            opacity: micOpacity,
            transform: [{ perspective: 500 }, { rotateY: micRotateY }, { rotate: micWiggle }]
          }}
        >
          <MicIcon size={20} color={PURPLE} strokeWidth={2.4} />
        </Animated.View>
        {/* The red REC dot, gently breathing while it is showing. */}
        <Animated.View
          style={{
            position: 'absolute',
            opacity: dotOpacity,
            transform: [{ perspective: 500 }, { rotateY: dotRotateY }]
          }}
        >
          <Glow periodMs={900} intensity={0.5}>
            <View style={{ height: 12, width: 12, borderRadius: 6, backgroundColor: REC_RED }} />
          </Glow>
        </Animated.View>
      </View>

      {/* --- MIDDLE: the phrase, the REC word, and the audio wave all overlap
          here. We measure its width so the wave always fills to the right edge. --- */}
      <View
        onLayout={onMiddleLayout}
        className="min-w-0 flex-1 justify-center overflow-hidden"
        style={{ height: 24 }}
      >
        {/* The phrase: each letter spins away on a skewer, then spins back in. */}
        <View className="flex-row items-center">
          {letters.map((l, i) => {
            if (l.k === null) return <View key={`sp-${i}`} style={{ width: 4 }} />;
            const k = l.k;
            // Spin out early (right after the dot appears); spin back in later
            // as the wave drains past.
            const os = 0.05 + k * 0.018;
            const oe = os + 0.05;
            const is = 0.58 + k * 0.018;
            const ie = is + 0.05;
            const rotateX = t.interpolate({
              inputRange: [0, os, oe, is, ie, 1],
              outputRange: ['0deg', '0deg', '-100deg', '-100deg', '0deg', '0deg']
            });
            const opacity = t.interpolate({
              inputRange: [0, os, oe, is, ie, 1],
              outputRange: [1, 1, 0, 0, 1, 1]
            });
            return (
              <Animated.View
                key={`ch-${i}`}
                style={{ opacity, transform: [{ perspective: 500 }, { rotateX }] }}
              >
                <Text className="font-sans-b text-[14px] text-ink">{l.char}</Text>
              </Animated.View>
            );
          })}
        </View>

        {/* The word REC, pinned to the left, spinning off as the phrase returns. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: 0,
            opacity: recOpacity,
            transform: [{ perspective: 500 }, { rotateY: recRotateY }]
          }}
        >
          <Text
            style={{ color: REC_RED, letterSpacing: 1 }}
            className="font-sans-b text-[13px]"
          >
            REC
          </Text>
        </Animated.View>

        {/* The pixel audio wave: packed 3px bars with 1px gaps, measured to
            reach from after REC all the way to the right edge. */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: REC_SLOT,
            top: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            transform: [{ translateX: waveTranslateX }]
          }}
        >
          {bars.map((b, j) => {
            // THIS SECTION DOES: when this bar lights up, then when it drains away.
            const fillOn = 0.28 + j * fillStep;
            const fillIn = fillOn + 0.015;
            const drainOff = 0.6 + j * drainStep;
            const drainOut = drainOff + 0.025;
            const barOpacity = t.interpolate({
              inputRange: [0, fillOn, fillIn, drainOff, drainOut, 1],
              outputRange: [0, 0, 1, 1, 0, 0]
            });
            // THIS SECTION DOES: bounce the bar height so the wave looks alive.
            const height = b.interpolate({
              inputRange: [0, 1],
              outputRange: [4, 8 + (j % 3) * 6]
            });
            return (
              <Animated.View
                key={`bar-${j}`}
                style={{
                  width: BAR_WIDTH,
                  marginRight: BAR_GAP,
                  height,
                  backgroundColor: PURPLE,
                  opacity: barOpacity
                }}
              />
            );
          })}
        </Animated.View>
      </View>
    </View>
  );
}

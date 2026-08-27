// ============================================
// WHAT THIS FILE DOES (plain English):
// Reusable emoji rain. Any screen can import this (quiz button burst, gift
// plugin, Settings preview). Transform + opacity only; skips rain when the
// person has Reduce Motion on (ACCESSIBILITY).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  View,
  type ViewProps
} from 'react-native';

const EMOJIS = ['🎉', '✨', '💫', '🌈', '💛', '🌸', '🍀', '🔥'];
const DROP_COUNT = 14;

export type EmojiRainProps = {
  /** When true, run the rain (or the reduced-motion short hold). */
  active: boolean;
  /** Called when the burst finishes (or is skipped for reduce motion). */
  onDone?: () => void;
  /** Default none so button bursts never steal taps. */
  pointerEvents?: ViewProps['pointerEvents'];
};

type Drop = {
  id: number;
  emoji: string;
  left: number;
  delay: number;
  duration: number;
  drift: number;
};

function makeDrops(): Drop[] {
  return Array.from({ length: DROP_COUNT }, (_, i) => ({
    id: i,
    emoji: EMOJIS[i % EMOJIS.length],
    left: 6 + ((i * 17) % 88),
    delay: (i % 5) * 80,
    duration: 1400 + (i % 4) * 200,
    drift: ((i % 5) - 2) * 12
  }));
}

function EmojiDrop({
  drop,
  reduceMotion,
  onFinished
}: {
  drop: Drop;
  reduceMotion: boolean;
  onFinished?: () => void;
}) {
  const y = useRef(new Animated.Value(-40)).current;
  const x = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      onFinished?.();
      return;
    }

    const anim = Animated.sequence([
      Animated.delay(drop.delay),
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true
        }),
        Animated.timing(y, {
          toValue: 520,
          duration: drop.duration,
          useNativeDriver: true
        }),
        Animated.timing(x, {
          toValue: drop.drift,
          duration: drop.duration,
          useNativeDriver: true
        })
      ]),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true
      })
    ]);

    anim.start(({ finished }) => {
      if (finished) onFinished?.();
    });

    return () => anim.stop();
  }, [drop, reduceMotion, opacity, x, y, onFinished]);

  if (reduceMotion) return null;

  return (
    <Animated.Text
      accessible={false}
      style={[
        styles.drop,
        {
          left: `${drop.left}%`,
          opacity,
          transform: [{ translateY: y }, { translateX: x }]
        }
      ]}
    >
      {drop.emoji}
    </Animated.Text>
  );
}

/** Full-screen (or parent-sized) emoji rain burst. */
export function EmojiRain({
  active,
  onDone,
  pointerEvents = 'none'
}: EmojiRainProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const drops = useRef(makeDrops()).current;
  const finishedCount = useRef(0);
  const doneOnce = useRef(false);

  // ACCESSIBILITY: ask the OS about Reduce Motion before animating.
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!mounted) return;
      setReduceMotion(!!enabled);
      setReady(true);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!active) {
      finishedCount.current = 0;
      doneOnce.current = false;
    }
  }, [active]);

  const finish = () => {
    if (doneOnce.current) return;
    doneOnce.current = true;
    onDone?.();
  };

  // Reduced motion: brief pause then done (no flying emojis).
  useEffect(() => {
    if (!active || !ready || !reduceMotion) return;
    const t = setTimeout(() => finish(), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- finish is stable enough per activation
  }, [active, ready, reduceMotion]);

  function onDropDone() {
    finishedCount.current += 1;
    if (finishedCount.current >= drops.length) {
      finish();
    }
  }

  if (!active || !ready) return null;

  return (
    <View
      pointerEvents={pointerEvents}
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {!reduceMotion
        ? drops.map((d) => (
            <EmojiDrop
              key={d.id}
              drop={d}
              reduceMotion={false}
              onFinished={onDropDone}
            />
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: {
    position: 'absolute',
    top: 0,
    fontSize: 28
  }
});

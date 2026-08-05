// ============================================
// WHAT THIS FILE DOES (plain English):
// Rains a handful of emojis across the screen for a gift delight. Uses only
// transform + opacity animations. If the person has Reduce Motion on, we skip
// the rain and just show the attribution text briefly (ACCESSIBILITY).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  StyleSheet,
  Text,
  View
} from 'react-native';
import type { DelightPluginProps } from '../registry';

const EMOJIS = ['🎉', '✨', '💫', '🌈', '💛', '🌸', '🍀', '🔥'];
const DROP_COUNT = 14;

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

export default function EmojiBombDelight({ attribution, onDone }: DelightPluginProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const [ready, setReady] = useState(false);
  const drops = useRef(makeDrops()).current;
  const finishedCount = useRef(0);

  // ACCESSIBILITY: respect Reduce Motion before we animate anything.
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

  // Reduced motion: show attribution briefly, then done (no rain).
  useEffect(() => {
    if (!ready || !reduceMotion) return;
    const t = setTimeout(() => onDone(), 1600);
    return () => clearTimeout(t);
  }, [ready, reduceMotion, onDone]);

  function onDropDone() {
    finishedCount.current += 1;
    if (finishedCount.current >= drops.length) {
      onDone();
    }
  }

  if (!ready) return null;

  return (
    <View
      pointerEvents="none"
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

      {attribution ? (
        <View style={styles.badge} accessibilityLiveRegion="polite">
          <Text style={styles.badgeText}>{attribution}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  drop: {
    position: 'absolute',
    top: 0,
    fontSize: 28
  },
  badge: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    left: 24,
    right: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(20,20,20,0.82)',
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  badgeText: {
    color: '#F7F4EF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center'
  }
});

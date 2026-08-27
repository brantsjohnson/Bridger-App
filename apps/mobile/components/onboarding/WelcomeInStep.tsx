// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 9 — "You're in." The finish line, and the only place onboarding gets
// marked complete. Confetti rains and a bloom of little circles pops in (both
// turned off when the phone asks for reduced motion), then three cards say what
// actually happens next so "you're in" means something. "Let's go" drops you on
// Home.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, ButtonPrimary, PixelHeading } from '@bridger/ui';

const CONFETTI = ['#6B2FEA', '#FF5A1F', '#00A676', '#FFB515', '#FF3E8A', '#1D6FE8', '#5FBF3A'];

const PIECES = Array.from({ length: 34 }, (_, i) => ({
  id: i,
  color: CONFETTI[i % CONFETTI.length],
  left: (i * 37) % 100,
  delay: (i % 9) * 90,
  duration: 2400 + (i % 5) * 350,
  size: 7 + (i % 4) * 3,
  round: i % 3 === 0
}));

/** What actually happens next, so "you're in" means something. */
const NEXT: Array<{ emoji: string; label: string; line: string; color: string }> = [
  { emoji: '👋', label: 'Add your people', line: 'Bridger is empty until they are here', color: '#6B2FEA' },
  { emoji: '📷', label: 'Post your first story', line: 'One photo, once a day', color: '#FF3E8A' },
  { emoji: '🌿', label: 'Say when you are free', line: 'The whole point is seeing them', color: '#00A676' }
];

const BLOOM = ['#6B2FEA', '#FF3E8A', '#00A676', '#1D6FE8', '#FF5A1F'];
const BLOOM_EMOJI = ['🌻', '🎧', '🌿', '📷', '🚲'];

export function WelcomeInStep({ onDone }: { onDone: () => void }) {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  return (
    <View className="relative h-full flex-1 overflow-hidden bg-amber">
      {!reduceMotion ? <Confetti /> : null}

      <View className="relative flex-1 justify-between px-6 pb-8 pt-14">
        <View>
          <View className="self-start rounded-full bg-ink px-3 py-1.5">
            <Text className="font-sans-b text-[12px] text-canvas">That is everything we need</Text>
          </View>
          <PixelHeading size="lg" className="mt-3 text-[40px] leading-[1.05] text-onaccent">
            You're in.
          </PixelHeading>
          <Text className="mt-2 max-w-[280px] font-sans-sb text-[15px] leading-snug text-onaccent/85">
            No feed to scroll. Just the people you actually know.
          </Text>
        </View>

        <Bloom reduceMotion={reduceMotion} />

        <AnalyticsRegion analyticsId={ONBOARDING.welcome_in.next_cards} interactive={false}>
          <View className="gap-2.5">
            {NEXT.map((n) => (
              <View
                key={n.label}
                className="flex-row items-center gap-3 rounded-card border-2 border-ink bg-canvas px-3.5 py-2.5"
              >
                <View
                  accessible={false}
                  className="h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: n.color }}
                >
                  <Text className="text-[18px]">{n.emoji}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="font-sans-b text-[14px] text-ink">
                    {n.label}
                  </Text>
                  <Text numberOfLines={1} className="font-sans-sb text-[12px] text-ink-mute">
                    {n.line}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </AnalyticsRegion>

        <View className="gap-2.5 pt-2">
          <ButtonPrimary
            full
            analyticsId={ONBOARDING.welcome_in.lets_go}
            onPress={onDone}
            accessibilityLabel="Let's go"
          >
            Let's go
          </ButtonPrimary>
        </View>
      </View>
    </View>
  );
}

/** The falling confetti — decorative, only mounts when motion is allowed. */
function Confetti() {
  const { height } = useWindowDimensions();
  return (
    <View pointerEvents="none" className="absolute inset-0 overflow-hidden" accessible={false}>
      {PIECES.map((p) => (
        <ConfettiPiece key={p.id} piece={p} travel={height + 60} />
      ))}
    </View>
  );
}

function ConfettiPiece({
  piece,
  travel
}: {
  piece: (typeof PIECES)[number];
  travel: number;
}) {
  const y = useRef(new Animated.Value(-40)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(piece.delay),
        Animated.timing(y, {
          toValue: travel,
          duration: piece.duration,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true
        }),
        Animated.timing(y, { toValue: -40, duration: 0, useNativeDriver: true }),
        Animated.delay(1200)
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [y, piece.delay, piece.duration, travel]);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: `${piece.left}%`,
        width: piece.size,
        height: piece.size * (piece.round ? 1 : 1.8),
        backgroundColor: piece.color,
        borderRadius: piece.round ? 999 : 2,
        transform: [{ translateY: y }]
      }}
    />
  );
}

/** The mark: a bloom of circles around the bridge glyph. */
function Bloom({ reduceMotion }: { reduceMotion: boolean }) {
  const scale = useRef(new Animated.Value(reduceMotion ? 1 : 0.6)).current;

  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      return;
    }
    const anim = Animated.spring(scale, {
      toValue: 1,
      stiffness: 220,
      damping: 16,
      mass: 1,
      useNativeDriver: true
    });
    anim.start();
    return () => anim.stop();
  }, [reduceMotion, scale]);

  return (
    <Animated.View
      accessible={false}
      className="mx-auto h-44 w-44 items-center justify-center"
      style={{ transform: [{ scale }] }}
    >
      {BLOOM.map((c, i) => {
        const angle = (i / BLOOM.length) * Math.PI * 2 - Math.PI / 2;
        return (
          <View
            key={c}
            className="absolute h-14 w-14 items-center justify-center rounded-full border-2 border-ink"
            style={{
              backgroundColor: c,
              left: 88 + Math.cos(angle) * 56 - 28,
              top: 88 + Math.sin(angle) * 56 - 28
            }}
          >
            <Text className="text-[22px]">{BLOOM_EMOJI[i]}</Text>
          </View>
        );
      })}
      <View className="h-[72px] w-[72px] items-center justify-center rounded-full border-2 border-ink bg-canvas">
        <Text className="text-[30px]">🌉</Text>
      </View>
    </Animated.View>
  );
}

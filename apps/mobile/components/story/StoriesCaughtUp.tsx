// ============================================
// WHAT THIS FILE DOES (plain English):
// The end of the story tray. After you finish every friend's updates, this
// full-screen beat says "You're all caught up" with a short confetti rain
// (skipped when Reduce Motion is on), then a Done button that closes the player.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Pressable,
  Text,
  View,
  useWindowDimensions
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { XIcon } from 'lucide-react-native';
import { STORY, trackProduct } from '@bridger/shared';
import {
  AnalyticsRegion,
  ButtonPrimary,
  PixelHeading,
  withAnalyticsPress
} from '@bridger/ui';

/** Accent colors for the falling bits — same family as onboarding welcome-in. */
const CONFETTI = ['#6B2FEA', '#FF5A1F', '#00A676', '#FFB515', '#FF3E8A', '#1D6FE8', '#5FBF3A'];

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: CONFETTI[i % CONFETTI.length]!,
  left: (i * 37) % 100,
  delay: (i % 9) * 90,
  duration: 2200 + (i % 5) * 320,
  size: 7 + (i % 4) * 3,
  round: i % 3 === 0
}));

type Props = {
  onDone: () => void;
};

export function StoriesCaughtUp({ onDone }: Props) {
  const insets = useSafeAreaInsets();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener?.('reduceMotionChanged', setReduceMotion);
    return () => sub?.remove?.();
  }, []);

  // Product outcome: they finished the tray (confirmed by showing this screen).
  useEffect(() => {
    trackProduct('stories_caught_up');
  }, []);

  return (
    <View className="relative flex-1 overflow-hidden bg-amber">
      {/* ACCESSIBILITY: confetti is decorative only; the headline says the news. */}
      {!reduceMotion ? <Confetti /> : null}

      <View
        className="absolute inset-x-0 top-0 z-20 flex-row justify-end px-4"
        style={{ paddingTop: Math.max(insets.top, 12) }}
      >
        <Pressable
          onPress={withAnalyticsPress(STORY.viewer.caught_up_done, onDone)}
          accessibilityRole="button"
          accessibilityLabel="Close"
          className="h-9 w-9 items-center justify-center rounded-full bg-white"
        >
          <XIcon size={20} color="#1C1B16" strokeWidth={2.6} />
        </Pressable>
      </View>

      <View className="relative flex-1 items-center justify-center px-8">
        <AnalyticsRegion analyticsId={STORY.viewer.caught_up_body} interactive={false}>
          <View className="items-center">
            <Text accessible={false} className="mb-4 text-[56px]">
              ✨
            </Text>
            <PixelHeading size="lg" className="text-center text-[36px] leading-[1.05]">
              You're all caught up
            </PixelHeading>
            <Text className="mt-3 max-w-[280px] text-center font-sans-sb text-[15px] leading-snug text-ink">
              That's everyone for now. Come back when your people post again.
            </Text>
          </View>
        </AnalyticsRegion>

        <View className="mt-10 w-full max-w-[280px]">
          <ButtonPrimary
            full
            analyticsId={STORY.viewer.caught_up_done}
            onPress={onDone}
            accessibilityLabel="Done"
          >
            Done
          </ButtonPrimary>
        </View>
      </View>
    </View>
  );
}

/** Falling confetti — decorative, only mounts when motion is allowed. */
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

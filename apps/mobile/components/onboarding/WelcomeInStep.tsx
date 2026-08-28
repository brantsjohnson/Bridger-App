// ============================================
// WHAT THIS FILE DOES (plain English):
// Step 9, "You're in." The finish line, and the only place onboarding gets
// marked complete. A small green tag, the giant blue all-caps "You're in." on
// the tan onboarding paper, then three white cards saying what actually happens
// next so "you're in" means something. "Let's go" drops you on Home.
//
// This screen has no step bar and no back arrow on purpose: onboarding is over.
//
// ACCESSIBILITY: the falling confetti is decorative, hidden from screen readers,
// and it does not mount at all when the phone asks for reduced motion.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ONBOARDING } from '@bridger/shared';
import { AnalyticsRegion, SynthGrid, useGridColor, useReduceMotion, useThemeColors } from '@bridger/ui';
import { OB, OB_BORDER } from './onboarding-theme';
import { OBBody, OBCTA, OBHardShadow, OBHeading } from './onboarding-ui';

/** Little squares of paper that fall behind the words. Decoration only. */
const CONFETTI = [OB.blue, OB.pink, OB.amber, OB.green, OB.periwinkle, OB.orange];

const PIECES = Array.from({ length: 28 }, (_, i) => ({
  id: i,
  color: CONFETTI[i % CONFETTI.length],
  left: (i * 37) % 100,
  delay: (i % 9) * 90,
  duration: 2400 + (i % 5) * 350,
  size: 7 + (i % 4) * 3
}));

/** What actually happens next, so "you're in" means something. */
const NEXT: Array<{ label: string; line: string; edge: string }> = [
  { label: 'Add your people', line: 'Bridger is empty until they are here', edge: OB.pink },
  { label: 'Complete your profile', line: 'So friends know who they are talking to', edge: OB.amber },
  { label: "Say when you're free", line: 'The whole point is seeing them', edge: OB.green }
];

export function WelcomeInStep({ onDone }: { onDone: () => void }) {
  const reduceMotion = useReduceMotion();
  const insets = useSafeAreaInsets();
  const theme = useThemeColors();
  const { gridColor } = useGridColor();
  return (
    // Same eggshell + SynthGrid backdrop as Home and every other onboarding step.
    <View
      className="flex-1 bg-canvas"
      style={{
        flex: 1,
        width: '100%',
        alignSelf: 'stretch',
        height: '100%',
        backgroundColor: theme.canvas,
        overflow: 'hidden'
      }}
    >
      <SynthGrid strength="normal" color={gridColor} />
      <View className="relative z-10 flex-1" style={{ backgroundColor: 'transparent' }}>
      {!reduceMotion ? <Confetti /> : null}

      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingTop: insets.top + 40,
          paddingBottom: Math.max(insets.bottom, 16) + 16
        }}
      >
        {/* THE MOMENT: the green tag, the giant line, and the promise. */}
        <View style={{ gap: 14 }}>
          <View
            style={{
              alignSelf: 'flex-start',
              backgroundColor: OB.green,
              paddingHorizontal: 11,
              paddingVertical: 7
            }}
          >
            <Text className="font-sans-sb text-[12px]" style={{ letterSpacing: 0.6, color: OB.onColor }}>
              That is everything we need
            </Text>
          </View>
          <OBHeading style={{ fontSize: 72, lineHeight: 64, letterSpacing: -2.6 }}>
            You're in.
          </OBHeading>
          <OBBody>No feed to scroll. Just the people you actually know.</OBBody>
        </View>

        {/* WHAT HAPPENS NEXT: three white cards, each with a colored edge. */}
        <AnalyticsRegion analyticsId={ONBOARDING.welcome_in.next_cards} interactive={false}>
          <View style={{ gap: 12 }}>
            {NEXT.map((n) => (
              <OBHardShadow key={n.label} color={OB.periwinkle} offset={4}>
                <View
                  style={{
                    flexDirection: 'row',
                    backgroundColor: OB.paper,
                    borderWidth: OB_BORDER,
                    borderColor: OB.borderMuted
                  }}
                >
                  <View style={{ width: 5, backgroundColor: n.edge }} accessible={false} />
                  <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 16, paddingVertical: 14 }}>
                    <Text className="font-sans-b text-[17px]" style={{ color: OB.blue }}>
                      {n.label}
                    </Text>
                    <Text className="text-[13px]" style={{ marginTop: 3, color: OB.inkSoft }}>
                      {n.line}
                    </Text>
                  </View>
                </View>
              </OBHardShadow>
            ))}
          </View>
        </AnalyticsRegion>

        {/* THE WAY IN: the one pink button that finishes onboarding. */}
        <View style={{ paddingTop: 8 }}>
          <OBCTA
            label="Let's go"
            analyticsId={ONBOARDING.welcome_in.lets_go}
            onPress={onDone}
            accessibilityLabel="Let's go"
          />
        </View>
      </View>
      </View>
    </View>
  );
}

/** The falling confetti, decorative, only mounts when motion is allowed. */
function Confetti() {
  const { height } = useWindowDimensions();
  return (
    <View
      pointerEvents="none"
      accessible={false}
      style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, overflow: 'hidden' }}
    >
      {PIECES.map((p) => (
        <ConfettiPiece key={p.id} piece={p} travel={height + 60} />
      ))}
    </View>
  );
}

function ConfettiPiece({ piece, travel }: { piece: (typeof PIECES)[number]; travel: number }) {
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
        height: piece.size * 1.8,
        backgroundColor: piece.color,
        transform: [{ translateY: y }]
      }}
    />
  );
}

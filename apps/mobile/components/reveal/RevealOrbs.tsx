// ============================================
// WHAT THIS FILE DOES (plain English):
// The signature moment on Reveal Screen 1. Two profile photos (you + them)
// float in from opposite sides, meet in the middle, then dissolve into two
// see-through circles — yours yellow, theirs green — whose overlap turns
// orange, like two colors of light mixing. That orange middle is "what you
// two share." Decorative; the screen reader just hears the strongest thing.
// ACCESSIBILITY: reduce-motion skips the float and shows the circles straight.
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, G } from 'react-native-svg';
import type { Accent } from '@bridger/shared';
import { REVEAL } from '@bridger/shared';
import { Avatar, AnalyticsRegion } from '@bridger/ui';
import { runVennMergeHaptics } from '../../lib/celebration-haptics';

type Props = {
  /** You */
  me: { name: string; emoji?: string; accent: Accent; id: string };
  /** The new connection */
  them: { name: string; emoji?: string; accent: Accent; id: string };
  /** Spoken description — the strongest shared thing */
  label: string;
};

// --- LAYOUT: circle geometry (kept in sync with the SVG below) ---
const W = 300;
const H = 176;
const R = 70; // circle radius
const CY = H / 2;
const LEFT_CX = 108; // your circle center x
const RIGHT_CX = 192; // their circle center x
/** Faces match the color circles (diameter = 2R), not the smaller xl avatar. */
const FACE = R * 2;

// --- COLORS: your yellow + their green, mixing to orange in the middle ---
const YELLOW = '#FFD400';
const GREEN = '#5FBF3A';
const ORANGE = '#FF7A1A';

export function RevealOrbs({ me, them, label }: Props) {
  const [reduceMotion, setReduceMotion] = useState(false);

  // Faces slide in from the sides, then fade out as the circles fade in.
  const meX = useRef(new Animated.Value(-170)).current;
  const themX = useRef(new Animated.Value(170)).current;
  const faces = useRef(new Animated.Value(0)).current; // face opacity
  const circles = useRef(new Animated.Value(0)).current; // circle opacity

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
      // No motion: skip straight to the mixed circles.
      meX.setValue(0);
      themX.setValue(0);
      faces.setValue(0);
      circles.setValue(1);
      return;
    }

    meX.setValue(-170);
    themX.setValue(170);
    faces.setValue(0);
    circles.setValue(0);

    const cancelHaptics = runVennMergeHaptics(false);

    const run = Animated.sequence([
      // 1) float the two faces in from opposite sides
      Animated.parallel([
        Animated.timing(faces, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(meX, { toValue: 0, duration: 620, useNativeDriver: true }),
        Animated.timing(themX, { toValue: 0, duration: 620, useNativeDriver: true })
      ]),
      Animated.delay(260),
      // 2) faces dissolve into the transparent color circles
      Animated.parallel([
        Animated.timing(faces, { toValue: 0, duration: 420, useNativeDriver: true }),
        Animated.timing(circles, { toValue: 1, duration: 520, useNativeDriver: true })
      ])
    ]);
    run.start();
    return () => {
      run.stop();
      cancelHaptics();
    };
  }, [reduceMotion, meX, themX, faces, circles]);

  return (
    <AnalyticsRegion analyticsId={REVEAL.flow.orbs} interactive={false}>
      <View
        accessible
        accessibilityRole="image"
        accessibilityLabel={`What connects you most: ${label}`}
        style={{ width: W, height: H }}
      >
        {/* The mixed color circles (fade in) */}
        <Animated.View
          pointerEvents="none"
          style={{ position: 'absolute', inset: 0, opacity: circles }}
        >
          <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
            <Defs>
              {/* clip = your circle, so drawing their circle inside it paints only the overlap */}
              <ClipPath id="lens">
                <Circle cx={LEFT_CX} cy={CY} r={R} />
              </ClipPath>
            </Defs>
            <Circle cx={LEFT_CX} cy={CY} r={R} fill={YELLOW} fillOpacity={0.82} />
            <Circle cx={RIGHT_CX} cy={CY} r={R} fill={GREEN} fillOpacity={0.82} />
            {/* the overlap lens turns orange */}
            <G clipPath="url(#lens)">
              <Circle cx={RIGHT_CX} cy={CY} r={R} fill={ORANGE} fillOpacity={0.95} />
            </G>
          </Svg>
        </Animated.View>

        {/* Your face — floats in from the left, sits on your circle */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: LEFT_CX - FACE / 2,
            top: CY - FACE / 2,
            opacity: faces,
            transform: [{ translateX: meX }]
          }}
        >
          <Avatar
            name={me.name}
            emoji={me.emoji}
            accent={me.accent}
            personId={me.id}
            diameter={FACE}
          />
        </Animated.View>

        {/* Their face — floats in from the right, sits on their circle */}
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: RIGHT_CX - FACE / 2,
            top: CY - FACE / 2,
            opacity: faces,
            transform: [{ translateX: themX }]
          }}
        >
          <Avatar
            name={them.name}
            emoji={them.emoji}
            accent={them.accent}
            personId={them.id}
            diameter={FACE}
          />
        </Animated.View>
      </View>
    </AnalyticsRegion>
  );
}

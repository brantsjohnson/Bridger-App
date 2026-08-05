// ============================================
// WHAT THIS FILE DOES (plain English):
// The colored outline that goes around a story tile or an avatar. The color
// says how close that person is to you (yellow = you, green = close friend,
// blue = friend, orange = acquaintance), so you can tell at a glance without
// reading a label. Pass `soft` for the lightened version, which we use in
// Messages to mean "you already replied, nothing needed from you".
//
// Pass `spin` and the gradient TRAVELS around the outline — the Instagram-story
// look. Nothing grows or fades; the color just keeps moving around the edge.
//
// If you change the colors, change them in tokens (TIER_GRADIENT), not here.
// ACCESSIBILITY: the ring is decoration only — never the sole way we convey
// something, so the name/label next to it always says the same thing in words.
// The spin stops entirely when Reduce Motion is on.
// ============================================
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TIER_GRADIENT, type RingTone } from '../tokens';
import { NATIVE_DRIVER, useReduceMotion } from '../lib/whimsy';

/**
 * A soft dark drop shadow so a ring separates from a card of the same color
 * (e.g. a blue ring on a blue Friends card). Works on iOS (shadow*) and
 * Android (elevation).
 */
const RING_SHADOW: ViewStyle = {
  shadowColor: '#000000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.35,
  shadowRadius: 5,
  elevation: 6
};

export function GradientRing({
  tone,
  soft = false,
  colors,
  radius,
  width = 3,
  fill = false,
  spin = false,
  shadow = false,
  style,
  children
}: {
  /** Tier palette (ignored when `colors` is passed). */
  tone?: RingTone;
  /** lightened version — "nothing needed from you right now" */
  soft?: boolean;
  /**
   * Override the tier palette with your own gradient stops. Two colors for a
   * simple fade, or three for the Instagram-style multi-color story ring.
   */
  colors?: readonly string[];
  /** outer corner radius; the inner hole is this minus the ring width */
  radius: number;
  /** how thick the colored ring is, in pixels */
  width?: number;
  /** stretch to fill the parent (story tiles) instead of hugging the child (avatars) */
  fill?: boolean;
  /** make the gradient travel around the outline, Instagram-story style */
  spin?: boolean;
  /** drop a soft shadow behind the ring so it lifts off a same-color card */
  shadow?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const stops = colors ?? TIER_GRADIENT[tone ?? 'friend'][soft ? 'soft' : 'strong'];
  const shadowStyle = shadow ? { ...RING_SHADOW, borderRadius: radius } : null;

  if (!spin) {
    return (
      <LinearGradient
        colors={stops as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        // The ring is literally padding: the gradient shows through around the
        // child, which sits in the middle with a slightly smaller radius.
        style={[{ padding: width, borderRadius: radius }, shadowStyle, style]}
      >
        <View
          style={{
            borderRadius: Math.max(0, radius - width),
            overflow: 'hidden',
            ...(fill ? { flex: 1 } : null)
          }}
          accessible={false}
        >
          {children}
        </View>
      </LinearGradient>
    );
  }

  return (
    <SpinningRing stops={stops} radius={radius} width={width} fill={fill} shadow={shadow} style={style}>
      {children}
    </SpinningRing>
  );
}

/**
 * Mirror the color stops into a palindrome (e.g. blue, light, purple, light,
 * blue) so that as the gradient rotates a full turn, the last color always
 * meets the first — the band travels smoothly and never jumps at the seam.
 */
function seamless(stops: readonly string[]): [string, string, ...string[]] {
  const first = stops[0] ?? '#FFFFFF';
  if (stops.length < 2) return [first, first];
  const back = stops.slice(0, -1).reverse();
  return [first, stops[1]!, ...stops.slice(2), ...back];
}

/**
 * The moving version. A gradient square bigger than the tile sits underneath and
 * turns slowly; the tile's rounded frame crops it, so all you ever see is color
 * sliding around the border. The stops are mirrored so the band never jumps
 * when it comes back around.
 */
function SpinningRing({
  stops,
  radius,
  width,
  fill,
  shadow = false,
  style,
  children
}: {
  stops: readonly string[];
  radius: number;
  width: number;
  fill: boolean;
  shadow?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const reduce = useReduceMotion();
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: NATIVE_DRIVER
      })
    );
    loop.start();
    return () => loop.stop();
  }, [spin, reduce]);

  // The spinner itself must clip (overflow hidden) so the rotating gradient
  // only shows as a ring. That clipping would also hide a shadow, so when we
  // want a shadow we wrap the spinner in an outer View that does NOT clip.
  // IMPORTANT: the spinner still gets flex:1 / fill styles — without that the
  // story tiles collapse to empty outlines (seen after the shadow change).
  const spinner = (
    <View
      accessible={false}
      style={[
        {
          padding: width,
          borderRadius: radius,
          overflow: 'hidden',
          // Story tiles (fill) need flex:1 so the photo fills the card. Avatars
          // hug their face and must NOT get flex:1 or they can collapse.
          ...(fill ? { flex: 1 } : null)
        },
        // When there is no shadow wrapper, style lands here. With a shadow
        // wrapper, style goes on the outer View instead.
        shadow ? null : style
      ]}
    >
      {/*
        The gradient layer is drawn at 240% of the tile and centered, which is
        always big enough to keep the corners covered as it turns — so we never
        have to measure anything, and it starts spinning the moment it mounts.
      */}
      <Animated.View
        pointerEvents="none"
        style={{
          position: 'absolute',
          left: '-70%',
          top: '-70%',
          width: '240%',
          height: '240%',
          transform: [
            {
              rotate: spin.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg']
              })
            }
          ]
        }}
      >
        <LinearGradient
          colors={seamless(stops)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ width: '100%', height: '100%' }}
        />
      </Animated.View>

      <View
        style={{
          borderRadius: Math.max(0, radius - width),
          overflow: 'hidden',
          ...(fill ? { flex: 1 } : null)
        }}
        accessible={false}
      >
        {children}
      </View>
    </View>
  );

  if (!shadow) return spinner;

  // Outer wrapper carries the shadow (no clipping) around the spinning ring.
  return (
    <View
      accessible={false}
      style={[
        { borderRadius: radius, ...(fill ? { flex: 1 } : null) },
        RING_SHADOW,
        style
      ]}
    >
      {spinner}
    </View>
  );
}

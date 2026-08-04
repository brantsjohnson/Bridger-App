// ============================================
// WHAT THIS FILE DOES (plain English):
// The colored outline that goes around a story tile or an avatar. The color
// says how close that person is to you (yellow = you, green = close friend,
// blue = friend, orange = acquaintance), so you can tell at a glance without
// reading a label. Pass `soft` for the lightened version, which we use in
// Messages to mean "you already replied, nothing needed from you".
// If you change the colors, change them in tokens (TIER_GRADIENT), not here.
// ACCESSIBILITY: the ring is decoration only — never the sole way we convey
// something, so the name/label next to it always says the same thing in words.
// ============================================
import React from 'react';
import { View, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TIER_GRADIENT, type RingTone } from '../tokens';

export function GradientRing({
  tone,
  soft = false,
  radius,
  width = 3,
  fill = false,
  style,
  children
}: {
  tone: RingTone;
  /** lightened version — "nothing needed from you right now" */
  soft?: boolean;
  /** outer corner radius; the inner hole is this minus the ring width */
  radius: number;
  /** how thick the colored ring is, in pixels */
  width?: number;
  /** stretch to fill the parent (story tiles) instead of hugging the child (avatars) */
  fill?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
}) {
  const colors = TIER_GRADIENT[tone][soft ? 'soft' : 'strong'];

  return (
    <LinearGradient
      colors={colors}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      // The ring is literally padding: the gradient shows through around the
      // child, which sits in the middle with a slightly smaller radius.
      style={[{ padding: width, borderRadius: radius }, style]}
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

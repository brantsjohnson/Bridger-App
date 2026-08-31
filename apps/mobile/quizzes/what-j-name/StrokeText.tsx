// ============================================
// WHAT THIS FILE DOES (plain English):
// Draws a word with a thick outline around it, the way the poster headline
// ("WHAT J-NAME ARE YOU?") and the "RED FLAGS" title are drawn.
//
// React Native has no outline-text setting, so we cheat the same way sign
// painters do: print the word several times in the outline color, nudged a
// little in every direction, then print it once more in the real color right
// on top. The nudged copies peek out around the edges and read as an outline.
// ============================================

import React from 'react';
import { Text, View, type TextStyle } from 'react-native';

// THIS SECTION DOES: the sixteen directions the outline copies are nudged in.
// Sixteen is enough that the outline looks like a smooth ring, not a plus sign.
const RING = Array.from({ length: 16 }, (_, i) => {
  const angle = (i / 16) * Math.PI * 2;
  return { x: Math.cos(angle), y: Math.sin(angle) };
});

export type StrokeTextProps = {
  children: string;
  /** How thick the outline is, in points. */
  stroke: number;
  /** The outline color (usually white or cream on this poster). */
  strokeColor: string;
  /** Everything else about the type: family, size, color, spacing. */
  style: TextStyle;
  /** Optional: center the word in its parent (reveal screen). */
  center?: boolean;
};

export function StrokeText({
  children,
  stroke,
  strokeColor,
  style,
  center
}: StrokeTextProps) {
  return (
    // The wrapper shrinks to the word, and the outline copies are stacked
    // behind it absolutely so they take up no extra space.
    <View style={{ alignSelf: center ? 'center' : 'flex-start' }}>
      {/* ACCESSIBILITY: only the top (real) copy is read out; the outline
          copies are hidden from screen readers so the word is not repeated. */}
      {RING.map((d, i) => (
        <Text
          key={i}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[
            style,
            {
              position: 'absolute',
              left: d.x * stroke,
              top: d.y * stroke,
              color: strokeColor
            }
          ]}
        >
          {children}
        </Text>
      ))}
      <Text accessibilityRole="header" style={style}>
        {children}
      </Text>
    </View>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The official Spotify and Apple Music logo marks as small SVG icons. Used on
// the onboarding "song on repeat" screen so Connect Spotify / Connect Apple
// Music look like the real brands, not a generic music note.
//
// BRAND RULE: do not recolor either mark. Do not put the Spotify green mark on
// a green background. Keep clear space around each mark. These paths are the
// official marks and must not be restyled.
// ============================================
import React from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// ACCESSIBILITY: hide decorative brand marks from screen readers. On web,
// accessibilityElementsHidden cannot sit on <Svg> itself (it leaks onto the
// DOM <svg> and React warns), so we wrap the mark in a View instead.
const decorativeA11y = {
  accessible: false as const,
  accessibilityElementsHidden: true as const,
  importantForAccessibility: 'no-hide-descendants' as const,
};

/**
 * Spotify three-wave mark in white. Sit it on #1DB954 (Spotify green), never
 * on another green, so the mark stays readable and on-brand.
 */
export function SpotifyMark({ size = 22 }: { size?: number }) {
  return (
    <View {...decorativeA11y}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill="#FFFFFF"
          d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
        />
      </Svg>
    </View>
  );
}

/**
 * The Apple mark in white, drawn from the official outline so the apple and its
 * leaf sit where they should. Sit it on black / near-black so it matches Apple's
 * own dark badge.
 */
export function AppleMusicMark({ size = 22 }: { size?: number }) {
  return (
    <View {...decorativeA11y}>
      <Svg width={size} height={size} viewBox="0 0 24 24">
        <Path
          fill="#FFFFFF"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.208-1.23-3.234-4.882-.026-3.053 2.494-4.52 2.61-4.599-1.442-2.129-3.675-2.366-4.437-2.405-1.585-.13-3.31.9-4.062.9zm3.378-3.066c.72-.868 1.207-2.076 1.075-3.276-1.06.043-2.34.708-3.128 1.594-.707.784-1.324 2.038-1.157 3.213 1.183.092 2.394-.6 3.21-1.53z"
        />
      </Svg>
    </View>
  );
}

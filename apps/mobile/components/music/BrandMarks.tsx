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
import Svg, { Path } from 'react-native-svg';

/**
 * Spotify three-wave mark in white. Sit it on #1DB954 (Spotify green), never
 * on another green, so the mark stays readable and on-brand.
 */
export function SpotifyMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill="#FFFFFF"
        d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"
      />
    </Svg>
  );
}

/**
 * Apple Music note mark in white. Sit it on black / near-black so it matches
 * Apple's dark Music pill.
 */
export function AppleMusicMark({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        fill="#FFFFFF"
        d="M19.5 8.64c-.024 2.736 2.4 3.648 2.424 3.66-.024.072-.384 1.32-1.26 2.604-.756 1.116-1.548 2.22-2.772 2.244-1.2.024-1.584-.72-2.964-.72-1.356 0-1.788.696-2.904.744-1.164.048-2.052-1.212-2.82-2.316-1.56-2.268-2.748-6.408-1.14-9.204.804-1.392 2.232-2.268 3.78-2.292 1.176-.024 2.292.792 2.964.792.672 0 2.028-.972 3.42-.828.576.024 2.208.24 3.252 1.8-.084.048-1.944 1.14-1.92 3.396zm-3.482-6.624c.12 1.248-.36 2.472-1.068 3.336-.72.888-1.908 1.572-3.072 1.476-.144-1.2.42-2.46 1.128-3.312.768-.924 2.04-1.62 3.012-1.5z"
      />
    </Svg>
  );
}

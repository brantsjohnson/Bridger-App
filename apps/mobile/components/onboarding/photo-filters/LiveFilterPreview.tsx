// ============================================
// WHAT THIS FILE DOES (plain English):
// Instant on-device preview for Comic / Sepia / X-ray while the server bake
// runs (or if it fails). Same idea as Pop art's Warhol grid: an SVG color
// matrix paints over the photo so tapping a filter pill never looks dead.
// The saved avatar still prefers the server bake when it finishes.
// ============================================
import React, { useId } from 'react';
import { Image, View } from 'react-native';
import Svg, { FeColorMatrix, Filter, Image as SvgImage } from 'react-native-svg';
import type { PhotoFilterKey } from '../PhotoFilterPicker';

const FILL = {
  position: 'absolute' as const,
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  width: '100%' as const,
  height: '100%' as const
};

/**
 * SVG feColorMatrix values (4x5) for instant previews.
 * Sepia: warm brown remapping. X-ray: invert toward cool. Comic: punchy contrast.
 */
function matrixFor(filter: Exclude<PhotoFilterKey, 'pop_art'>): number[] {
  if (filter === 'sepia') {
    // Classic photographic sepia (R > G > B from luminance).
    return [
      0.393, 0.769, 0.189, 0, 0,
      0.349, 0.686, 0.168, 0, 0,
      0.272, 0.534, 0.131, 0, 0,
      0, 0, 0, 1, 0
    ];
  }
  if (filter === 'x_ray') {
    // Invert + slight cool wash so it reads as an X-ray, not plain B&W.
    return [
      -0.9, -0.05, -0.05, 0, 1,
      -0.05, -0.85, -0.05, 0, 1,
      -0.02, -0.02, -0.7, 0, 1.05,
      0, 0, 0, 1, 0
    ];
  }
  // Comic: stronger contrast / punch (preview only; server does the ink work).
  return [
    1.4, -0.1, -0.1, 0, -0.05,
    -0.1, 1.35, -0.1, 0, -0.05,
    -0.05, -0.05, 1.3, 0, -0.02,
    0, 0, 0, 1, 0
  ];
}

export function LiveFilterPreview({
  uri,
  filter
}: {
  uri: string;
  filter: Exclude<PhotoFilterKey, 'pop_art'>;
}) {
  const idPrefix = useId();
  // RN SVG wants a stable id without colons from useId().
  const filterId = `live-filter-${idPrefix.replace(/:/g, '')}`;
  // number[] matches WarholPhoto (string form crashed some iOS SVG builds).
  const values = matrixFor(filter);

  return (
    <View style={FILL} accessible={false}>
      {/* Underlay: if SVG color matrix fails on a device, the photo still shows
          (never a blank well while the Sepia / Comic pill looks selected). */}
      <Image source={{ uri }} resizeMode="cover" style={FILL} />
      <Svg width="100%" height="100%" style={FILL}>
        <Filter id={filterId}>
          <FeColorMatrix type="matrix" values={values} />
        </Filter>
        <SvgImage
          href={{ uri }}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="xMidYMid slice"
          filter={`url(#${filterId})`}
        />
      </Svg>
    </View>
  );
}

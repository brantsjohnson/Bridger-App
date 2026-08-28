// ============================================
// WHAT THIS FILE DOES (plain English):
// Draws the "Pop art" version of a profile photo: the same photo shown four
// times in a 2x2 grid, each copy repainted in a different bright color pair
// (the Andy Warhol look). It fills whatever square box it is placed inside.
//
// HOW IT WORKS (technical): each of the four squares is its own tiny SVG that
// draws the photo through a `feColorMatrix` filter (the recipe from warhol.ts).
// `preserveAspectRatio="xMidYMid slice"` makes the photo cover the square (crop,
// not squish), so a portrait selfie still fills each cell edge to edge. Pop art
// alone zooms in 15% so the face sits tighter in frame (see POP_ART_ZOOM).
// ============================================
import React, { useId } from 'react';
import { View } from 'react-native';
import Svg, { FeColorMatrix, Filter, Image as SvgImage } from 'react-native-svg';
import { WARHOL_PALETTES, warholMatrix } from './warhol';

/** Pop art only: zoom in 15% so the face fills the square a little tighter. */
const POP_ART_ZOOM = 1.15;
const POP_ART_SIZE = `${POP_ART_ZOOM * 100}%`;
const POP_ART_OFFSET = `${-((POP_ART_ZOOM - 1) * 100) / 2}%`;

export function WarholPhoto({ uri }: { uri: string }) {
  // THIS SECTION DOES: a stable, unique prefix so each square's filter id never
  // clashes with another WarholPhoto on screen.
  const idPrefix = useId();

  return (
    <View
      accessible={false}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        flexDirection: 'row',
        flexWrap: 'wrap'
      }}
    >
      {WARHOL_PALETTES.map((palette, index) => {
        const filterId = `warhol-${idPrefix}-${index}`;
        return (
          <View key={filterId} style={{ width: '50%', height: '50%' }}>
            <Svg width="100%" height="100%">
              {/* THE RECIPE: recolor this square's copy of the photo. */}
              <Filter id={filterId}>
                <FeColorMatrix type="matrix" values={warholMatrix(palette)} />
              </Filter>
              {/* THE PHOTO: cover-cropped, zoomed in 15% for pop art, then recolored. */}
              <SvgImage
                href={{ uri }}
                x={POP_ART_OFFSET}
                y={POP_ART_OFFSET}
                width={POP_ART_SIZE}
                height={POP_ART_SIZE}
                preserveAspectRatio="xMidYMid slice"
                filter={`url(#${filterId})`}
              />
            </Svg>
          </View>
        );
      })}
    </View>
  );
}

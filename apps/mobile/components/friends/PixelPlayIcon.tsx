// ============================================
// WHAT THIS FILE DOES (plain English):
// A round pixel-art play button drawn with SVG rectangles (no PNG). Built as a
// true circle on a square grid, with:
//   1. An inset ring just inside the disc edge
//   2. A darker 3D extrusion under the bottom (different color from the face)
//   3. A hollow play triangle in the center
//
// Outside the silhouette is transparent, so rocking never flashes a square.
// Pass light/dark color sets from the parent: black card → white button,
// white card → black button.
// ============================================
import React, { useMemo } from 'react';
import Svg, { Rect } from 'react-native-svg';

/** Face grid (perfect circle). Extra rows below hold the extrusion. */
const FACE_N = 32;
const DEPTH = 3;
const GRID_W = FACE_N;
const GRID_H = FACE_N + DEPTH;

/** Exported so the widget can size width/height in proportion. */
export const PLAY_GRID_W = GRID_W;
export const PLAY_GRID_H = GRID_H;

// Layer ids
const EMPTY = 0;
const EX_DEEP = 1;
const EX_MID = 2;
const FACE_EDGE = 3;
const FACE = 4;
const FACE_CTR = 5;
const BORDER = 6;
const GLYPH = 7;

/**
 * Hollow play-triangle outline on the 32×32 face.
 * Built as an upper half then mirrored, so top and bottom stay symmetric
 * and the tip is a clean 2×2 (no weird blunt nose). Optically centered
 * slightly right of the disc center (standard for play icons).
 */
function playGlyphCells(): Array<[number, number]> {
  const left = 12;
  const tipX = 21;
  const topY = 10;
  const botY = 21;
  const thick = 2;
  const halfEnd = 15; // last upper row; 16 is its mirror partner

  const mask: boolean[][] = Array.from({ length: FACE_N }, () =>
    Array(FACE_N).fill(false)
  );
  const stamp = (x: number, y: number) => {
    if (x >= 0 && x < FACE_N && y >= 0 && y < FACE_N) mask[y]![x] = true;
  };

  const rightAtUpper = (y: number) => {
    if (y === halfEnd) return tipX;
    const t = (y - topY) / (halfEnd - topY);
    return Math.round(left + t * (tipX - left));
  };

  // THIS SECTION DOES: paint the upper half (left bar + right diagonal).
  for (let y = topY; y <= halfEnd; y++) {
    const R = rightAtUpper(y);
    for (let t = 0; t < thick; t++) stamp(left + t, y);
    for (let t = 0; t < thick; t++) {
      const rx = R - t;
      if (rx >= left + thick) stamp(rx, y);
    }
    // Close any 1-pixel gap between the left bar and the diagonal.
    for (let x = left + thick; x < R - thick + 1; x++) {
      if (mask[y]![x - 1] && mask[y]![x + 1] && !mask[y]![x]) stamp(x, y);
    }
  }

  // THIS SECTION DOES: mirror the upper half onto the lower half.
  for (let y = topY; y <= halfEnd; y++) {
    const my = botY - (y - topY);
    for (let x = 0; x < FACE_N; x++) {
      if (mask[y]![x]) stamp(x, my);
    }
  }

  const cells: Array<[number, number]> = [];
  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      if (mask[y]![x]) cells.push([x, y]);
    }
  }
  return cells;
}

/**
 * Paint a mathematical circle (radius 15.5 centered on 32×32), then ring,
 * triangle, and bottom extrusion. More circular than the old traced oval.
 */
function buildLayers() {
  const g: number[][] = Array.from({ length: GRID_H }, () =>
    Array(GRID_W).fill(EMPTY)
  );

  // THIS SECTION DOES: fill a true circle on the face grid.
  const cx = (FACE_N - 1) / 2;
  const cy = (FACE_N - 1) / 2;
  const r = FACE_N / 2 - 0.5; // ~15.5 — touches near the edges, stays circular
  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) g[y]![x] = FACE;
    }
  }

  // THIS SECTION DOES: slightly lighter center (subtle, not glossy).
  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      if (g[y]![x] !== FACE) continue;
      const dx = (x - cx) / (FACE_N * 0.28);
      const dy = (y - cy) / (FACE_N * 0.28);
      if (dx * dx + dy * dy < 1) g[y]![x] = FACE_CTR;
    }
  }

  // THIS SECTION DOES: BFS distance from outside → outer rim (1) + inset ring (2).
  const inFace = (x: number, y: number) =>
    y >= 0 && y < FACE_N && x >= 0 && x < FACE_N && g[y]![x] !== EMPTY;

  const dist: number[][] = Array.from({ length: FACE_N }, () =>
    Array(FACE_N).fill(999)
  );
  const q: Array<[number, number]> = [];
  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      if (!inFace(x, y)) continue;
      for (const [dx, dy] of [
        [1, 0],
        [-1, 0],
        [0, 1],
        [0, -1]
      ] as const) {
        if (!inFace(x + dx, y + dy)) {
          dist[y]![x] = 1;
          q.push([x, y]);
          break;
        }
      }
    }
  }
  let qi = 0;
  while (qi < q.length) {
    const [x, y] = q[qi++]!;
    for (const [dx, dy] of [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1]
    ] as const) {
      const nx = x + dx;
      const ny = y + dy;
      if (!inFace(nx, ny)) continue;
      const nd = dist[y]![x]! + 1;
      if (nd < dist[ny]![nx]!) {
        dist[ny]![nx] = nd;
        q.push([nx, ny]);
      }
    }
  }

  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      if (!inFace(x, y)) continue;
      const d = dist[y]![x]!;
      if (d === 1) g[y]![x] = FACE_EDGE;
      else if (d === 2) g[y]![x] = BORDER;
    }
  }

  // THIS SECTION DOES: hollow play triangle on the face fill only.
  for (const [x, y] of playGlyphCells()) {
    const cell = g[y]![x]!;
    if (cell === FACE || cell === FACE_CTR) g[y]![x] = GLYPH;
  }

  // THIS SECTION DOES: darker 3D extrusion under the circle.
  const bottomAt = Array(FACE_N).fill(-1) as number[];
  for (let y = 0; y < FACE_N; y++) {
    for (let x = 0; x < FACE_N; x++) {
      if (g[y]![x] !== EMPTY) bottomAt[x] = y;
    }
  }
  for (let x = 0; x < FACE_N; x++) {
    const b = bottomAt[x]!;
    if (b < 0) continue;
    for (let d = 1; d <= DEPTH; d++) {
      const ty = b + d;
      if (ty >= GRID_H) break;
      if (g[ty]![x] !== EMPTY) continue;
      g[ty]![x] = d === 1 ? EX_MID : EX_DEEP;
    }
  }
  for (let d = 2; d <= DEPTH; d++) {
    for (let x = 0; x < FACE_N; x++) {
      const b = bottomAt[x]!;
      if (b < 0) continue;
      const ty = b + d;
      if (ty >= GRID_H) continue;
      if (x > 0 && bottomAt[x - 1]! < 0 && g[ty]![x - 1] === EMPTY) {
        g[ty]![x - 1] = EX_DEEP;
      }
      if (x < FACE_N - 1 && bottomAt[x + 1]! < 0 && g[ty]![x + 1] === EMPTY) {
        g[ty]![x + 1] = EX_DEEP;
      }
    }
  }

  function runs(kind: number): Array<[number, number, number, number]> {
    const out: Array<[number, number, number, number]> = [];
    for (let y = 0; y < GRID_H; y++) {
      let x = 0;
      while (x < GRID_W) {
        if (g[y]![x] !== kind) {
          x++;
          continue;
        }
        const start = x;
        while (x < GRID_W && g[y]![x] === kind) x++;
        out.push([start, y, x - start, 1]);
      }
    }
    return out;
  }

  return {
    EX_DEEP: runs(EX_DEEP),
    EX_MID: runs(EX_MID),
    FACE_EDGE: runs(FACE_EDGE),
    FACE: runs(FACE),
    FACE_CTR: runs(FACE_CTR),
    BORDER: runs(BORDER),
    GLYPH: runs(GLYPH)
  };
}

const LAYERS = buildLayers();

function paint(
  runs: Array<[number, number, number, number]>,
  fill: string,
  keyPrefix: string
) {
  return runs.map(([x, y, w, h], i) => (
    <Rect key={`${keyPrefix}-${i}`} x={x} y={y} width={w} height={h} fill={fill} />
  ));
}

/** Color recipe for one theme (dark button or inverted light button). */
export type PixelPlayColors = {
  face: string;
  faceMid: string;
  edge: string;
  border: string;
  glyph: string;
  extrusion: string;
  extrusionMid: string;
};

/** Dark button for a light (white) card. */
export const PLAY_ON_LIGHT: PixelPlayColors = {
  face: '#1B1E27',
  faceMid: '#222632',
  edge: '#14171F',
  border: '#FAFAF8',
  glyph: '#FAFAF8',
  extrusion: '#080B10',
  extrusionMid: '#0E1118'
};

/** Light button for a dark (black) card — inverted. */
export const PLAY_ON_DARK: PixelPlayColors = {
  face: '#FAFAF8',
  faceMid: '#FFFFFF',
  edge: '#E8E6DE',
  border: '#1C1B16',
  glyph: '#1C1B16',
  extrusion: '#A8A69E',
  extrusionMid: '#C4C2B8'
};

/**
 * Round pixel play button with inset ring + darker bottom extrusion.
 */
export function PixelPlayIcon({
  width = 56,
  height = Math.round((56 * GRID_H) / GRID_W),
  colors = PLAY_ON_LIGHT
}: {
  width?: number;
  height?: number;
  colors?: PixelPlayColors;
}) {
  const { face, faceMid, edge, border, glyph, extrusion, extrusionMid } = colors;

  const shapes = useMemo(
    () => (
      <>
        {paint(LAYERS.EX_DEEP, extrusion, 'xd')}
        {paint(LAYERS.EX_MID, extrusionMid, 'xm')}
        {paint(LAYERS.FACE_EDGE, edge, 'fe')}
        {paint(LAYERS.FACE, face, 'ff')}
        {paint(LAYERS.FACE_CTR, faceMid, 'fc')}
        {paint(LAYERS.BORDER, border, 'bd')}
        {paint(LAYERS.GLYPH, glyph, 'gl')}
      </>
    ),
    [face, faceMid, edge, border, glyph, extrusion, extrusionMid]
  );

  return (
    // ACCESSIBILITY: decorative only; parent RecapTeaser carries the label.
    // shapeRendering is a web SVG hint and is not typed on react-native-svg.
    <Svg
      width={width}
      height={height}
      viewBox={`0 0 ${GRID_W} ${GRID_H}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      {...({ shapeRendering: 'crispEdges' } as Record<string, string>)}
    >
      {shapes}
    </Svg>
  );
}

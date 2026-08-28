// ============================================
// WHAT THIS FILE DOES (plain English):
// The recipe for the "Pop art" photo look (Andy Warhol style). It does two
// things for each of the four squares in the grid:
//   1. Drains the photo of its real colors so it becomes a plain grey photo.
//   2. Repaints that grey photo with two bright colors: a bold color in the
//      dark areas (hair, shadows) sliding smoothly up to a light color in the
//      bright areas (skin highlights, background).
// Because the repaint is a smooth slide (not hard bands), every bit of the
// photo's detail survives, so the face still reads clearly. Each of the four
// squares uses a different color pair, giving the classic 2x2 Warhol montage.
//
// HOW IT ACTUALLY WORKS (technical): all of the above is packed into one SVG
// `feColorMatrix`. Grey conversion uses Rec.709 luminance weights; the two-color
// slide plus a gentle contrast bump are baked into the same 4x5 matrix, so the
// phone applies the whole look in a single GPU pass per square.
// ============================================

/** One square's color pair: `low` paints the shadows, `high` paints the highlights. */
export type WarholPalette = {
  /** Bold color for the dark parts of the photo (0-255 RGB). */
  low: [number, number, number];
  /** Bright color for the light parts of the photo (0-255 RGB). */
  high: [number, number, number];
};

// THIS SECTION DOES: the four bright color pairs, one per grid square. Highlights
// stay light so faces read; shadows stay saturated so it pops.
export const WARHOL_PALETTES: WarholPalette[] = [
  { low: [224, 0, 119], high: [255, 240, 0] }, // magenta -> yellow
  { low: [83, 0, 163], high: [0, 224, 255] }, // purple -> cyan
  { low: [0, 70, 200], high: [180, 255, 0] }, // blue -> lime
  { low: [222, 20, 40], high: [255, 195, 70] } // red -> warm peach
];

// THIS SECTION DOES: how strong the light/dark push is. 1 = untouched; a little
// above 1 makes it punchier while still keeping detail.
const CONTRAST = 1.18;

// THIS SECTION DOES: the standard "how bright does the eye see each color"
// weights, used to turn a color photo into a fair grey photo.
const LUMA = [0.2126, 0.7152, 0.0722] as const;

/**
 * Builds the 20-number SVG color matrix for one square: grey conversion, gentle
 * contrast, and the two-color repaint, all in one step.
 */
export function warholMatrix(
  palette: WarholPalette,
  contrast: number = CONTRAST
): number[] {
  // THIS SECTION DOES: turn the 0-255 colors into the 0-1 range the matrix uses.
  const low = palette.low.map((v) => v / 255);
  const high = palette.high.map((v) => v / 255);

  const rows: number[][] = [];

  // THIS SECTION DOES: build one matrix row per color channel (R, G, B).
  for (let i = 0; i < 3; i++) {
    // The span from the shadow color to the highlight color for this channel.
    const span = high[i] - low[i];
    // Slide across that span using the grey value, scaled by contrast.
    const coefficients = LUMA.map((weight) => span * contrast * weight);
    // Offset re-centers the contrast push and adds the shadow color as the floor.
    const offset = span * (0.5 - 0.5 * contrast) + low[i];
    rows.push([coefficients[0], coefficients[1], coefficients[2], 0, offset]);
  }

  // THIS SECTION DOES: leave the see-through (alpha) channel exactly as it was.
  rows.push([0, 0, 0, 1, 0]);

  return rows.flat();
}

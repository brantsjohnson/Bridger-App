// ============================================
// WHAT THIS FILE DOES (plain English):
// The paint box for the "What J-name are you?" result poster. It holds the
// exact colors, the exact font names, the torn-paper pictures, and the sticker
// shapes the poster is collaged from. Everything the poster needs to look the
// same on every phone lives here, in one place, so the card component can stay
// about layout instead of hard-coded hex codes.
//
// (Design note: the card is drawn at a FIXED 430-point width. It is scaled to
// fit the phone on screen, but the picture we save to your photos is always
// captured at this size, so the saved PNG is identical for everyone.)
// ============================================

import type { ImageSourcePropType } from 'react-native';

// THIS SECTION DOES: the width the poster is drawn at. Everything else is
// measured against it, and the saved PNG uses it too.
export const CARD_W = 430;

// THIS SECTION DOES: the fixed palette, lifted straight from the design file.
export const POSTER = {
  /** The warm off-white "paper" the whole poster is printed on. */
  paper: 'rgb(245,228,213)',
  /** The deep blue used for the headline words, the % and the bar frame. */
  navy: 'rgb(20,60,171)',
  /** A slightly darker navy for the thin rules. */
  rule: 'rgb(39,64,135)',
  /** The hot pink of the torn banner, the bar fill and the RED FLAGS title. */
  pink: 'rgb(255,62,138)',
  /** The cream used for the giant name and the chunky text outlines. */
  cream: 'rgb(252,250,244)',
  ink: 'rgb(0,0,0)',
  white: 'rgb(255,255,255)',
  /** The washi tape stuck over the corner of the photo. */
  tape: 'rgb(252,201,86)',
  /** The pale periwinkle drop shadow under the two bottom windows. */
  shadow: 'rgb(174,188,251)'
} as const;

// THIS SECTION DOES: name the loaded fonts once so nothing is misspelled.
// (These are registered in app/_layout.tsx when the app boots.)
export const POSTER_FONT = {
  /** Tall condensed poster type: the headline and the giant J-name. */
  display: 'BigShouldersDisplay_900Black',
  /** Pixel-ish numerals: the big % and the little windows. */
  pixel: 'Jersey20_400Regular',
  /** Same pixel family, slightly wider: used for the big % number. */
  pixelBig: 'Jersey25_400Regular',
  /** Typewriter: the "REDEEMING QUALITY" label and its answer. */
  mono: 'AnonymousPro_700Bold',
  /** Squat condensed sans: the words printed on the red-flag stickers. */
  sticker: 'Antonio_700Bold',
  /** The app's normal body font, used for the roast paragraph. */
  body: 'PlusJakartaSans_400Regular',
  bodyBold: 'PlusJakartaSans_700Bold'
} as const;

// THIS SECTION DOES: the torn-paper and window pictures the collage is built
// from. React Native needs require() at build time, so they are listed once.
export const POSTER_ART = {
  paperPink: require('./result-assets/paper-pink.png') as ImageSourcePropType,
  paperBlue: require('./result-assets/paper-blue.png') as ImageSourcePropType,
  paperRedFlags: require('./result-assets/paper-redflags.png') as ImageSourcePropType,
  paperPhoto: require('./result-assets/paper-photo.png') as ImageSourcePropType,
  chatBg: require('./result-assets/chat-bg.png') as ImageSourcePropType,
  avatarMe: require('./result-assets/avatar-me.png') as ImageSourcePropType,
  avatarThem: require('./result-assets/avatar-them.png') as ImageSourcePropType,
  flag: require('./result-assets/chip-flag.png') as ImageSourcePropType,
  lineTop: require('./result-assets/line-2.png') as ImageSourcePropType,
  lineShort: require('./result-assets/line-1.png') as ImageSourcePropType,
  lineMid: require('./result-assets/line-3.png') as ImageSourcePropType,
  lineLabel: require('./result-assets/line-4.png') as ImageSourcePropType
} as const;

// THIS SECTION DOES: the torn-paper stickers the red flags are printed on.
// Each one carries the text color that stays readable on that sticker, and how
// far it should tilt, so a list of flags can be dealt out onto them like cards.
export type StickerStyle = {
  art: ImageSourcePropType;
  /** Text color that reads well on this sticker. */
  onColor: string;
  /** Tilt in degrees, so the collage looks hand-stuck, not gridded. */
  tilt: number;
};

export const STICKERS: StickerStyle[] = [
  { art: require('./result-assets/chip-orange.png'), onColor: POSTER.ink, tilt: -6 },
  { art: require('./result-assets/chip-purple.png'), onColor: POSTER.ink, tilt: 4 },
  { art: require('./result-assets/chip-yellow.png'), onColor: POSTER.ink, tilt: -3 },
  { art: require('./result-assets/chip-teal.png'), onColor: POSTER.ink, tilt: 5 },
  { art: require('./result-assets/chip-blue.png'), onColor: POSTER.white, tilt: -5 },
  { art: require('./result-assets/chip-pink.png'), onColor: POSTER.ink, tilt: 3 },
  { art: require('./result-assets/chip-red.png'), onColor: POSTER.white, tilt: -4 }
];

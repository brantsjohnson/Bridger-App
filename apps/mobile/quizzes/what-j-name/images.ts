// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads the seven J-name result pictures so both the Home card and the result
// screen can show them, plus the extra-brain Yes/No pictures. In React Native
// an image has to be pulled in with require() at build time (you can't build
// the path from a string at runtime), so we list them here once.
// ============================================

import type { ImageSourcePropType } from 'react-native';

// THIS SECTION DOES: one picture per J-name result.
export const JNAME_IMAGES: Record<string, ImageSourcePropType> = {
  Justin: require('./images/justin.png'),
  Josh: require('./images/josh.png'),
  Joey: require('./images/joey.png'),
  James: require('./images/james.png'),
  Jake: require('./images/jake.png'),
  Jared: require('./images/jared.png'),
  John: require('./images/john.png')
};

// THIS SECTION DOES: the faces the Home card cycles through. The founder asked
// for only these five, shown in two beats (1-3, then 4-6 style rotation).
export const HOME_COVER_FACES: ImageSourcePropType[] = [
  JNAME_IMAGES.Justin,
  JNAME_IMAGES.Josh,
  JNAME_IMAGES.Jake,
  JNAME_IMAGES.Joey,
  JNAME_IMAGES.James
];

/** Optional pictures that sit on a Yes / No tile (extra-brain question). */
export const QUIZ_OPTION_IMAGES: Record<string, ImageSourcePropType> = {
  extra_brain: require('./images/extra-brain.png'),
  normal_brain: require('./images/normal-brain.png')
};

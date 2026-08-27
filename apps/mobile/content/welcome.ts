// ============================================
// WHAT THIS FILE DOES (plain English):
// The words (and one phone-time stat) for the non-skippable welcome sequence
// that plays the first time someone opens Bridger. Kept in its own file so we
// can edit the copy without touching the screen code. The phone-time number
// must stay a real, cited figure before we ship (ONBOARDING.md).
//
// The refrain is "the internet promised X. Instead Y. So we're trying again."
// Strong words (alone, FOMO, sold us stuff) stay on purpose: they name the
// feeling fast so the fix lands.
// ============================================

export type WelcomeBeat = {
  id: string;
  text: string;
  kind?: 'text' | 'stat';
  /** cited source - replace the placeholder figure before shipping */
  source?: string;
};

export const WELCOME_BEATS: WelcomeBeat[] = [
  {
    id: 'b1',
    text: "The internet promised to bring us closer. Instead we've never felt more alone."
  },
  {
    id: 'b2',
    text: 'It promised to keep us in touch. Instead we drift apart.'
  },
  {
    id: 'b3',
    text: 'It promised to help us live our lives. Instead we just watch everyone else live theirs.'
  },
  {
    id: 'b4',
    text: 'The average adult spends 2h 24m a day on social media.',
    kind: 'stat',
    source: 'DataReportal, Digital 2024 - replace with a verified figure'
  },
  {
    id: 'b5',
    text: 'It promised community. Instead it just sold us stuff.'
  },
  { id: 'b6', text: "So we're trying again." },
  { id: 'b7', text: 'Welcome to Bridger.' }
];

/** How long each beat stays on screen before the next one, in milliseconds. */
export const BEAT_MS = 2600;

/** Device-local flag: Welcome already played on this install. */
export const WELCOME_SEEN_KEY = 'bridger.hasSeenWelcome';

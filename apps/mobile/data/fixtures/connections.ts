// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake "how you met" memories and shared place photos for demo mode.
// Screens never import this — they go through data/reveal.ts so the live
// API can swap in later without rewriting the UI.
// ============================================
import type { Accent, HowYouMet } from '@bridger/shared';

/**
 * PRIVACY: place records are coarse ("RiNo, Denver") and approximate.
 * Never precise coordinates. Only the two people see them.
 */
export const HOW_YOU_MET: Record<string, HowYouMet[]> = {
  maya: [
    { kind: 'event', label: 'Game Night', date: 'Mar 3', viaName: 'Priya' },
    { kind: 'place', label: 'RiNo, Denver', date: 'Mar 3', approximate: true }
  ],
  devon: [{ kind: 'via', label: 'Sam', date: 'Jan 12' }],
  theo: [{ kind: 'event', label: 'Ramen crawl', date: 'Feb 20' }],
  kit: [{ kind: 'place', label: 'Cherry Creek', date: 'Nov 2', approximate: true }],
  ines: [{ kind: 'via', label: 'Jade', date: 'Dec 8' }],
  nour: []
};

/** The coarse area the device offers at connect time. Never a street address. */
export const NEARBY_AREA = 'RiNo, Denver';

/** One photo half of a shared-place pair (emoji stand-in until real photos). */
export type SharedPlaceShot = {
  emoji: string;
  caption: string;
  accent: Accent;
};

/** "Wait, you were there too?" — both of you have been to this place. */
export type SharedPlace = {
  id: string;
  place: string;
  yours: SharedPlaceShot;
  theirs: SharedPlaceShot;
};

/**
 * Shared place photos for the In common tab. Co-op expressive layer —
 * demo shows emoji stand-ins, never real likeness in fixtures.
 */
export const SHARED_PLACES: SharedPlace[] = [
  {
    id: 'sp1',
    place: 'Lisbon',
    yours: { emoji: '🥮', caption: 'Belém, 8am', accent: 'amber' },
    theirs: { emoji: '🚋', caption: 'Tram 28', accent: 'teal' }
  },
  {
    id: 'sp2',
    place: 'Kyoto',
    yours: { emoji: '⛩', caption: 'Fushimi Inari', accent: 'coral' },
    theirs: { emoji: '🍡', caption: 'Nishiki market', accent: 'pink' }
  }
];

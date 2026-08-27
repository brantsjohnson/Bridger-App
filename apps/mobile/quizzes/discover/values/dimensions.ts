// ============================================
// WHAT THIS FILE DOES (plain English):
// Matching dials for What Gets You Going. Two load-bearing Schwartz axes
// (adventure↔stability, giving↔striving), plus hedonism. Loyalty and honesty
// norms are friendship-native dials reserved for a later 10-question add-on
// so they do not contaminate the Schwartz scores.
// ============================================

import type { SchwartzValue } from './questions';

/** Match on similarity — shared values are the strongest lasting-friend glue. */
export const VALUES_MATCH_MODE = 'similarity' as const;

export const VALUES_DIALS = [
  {
    key: 'adventure_stability',
    label: 'Adventure ↔ Stability',
    blurb: 'Novelty and your own path vs roots, security, and things that last.',
    matchable: true,
    /** High = adventure / openness-to-change. Low = stability / conservation. */
    highLabel: 'Adventure',
    lowLabel: 'Stability'
  },
  {
    key: 'giving_striving',
    label: 'Giving ↔ Striving',
    blurb: 'Other people matter as much as you vs win, build, be somebody.',
    matchable: true,
    highLabel: 'Giving',
    lowLabel: 'Striving'
  },
  {
    key: 'hedonism',
    label: 'Enjoyment weight',
    blurb: 'How much "life is for fun" ranks when priorities compete.',
    matchable: true,
    highLabel: 'Pleasure-first',
    lowLabel: 'Duty-first'
  },
  {
    key: 'loyalty_norms',
    label: 'Loyalty norms',
    blurb: 'Ride-or-die vs loyal to people who stay good people. Friendship add-on.',
    matchable: true,
    /** Not scored until friendship pack lands. */
    pending: true,
    highLabel: 'Unconditional',
    lowLabel: 'Conditional'
  },
  {
    key: 'honesty_norms',
    label: 'Honesty norms',
    blurb: 'Brutal-truth vs kind-truth. Friendship add-on.',
    matchable: true,
    pending: true,
    highLabel: 'Brutal truth',
    lowLabel: 'Kind truth'
  }
] as const;

export type ValuesDialKey = (typeof VALUES_DIALS)[number]['key'];

/** Schwartz values that pull toward the adventure pole. */
export const ADVENTURE_VALUES: SchwartzValue[] = [
  'stimulation',
  'self_direction'
];

/** Schwartz values that pull toward the stability pole. */
export const STABILITY_VALUES: SchwartzValue[] = [
  'security',
  'tradition',
  'conformity'
];

/** Schwartz values that pull toward giving. */
export const GIVING_VALUES: SchwartzValue[] = ['benevolence', 'universalism'];

/** Schwartz values that pull toward striving. */
export const STRIVING_VALUES: SchwartzValue[] = ['achievement', 'power'];

export const SCHWARTZ_LABELS: Record<SchwartzValue, string> = {
  self_direction: 'Self-direction',
  stimulation: 'Stimulation',
  hedonism: 'Enjoyment',
  achievement: 'Achievement',
  power: 'Power',
  security: 'Security',
  conformity: 'Conformity',
  tradition: 'Tradition',
  benevolence: 'Close care',
  universalism: 'Broad care'
};

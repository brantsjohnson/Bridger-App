// ============================================
// WHAT THIS FILE DOES (plain English):
// The five humor TASTE axes (backend tags only — users never see these words)
// plus breadth. Matching uses similarity on the vector; breadth widens or
// narrows how close someone has to be. Humor STYLE (how you joke socially)
// is collected but not matched yet.
// ============================================

import type { HumorAxisKey } from './media';

/** Match people who laugh at the same things. */
export const HUMOR_MATCH_MODE = 'similarity' as const;

export type HumorAxisDef = {
  key: HumorAxisKey;
  /** Internal only. Never show in UI. */
  internalLabel: string;
  /** Friendly result band labels (still not the axis jargon). */
  lowLabel: string;
  highLabel: string;
  blurb: string;
};

/**
 * Bipolar taste axes. Score 0 = low pole, 1 = high pole.
 * Users see plain-language bands on the result screen, never these names.
 */
export const HUMOR_AXES: HumorAxisDef[] = [
  {
    key: 'absurdity',
    internalLabel: 'Absurdity',
    lowLabel: 'Grounded / observational',
    highLabel: 'Surreal / nonsense',
    blurb: 'Relatable life vs pure chaos and weirdness.'
  },
  {
    key: 'edge',
    internalLabel: 'Edge',
    lowLabel: 'Wholesome / gentle',
    highLabel: 'Dark / crass',
    blurb: 'How sharp or spicy the comedy can get.'
  },
  {
    key: 'register',
    internalLabel: 'Register',
    lowLabel: 'Broad / loud',
    highLabel: 'Dry / deadpan',
    blurb: 'Big energy delivery vs understated cool.'
  },
  {
    key: 'craft',
    internalLabel: 'Craft',
    lowLabel: 'Physical / slapstick',
    highLabel: 'Verbal / clever',
    blurb: 'Bodies and bits vs words and writing.'
  },
  {
    key: 'irony',
    internalLabel: 'Irony',
    lowLabel: 'Sincere / earnest',
    highLabel: 'Ironic / meta',
    blurb: 'Straight heart vs wink-at-the-camera.'
  }
];

/**
 * Breadth is not an axis. High = omnivore (wide match band). Low = niche
 * (only close neighbors). Comes from how many comedy clusters they pick.
 */
export const HUMOR_BREADTH = {
  key: 'breadth' as const,
  lowLabel: 'Niche palate',
  highLabel: 'Comedy omnivore',
  blurb: 'How many different comedy flavors you enjoy.'
};

/** How wide someone's match band is from breadth (0–1 → half-width). */
export function matchBandHalfWidth(breadth01: number): number {
  // Niche (~0.2) → tight ±0.12; omnivore (~0.85) → wide ±0.28
  const b = Math.max(0, Math.min(1, breadth01));
  return 0.1 + b * 0.2;
}

/** Plain band label for a 0–1 axis score. */
export function humorBandLabel(score01: number): string {
  if (score01 < 0.28) return 'Strong lean (low)';
  if (score01 < 0.42) return 'Lean (low)';
  if (score01 < 0.58) return 'Mixed';
  if (score01 < 0.72) return 'Lean (high)';
  return 'Strong lean (high)';
}

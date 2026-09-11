// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns labeled pair snapshots into new matching weights. Close friends
// are the strongest "this worked" signal. The six feature names stay the
// same so a suggestion is still explainable. Shrinks toward the hand-set
// v1 weights until we have a lot of labels, so early noise cannot yank
// Discover around.
// ============================================
import {
  MATCHING_FEATURES,
  MATCHING_LEARN_NEGATIVE,
  MATCHING_LEARN_POSITIVE,
  MATCHING_V1_WEIGHTS,
  type MatchingFeature,
  type MatchingOutcome,
  type PairFeaturesSnapshot
} from '@bridger/shared';

export type LearnRow = {
  outcome: MatchingOutcome;
  weight: number;
  snapshot: PairFeaturesSnapshot;
};

export type ProposedWeights = {
  weights: Record<MatchingFeature, number>;
  labeled: number;
  closeCount: number;
  friendCount: number;
  positiveCount: number;
  negativeCount: number;
  incumbentSeparation: number;
  candidateSeparation: number;
  beatsIncumbent: boolean;
  shrink: number;
};

const POS = new Set<string>(MATCHING_LEARN_POSITIVE);
const NEG = new Set<string>(MATCHING_LEARN_NEGATIVE);

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

function meanFeature(
  rows: LearnRow[],
  feature: MatchingFeature
): number {
  if (!rows.length) return 0;
  let sum = 0;
  let wSum = 0;
  for (const r of rows) {
    const w = Math.abs(Number(r.weight) || 0) || 1;
    sum += (Number(r.snapshot.features[feature]) || 0) * w;
    wSum += w;
  }
  return wSum ? sum / wSum : 0;
}

function scoreRows(
  rows: LearnRow[],
  weights: Record<MatchingFeature, number>
): number {
  if (!rows.length) return 0;
  let s = 0;
  for (const r of rows) {
    let dot = 0;
    for (const f of MATCHING_FEATURES) {
      dot += (weights[f] ?? 0) * (Number(r.snapshot.features[f]) || 0);
    }
    s += dot;
  }
  return s / rows.length;
}

/** How cleanly weights put "worked" pairs above "did not work" pairs. */
export function separation(
  positive: LearnRow[],
  negative: LearnRow[],
  weights: Record<MatchingFeature, number>
): number {
  return scoreRows(positive, weights) - scoreRows(negative, weights);
}

function normalizeWeights(
  raw: Record<MatchingFeature, number>
): Record<MatchingFeature, number> {
  let sum = 0;
  for (const f of MATCHING_FEATURES) sum += Math.max(0.01, raw[f] ?? 0);
  const out = { ...MATCHING_V1_WEIGHTS };
  for (const f of MATCHING_FEATURES) {
    out[f] = Math.max(0.01, raw[f] ?? 0) / sum;
  }
  return out;
}

/**
 * Propose new weights from labeled snapshots.
 * labeled < 500 → stay almost on v1 (shrink 0.9).
 * labeled ≥ 3000 → trust the data more (shrink 0.35).
 */
export function proposeMatchingWeights(
  rows: LearnRow[],
  incumbent: Record<MatchingFeature, number> = MATCHING_V1_WEIGHTS,
  v2Floor = 3000
): ProposedWeights {
  const positive = rows.filter((r) => POS.has(r.outcome));
  const negative = rows.filter((r) => NEG.has(r.outcome));
  const closeCount = rows.filter((r) => r.outcome === 'close').length;
  const friendCount = rows.filter((r) => r.outcome === 'friend').length;

  const lifts = { ...MATCHING_V1_WEIGHTS };
  for (const f of MATCHING_FEATURES) {
    const pos = meanFeature(positive, f);
    const neg = meanFeature(negative, f);
    lifts[f] = clamp01(pos - neg + 0.15);
  }
  const learned = normalizeWeights(lifts);

  const shrink =
    rows.length < 500 ? 0.9 : rows.length < v2Floor ? 0.7 : 0.35;
  const mixed = { ...MATCHING_V1_WEIGHTS };
  for (const f of MATCHING_FEATURES) {
    mixed[f] = shrink * (incumbent[f] ?? 0) + (1 - shrink) * learned[f];
  }
  const weights = normalizeWeights(mixed);

  const incumbentSeparation = separation(positive, negative, incumbent);
  const candidateSeparation = separation(positive, negative, weights);

  return {
    weights,
    labeled: rows.length,
    closeCount,
    friendCount,
    positiveCount: positive.length,
    negativeCount: negative.length,
    incumbentSeparation,
    candidateSeparation,
    beatsIncumbent: candidateSeparation > incumbentSeparation + 0.01,
    shrink
  };
}

export function shouldActivateLearnedWeights(
  proposed: ProposedWeights,
  v2Floor = 3000,
  minClose = 40
): boolean {
  return (
    proposed.labeled >= v2Floor &&
    proposed.closeCount >= minClose &&
    proposed.beatsIncumbent
  );
}

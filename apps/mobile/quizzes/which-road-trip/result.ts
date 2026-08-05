// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns demo answers into a Coastal / Mountain / Desert result, and lists
// the "Who got who" friend groups from the fixture so the result screen
// matches Home's quiz card.
// ============================================
import type { Accent } from '@bridger/shared';
import { QUIZ } from '../../data/fixtures/catalog';
import { QUESTIONS } from './questions';

export type RoadTripResultId = 'coastal' | 'mountain' | 'desert';

export type RoadTripResult = {
  id: RoadTripResultId;
  label: string;
  accent: Accent;
  friendIds: string[];
};

const LABELS: Record<RoadTripResultId, { label: string; accent: Accent }> = {
  coastal: { label: 'Coastal cruiser', accent: 'teal' },
  mountain: { label: 'Mountain roamer', accent: 'amber' },
  desert: { label: 'Desert wanderer', accent: 'coral' }
};

/**
 * Score demo answers by summing option weights. Highest dimension wins.
 * Ties break toward coastal → mountain → desert (stable, fun order).
 */
export function scoreAnswers(
  answers: Record<string, string>
): RoadTripResultId {
  const totals = { coastal: 0, mountain: 0, desert: 0 };

  for (const q of QUESTIONS) {
    const optId = answers[q.id];
    if (!optId) continue;
    const opt = q.options.find((o) => o.id === optId);
    if (!opt) continue;
    totals.coastal += opt.weights.coastal;
    totals.mountain += opt.weights.mountain;
    totals.desert += opt.weights.desert;
  }

  const order: RoadTripResultId[] = ['coastal', 'mountain', 'desert'];
  let best: RoadTripResultId = 'coastal';
  let bestScore = -1;
  for (const key of order) {
    if (totals[key] > bestScore) {
      best = key;
      bestScore = totals[key];
    }
  }
  return best;
}

/** Full result row including fixture friend groups for "Who got who". */
export function buildResult(resultId: RoadTripResultId): RoadTripResult {
  const meta = LABELS[resultId];
  const fixture = QUIZ.results.find((r) => r.id === resultId);
  return {
    id: resultId,
    label: meta.label,
    accent: meta.accent,
    friendIds: fixture ? [...fixture.friendIds] : []
  };
}

/** All comparable buckets for the Who-got-who list. */
export function allResultBuckets(): RoadTripResult[] {
  return QUIZ.results.map((r) => ({
    id: r.id as RoadTripResultId,
    label: r.label,
    accent: r.accent,
    friendIds: [...r.friendIds]
  }));
}

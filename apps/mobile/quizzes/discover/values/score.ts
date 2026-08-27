// ============================================
// WHAT THIS FILE DOES (plain English):
// Scores What Gets You Going. Each pick awards one point to a Schwartz value.
// We show relative priority levels (1–10), then build matching dials:
// adventure↔stability, giving↔striving, hedonism. Loyalty/honesty wait for
// the friendship add-on. Disclosure only dampens confidence (preference vs
// capacity). The AI never invents these numbers.
// ============================================

import {
  ADVENTURE_VALUES,
  GIVING_VALUES,
  SCHWARTZ_LABELS,
  STABILITY_VALUES,
  STRIVING_VALUES,
  type ValuesDialKey
} from './dimensions';
import {
  SCHWARTZ_VALUES,
  VALUES_QUESTIONS,
  type SchwartzValue
} from './questions';
import type { DisclosureContextForQuiz } from '../_shared/disclosure-context';

export type ValuesAnswer = {
  questionId: string;
  /** Single option id, or 'skip'. */
  optionId: string;
  explain?: string;
};

export type SchwartzLevel = {
  key: SchwartzValue;
  label: string;
  raw: number;
  /** Displayed relative priority 1–10. */
  level: number;
};

export type ValuesDialScore = {
  key: ValuesDialKey;
  /** 0–1 where high = adventure / giving / hedonism. Null if pending. */
  score: number | null;
  pending?: boolean;
  confidence: number;
};

export type ValuesScoreResult = {
  schwartz: SchwartzLevel[];
  dials: ValuesDialScore[];
  skippedCount: number;
  notes: string[];
  version: number;
};

/** Raw 0–12 → displayed level 1–10 (relative priorities). */
export function rawToLevel(raw: number): number {
  if (raw <= 0) return 1;
  if (raw <= 2) return 2;
  if (raw === 3) return 3;
  if (raw === 4) return 4;
  if (raw === 5) return 5;
  if (raw <= 7) return 6;
  if (raw === 8) return 7;
  if (raw === 9) return 8;
  if (raw <= 11) return 9;
  return 10;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function sumRaw(
  scores: Record<SchwartzValue, number>,
  keys: SchwartzValue[]
): number {
  return keys.reduce((acc, k) => acc + (scores[k] ?? 0), 0);
}

/**
 * Bipolar dial: highPole / (highPole + lowPole).
 * 0.5 when both sides are empty or equal.
 */
function bipolar(
  scores: Record<SchwartzValue, number>,
  high: SchwartzValue[],
  low: SchwartzValue[]
): number {
  const h = sumRaw(scores, high);
  const l = sumRaw(scores, low);
  if (h + l === 0) return 0.5;
  return clamp01(h / (h + l));
}

export function scoreValues(
  answers: ValuesAnswer[],
  disclosure?: DisclosureContextForQuiz | null
): ValuesScoreResult {
  const byId = new Map(VALUES_QUESTIONS.map((q) => [q.id, q]));
  const raw: Record<SchwartzValue, number> = Object.fromEntries(
    SCHWARTZ_VALUES.map((k) => [k, 0])
  ) as Record<SchwartzValue, number>;

  let skippedCount = 0;
  const notes: string[] = [];

  for (const ans of answers) {
    if (ans.optionId === 'skip') {
      skippedCount += 1;
      continue;
    }
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const opt = q.options.find((o) => o.id === ans.optionId);
    if (!opt) continue;
    raw[opt.value] += 1;
  }

  const schwartz: SchwartzLevel[] = SCHWARTZ_VALUES.map((key) => ({
    key,
    label: SCHWARTZ_LABELS[key],
    raw: raw[key],
    level: rawToLevel(raw[key])
  }));

  const answered = answers.length - skippedCount;
  let confidence = clamp01(0.45 + Math.min(answered, 30) * 0.018);

  if (skippedCount >= 2) {
    confidence = clamp01(confidence - 0.05 * (skippedCount - 1));
    notes.push(`skipped:${skippedCount}`);
  }

  if (disclosure?.items?.length) {
    // Capacity can change Saturdays / energy for novelty — dampen adventure dial confidence.
    for (const item of disclosure.items) {
      if (
        ['adhd', 'anxiety', 'depression', 'autistic', 'ptsd'].includes(
          item.conditionKey
        )
      ) {
        confidence = clamp01(confidence - 0.03 * (item.impactLevel ?? 2));
        notes.push(`disclosure:${item.conditionKey}`);
      }
    }
    notes.push('disclosure_context_applied');
  }

  const adventure = bipolar(raw, ADVENTURE_VALUES, STABILITY_VALUES);
  const giving = bipolar(raw, GIVING_VALUES, STRIVING_VALUES);
  // Hedonism raw 0–12 → 0–1
  const hedonism = clamp01(raw.hedonism / 12);

  const dials: ValuesDialScore[] = [
    {
      key: 'adventure_stability',
      score: adventure,
      confidence
    },
    {
      key: 'giving_striving',
      score: giving,
      confidence
    },
    {
      key: 'hedonism',
      score: hedonism,
      confidence
    },
    {
      key: 'loyalty_norms',
      score: null,
      pending: true,
      confidence: 0
    },
    {
      key: 'honesty_norms',
      score: null,
      pending: true,
      confidence: 0
    }
  ];

  return {
    schwartz,
    dials,
    skippedCount,
    notes,
    version: 1
  };
}

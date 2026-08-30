// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns Your Vibe answers into trait dials. Pure math — same picks always
// give the same numbers. Follow-up "symptom" flags lower confidence and pull
// scores toward the middle when the answer looks like capacity, not preference.
// The AI never calls this with invented scores.
// ============================================

import {
  PERSONALITY_DIMENSIONS,
  type PersonalityDimensionKey
} from './dimensions';
import {
  PERSONALITY_QUESTIONS,
  type PersonalityQuestion
} from './questions';
import type { DisclosureContextForQuiz } from '../_shared/disclosure-context';

export type PersonalityAnswer = {
  questionId: string;
  optionIds: string[];
  /** Optional explain text. Never analytics. Never shown to matches. */
  explain?: string;
};

export type TraitEstimate = {
  key: PersonalityDimensionKey;
  /** Point estimate 0–1 (0.5 ≈ middle of the dial). */
  score: number;
  /** Soft range around the estimate after symptom dampening. */
  rangeLow: number;
  rangeHigh: number;
  /** 0–1 how clear the signal is. */
  confidence: number;
  matchable: boolean;
  matchMode: (typeof PERSONALITY_DIMENSIONS)[number]['matchMode'];
};

export type PersonalityScoreResult = {
  traits: TraitEstimate[];
  /** Opaque symptom / execution flags seen in follow-ups (no free text). */
  symptomFlags: string[];
  /** Short machine notes for the moderator / admin QA (not user-facing). */
  notes: string[];
  version: number;
};

const TRAIT_KEYS = PERSONALITY_DIMENSIONS.map((d) => d.key);

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function isTraitKey(k: string): k is PersonalityDimensionKey {
  return (TRAIT_KEYS as string[]).includes(k);
}

function isSymptomKey(k: string): boolean {
  return k.startsWith('_');
}

/**
 * Map a raw bipolar sum onto 0–1 using how strong that item could have been.
 * 0.5 = neutral / mixed.
 */
function toUnit(raw: number, maxAbs: number): number {
  if (maxAbs <= 0) return 0.5;
  return clamp01(0.5 + 0.5 * (raw / maxAbs));
}

/** Which traits a symptom flag should make us less sure about. */
const SYMPTOM_DAMPEN: Record<string, PersonalityDimensionKey[]> = {
  _execution_block: ['conscientiousness'],
  _focus_drift: ['conscientiousness'],
  _overwhelm: ['conscientiousness', 'neuroticism'],
  _social_anxiety: ['sociability'],
  _overstimulation: ['sociability', 'openness'],
  _low_energy: ['sociability'],
  _novelty_anxiety: ['openness'],
  _effort_cost: ['openness', 'conscientiousness'],
  _sensory: ['openness'],
  _rigidity: ['conscientiousness', 'neuroticism'],
  _compensation: ['conscientiousness'],
  _negative_bias: ['neuroticism', 'agreeableness']
};

/** Disclosure conditions that also lower confidence on related dials. */
const DISCLOSURE_DAMPEN: Record<string, PersonalityDimensionKey[]> = {
  adhd: ['conscientiousness'],
  anxiety: ['sociability', 'neuroticism', 'openness'],
  depression: ['sociability', 'conscientiousness', 'neuroticism'],
  ocd: ['conscientiousness', 'neuroticism'],
  bipolar: ['neuroticism', 'sociability'],
  autistic: ['sociability', 'openness'],
  ptsd: ['neuroticism', 'sociability'],
  other: ['neuroticism']
};

export function scorePersonality(
  answers: PersonalityAnswer[],
  disclosure?: DisclosureContextForQuiz | null
): PersonalityScoreResult {
  const byId = new Map(PERSONALITY_QUESTIONS.map((q) => [q.id, q]));
  const raw: Record<PersonalityDimensionKey, number> = {
    sociability: 0,
    assertiveness: 0,
    agreeableness: 0,
    conscientiousness: 0,
    openness: 0,
    neuroticism: 0
  };
  const maxAbs: Record<PersonalityDimensionKey, number> = {
    sociability: 0,
    assertiveness: 0,
    agreeableness: 0,
    conscientiousness: 0,
    openness: 0,
    neuroticism: 0
  };
  const answeredPerTrait: Record<PersonalityDimensionKey, number> = {
    sociability: 0,
    assertiveness: 0,
    agreeableness: 0,
    conscientiousness: 0,
    openness: 0,
    neuroticism: 0
  };

  const symptomFlags = new Set<string>();
  const notes: string[] = [];
  let noneCount = 0;
  let multiCount = 0;

  for (const ans of answers) {
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const opts = q.options.filter((o) => ans.optionIds.includes(o.id));
    if (opts.length === 0) continue;
    if (opts.some((o) => o.id === 'e')) noneCount += 1;
    if (opts.length > 1) multiCount += 1;

    // Average weights when they picked two tied options.
    const merged: Record<string, number> = {};
    for (const o of opts) {
      for (const [k, v] of Object.entries(o.weights)) {
        if (typeof v !== 'number') continue;
        merged[k] = (merged[k] ?? 0) + v / opts.length;
      }
    }

    for (const [k, v] of Object.entries(merged)) {
      if (isSymptomKey(k)) {
        symptomFlags.add(k);
        continue;
      }
      if (!isTraitKey(k)) continue;
      raw[k] += v;
      answeredPerTrait[k] += 1;
    }

    // Track the strongest lean this question could have contributed.
    for (const key of TRAIT_KEYS) {
      const peak = peakAbsForQuestion(q, key);
      if (peak > 0 && q.measures.includes(key)) {
        maxAbs[key] += peak;
      }
    }
  }

  // Confidence starts from coverage, then symptom + disclosure dampen.
  const confidence: Record<PersonalityDimensionKey, number> = {
    sociability: 0.55,
    assertiveness: 0.55,
    agreeableness: 0.55,
    conscientiousness: 0.55,
    openness: 0.55,
    neuroticism: 0.5
  };

  for (const key of TRAIT_KEYS) {
    const n = answeredPerTrait[key];
    // More items → clearer signal (caps around 0.9 before dampening).
    confidence[key] = clamp01(0.35 + Math.min(n, 12) * 0.045);
  }

  for (const flag of symptomFlags) {
    const targets = SYMPTOM_DAMPEN[flag] ?? [];
    for (const t of targets) {
      confidence[t] = clamp01(confidence[t] - 0.12);
    }
    notes.push(`followup_flag:${flag}`);
  }

  if (disclosure?.items?.length) {
    for (const item of disclosure.items) {
      const targets = DISCLOSURE_DAMPEN[item.conditionKey] ?? [];
      const impact = item.impactLevel ?? 2;
      const cut = 0.04 * impact; // high impact → stronger dampen
      for (const t of targets) {
        confidence[t] = clamp01(confidence[t] - cut);
      }
      notes.push(`disclosure:${item.conditionKey}:impact${impact}`);
    }
    notes.push('disclosure_context_applied');
  }

  if (noneCount >= 8) {
    for (const key of TRAIT_KEYS) confidence[key] = clamp01(confidence[key] - 0.1);
    notes.push('many_none_of_these');
  }
  if (multiCount >= 10) {
    notes.push('many_tied_pairs');
  }

  const traits: TraitEstimate[] = PERSONALITY_DIMENSIONS.map((dim) => {
    const unit = toUnit(raw[dim.key], maxAbs[dim.key] || 1);
    const conf = confidence[dim.key];
    // Low confidence → widen the range toward the middle (less sure).
    const shrink = 0.15 + (1 - conf) * 0.25;
    const towardMid = unit + (0.5 - unit) * (1 - conf) * 0.35;
    return {
      key: dim.key,
      score: clamp01(towardMid),
      rangeLow: clamp01(towardMid - shrink),
      rangeHigh: clamp01(towardMid + shrink),
      confidence: conf,
      matchable: dim.matchable,
      matchMode: dim.matchMode
    };
  });

  return {
    traits,
    symptomFlags: [...symptomFlags],
    notes,
    version: 1
  };
}

/**
 * Turn a scored result into the flat 0–1 map the matching API stores.
 * PRIVACY: only matchable traits (drops neuroticism). Never answers or notes.
 */
export function personalityToMatchDimensions(r: PersonalityScoreResult): {
  dimensionScores: Record<string, number>;
  confidence: Record<string, number>;
  version: number;
} {
  const dimensionScores: Record<string, number> = {};
  const confidence: Record<string, number> = {};
  for (const t of r.traits) {
    if (!t.matchable) continue;
    if (!Number.isFinite(t.score)) continue;
    dimensionScores[t.key] = clamp01(t.score);
    confidence[t.key] = clamp01(
      Number.isFinite(t.confidence) ? t.confidence : 1
    );
  }
  return { dimensionScores, confidence, version: r.version };
}

function peakAbsForQuestion(
  q: PersonalityQuestion,
  key: PersonalityDimensionKey
): number {
  let peak = 0;
  for (const o of q.options) {
    const v = o.weights[key];
    if (typeof v === 'number') peak = Math.max(peak, Math.abs(v));
  }
  return peak;
}

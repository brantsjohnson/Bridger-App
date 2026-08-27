// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns Your Funny Bone answers into a 5-axis taste vector (0–1) plus breadth.
// Media fingerprints count the most. Phase 2 "how you're funny" mostly fills
// styleHints for a future layer. Disclosure can soften confidence when
// capacity might explain a pick (less often than for personality / attachment).
// The AI never invents these numbers.
// ============================================

import {
  HUMOR_AXES,
  HUMOR_BREADTH,
  humorBandLabel,
  matchBandHalfWidth
} from './dimensions';
import { findHumorMedia, type HumorAxisKey } from './media';
import { HUMOR_QUESTIONS } from './questions';
import type { DisclosureContextForQuiz } from '../_shared/disclosure-context';

export type HumorAnswer = {
  questionId: string;
  optionIds: string[];
  explain?: string;
};

export type HumorAxisScore = {
  key: HumorAxisKey;
  /** 0 = low pole, 1 = high pole. */
  score: number;
  band: string;
  lowLabel: string;
  highLabel: string;
  confidence: number;
};

export type HumorScoreResult = {
  axes: HumorAxisScore[];
  /** 0–1 omnivore score from distinct comedy clusters. */
  breadth: number;
  breadthBand: string;
  breadthLabel: string;
  /** Similarity match half-width on each axis (from breadth). */
  matchBandHalfWidth: number;
  /** Top style tags from Phase 2/3 — not used for matching yet. */
  styleHints: Array<{ tag: string; count: number }>;
  /** Media ids they picked (for debugging / future cluster UI). */
  mediaIds: string[];
  clusters: string[];
  notes: string[];
  version: number;
};

/** Phase 1 non-media weight; media is heavier; style phases lighter on taste. */
const PHASE_WEIGHT: Record<1 | 2 | 3, number> = {
  1: 1,
  2: 0.35,
  3: 0.5
};
const MEDIA_WEIGHT = 2.2;

/** Clusters available across the catalog (for normalizing breadth). */
/** Picking this many distinct clusters ≈ full omnivore (breadth 1). */
const BREADTH_TARGET_CLUSTERS = 10;

const DISCLOSURE_DAMPEN: Record<string, HumorAxisKey[] | 'all'> = {
  autistic: ['register', 'irony'],
  adhd: 'all',
  anxiety: ['edge'],
  depression: ['edge', 'irony'],
  ptsd: ['edge']
};

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function questionById(id: string) {
  return HUMOR_QUESTIONS.find((q) => q.id === id);
}

/**
 * Score the full pack. Deterministic tag summing — no AI except free-text
 * "other" which the moderator may use later (not here).
 */
export function scoreHumor(
  answers: HumorAnswer[],
  disclosure?: DisclosureContextForQuiz | null
): HumorScoreResult {
  const notes: string[] = [];
  const sums: Record<HumorAxisKey, number> = {
    absurdity: 0,
    edge: 0,
    register: 0,
    craft: 0,
    irony: 0
  };
  const weights: Record<HumorAxisKey, number> = {
    absurdity: 0,
    edge: 0,
    register: 0,
    craft: 0,
    irony: 0
  };

  const styleCounts = new Map<string, number>();
  const mediaIds: string[] = [];
  const clusters = new Set<string>();

  for (const ans of answers) {
    const q = questionById(ans.questionId);
    if (!q) continue;
    const phaseW = PHASE_WEIGHT[q.phase];

    for (const oid of ans.optionIds) {
      const opt = q.options.find((o) => o.id === oid);
      if (!opt) continue;
      if (oid === 'none') continue;

      if (opt.style) {
        styleCounts.set(opt.style, (styleCounts.get(opt.style) ?? 0) + 1);
      }

      // THIS SECTION DOES: pull media fingerprints (strongest taste signal).
      if (opt.mediaId) {
        const media = findHumorMedia(opt.mediaId);
        if (media) {
          mediaIds.push(media.id);
          clusters.add(media.cluster);
          for (const key of Object.keys(media.axes) as HumorAxisKey[]) {
            sums[key] += media.axes[key] * MEDIA_WEIGHT;
            weights[key] += MEDIA_WEIGHT;
          }
        }
        continue;
      }

      // THIS SECTION DOES: add option axis leans, mapped into 0–1 space.
      if (opt.weights) {
        for (const [key, lean] of Object.entries(opt.weights) as Array<
          [HumorAxisKey, number]
        >) {
          if (lean == null || lean === 0) continue;
          // lean -2..+2 → contribution around center 0.5
          const position = clamp01(0.5 + lean / 4);
          sums[key] += position * phaseW;
          weights[key] += phaseW;
        }
      }

      // Soft cluster from Q1 moment types (helps breadth without media).
      if (q.id === 'h01' && oid !== 'h') {
        clusters.add(`moment_${oid}`);
      }
    }
  }

  const axes: HumorAxisScore[] = HUMOR_AXES.map((def) => {
    const w = weights[def.key];
    const score = w > 0 ? clamp01(sums[def.key] / w) : 0.5;
    let confidence = w > 0 ? clamp01(0.45 + Math.min(w, 12) / 20) : 0.35;
    return {
      key: def.key,
      score,
      band: humorBandLabel(score),
      lowLabel: def.lowLabel,
      highLabel: def.highLabel,
      confidence
    };
  });

  // THIS SECTION DOES: breadth = how many comedy clusters they laugh at.
  const clusterList = [...clusters];
  const breadth = clamp01(clusterList.length / BREADTH_TARGET_CLUSTERS);
  if (mediaIds.length === 0) {
    notes.push('Few or no media picks — taste leans on moment questions.');
  }
  if (clusterList.length <= 2 && mediaIds.length > 0) {
    notes.push('Narrow media clusters — niche match band.');
  }
  if (clusterList.length >= 6) {
    notes.push('Wide comedy clusters — omnivore match band.');
  }

  // THIS SECTION DOES: disclosure may soften confidence (taste usually holds).
  if (disclosure?.items?.length) {
    for (const item of disclosure.items) {
      const impact = item.impactLevel ?? 2;
      if (impact < 3) continue;
      const targets = DISCLOSURE_DAMPEN[item.conditionKey];
      if (!targets) continue;
      const factor = impact >= 4 ? 0.82 : 0.9;
      for (const axis of axes) {
        if (targets === 'all' || targets.includes(axis.key)) {
          axis.confidence = clamp01(axis.confidence * factor);
        }
      }
      notes.push(
        'Disclosure impact noted — confidence softened where capacity may matter.'
      );
    }
  }

  const styleHints = [...styleCounts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  return {
    axes,
    breadth,
    breadthBand: humorBandLabel(breadth),
    breadthLabel:
      breadth >= 0.62
        ? HUMOR_BREADTH.highLabel
        : breadth <= 0.35
          ? HUMOR_BREADTH.lowLabel
          : 'Balanced palate',
    matchBandHalfWidth: matchBandHalfWidth(breadth),
    styleHints,
    mediaIds,
    clusters: clusterList,
    notes,
    version: 1
  };
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns The Friend Zone answers into anxiety + avoidance (0–100), a gentle
// style label, and SES (helper only). Q13+Q14 are paired: discomfort that
// melts when help is clearly welcome leans anxiety; discomfort that stays
// leans avoidance. Disclosure dampens confidence when capacity may explain
// the pick. The AI never invents these numbers.
// ============================================

import {
  ATTACHMENT_STYLE_COPY,
  type AttachmentStyle
} from './dimensions';
import { ATTACHMENT_QUESTIONS } from './questions';
import type { DisclosureContextForQuiz } from '../_shared/disclosure-context';

export type AttachmentAnswer = {
  questionId: string;
  optionIds: string[];
  explain?: string;
};

export type AttachmentScoreResult = {
  /** 0–100 attachment anxiety. */
  anxiety: number;
  /** 0–100 attachment avoidance. */
  avoidance: number;
  /**
   * Social-evaluation sensitivity 0–100. Helps interpretation; does NOT
   * choose the attachment style or gate matches.
   */
  ses: number;
  style: AttachmentStyle;
  styleTitle: string;
  styleBlurb: string;
  /** Soft bands for UI ("moderate-high"). */
  bands: {
    closenessComfort: string;
    independenceComfort: string;
    uncertaintySensitivity: string;
    rejectionSensitivity: string;
  };
  confidence: { anxiety: number; avoidance: number };
  notes: string[];
  version: number;
};

const DISCLOSURE_DAMPEN: Record<string, Array<'anxiety' | 'avoidance'>> = {
  adhd: ['anxiety'],
  anxiety: ['anxiety'],
  depression: ['anxiety', 'avoidance'],
  ocd: ['anxiety'],
  bipolar: ['anxiety'],
  autistic: ['avoidance', 'anxiety'],
  ptsd: ['anxiety', 'avoidance'],
  other: ['anxiety']
};

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function clamp01(n: number): number {
  return clamp(n, 0, 1);
}

function bandLabel(score0to100: number): string {
  if (score0to100 < 25) return 'Low';
  if (score0to100 < 45) return 'Moderate-low';
  if (score0to100 < 60) return 'Moderate';
  if (score0to100 < 75) return 'Moderate-high';
  return 'High';
}

function optionIdsFor(answers: AttachmentAnswer[], qid: string): string[] {
  return answers.find((a) => a.questionId === qid)?.optionIds ?? [];
}

/**
 * Q13 (uncertain help) + Q14 (help is clearly welcome).
 * Same "I feel exposed" in Q13 means different things after Q14.
 */
function applySupportPair(
  answers: AttachmentAnswer[],
  anxiety: number,
  avoidance: number,
  notes: string[]
): { anxiety: number; avoidance: number } {
  const u = optionIdsFor(answers, 'a13');
  const s = optionIdsFor(answers, 'a14');
  if (u.length === 0 || s.length === 0) return { anxiety, avoidance };

  const uncertainAnxiety = u.some((id) => id === 'a' || id === 'b');
  const uncertainAvoid = u.includes('d');
  const relaxes = s.includes('a');
  const stillAvoid = s.some((id) => id === 'b' || id === 'd');
  const stillAnxious = s.includes('c');

  let anx = anxiety;
  let avo = avoidance;

  if (uncertainAnxiety && relaxes) {
    // Conditional on uncertainty → anxiety / rejection sensitivity, not avoidance.
    avo = Math.max(0, avo - 8);
    anx = Math.min(100, anx + 4);
    notes.push('pair:uncertain_then_relax→anxiety');
  }
  if (uncertainAnxiety && stillAvoid) {
    avo = Math.min(100, avo + 10);
    notes.push('pair:uncertain_then_still_avoid→avoidance');
  }
  if (uncertainAnxiety && stillAnxious) {
    anx = Math.min(100, anx + 6);
    notes.push('pair:uncertain_then_still_worry→anxiety');
  }
  if (uncertainAvoid && stillAvoid) {
    avo = Math.min(100, avo + 8);
    notes.push('pair:avoid_then_still_avoid→avoidance');
  }
  if (uncertainAvoid && relaxes) {
    avo = Math.max(0, avo - 4);
    notes.push('pair:avoid_softened_when_safe');
  }

  return { anxiety: anx, avoidance: avo };
}

function deriveStyle(anxiety: number, avoidance: number): AttachmentStyle {
  // Soft mid cut until pilot distributions exist (ML can tune later).
  const highAnx = anxiety >= 55;
  const highAvo = avoidance >= 55;
  if (!highAnx && !highAvo) return 'secure';
  if (highAnx && !highAvo) return 'anxious';
  if (!highAnx && highAvo) return 'avoidant';
  return 'fearful';
}

export function scoreAttachment(
  answers: AttachmentAnswer[],
  disclosure?: DisclosureContextForQuiz | null
): AttachmentScoreResult {
  const byId = new Map(ATTACHMENT_QUESTIONS.map((q) => [q.id, q]));
  let anxietyRaw = 0;
  let avoidanceRaw = 0;
  let sesRaw = 0;
  let anxietyMax = 0;
  let avoidanceMax = 0;
  let sesMax = 0;
  let answered = 0;
  const notes: string[] = [];

  for (const ans of answers) {
    const q = byId.get(ans.questionId);
    if (!q) continue;
    const opts = q.options.filter((o) => ans.optionIds.includes(o.id));
    if (opts.length === 0) continue;
    answered += 1;
    const wMult = q.weight;

    // Average when two options are tied.
    const merged = { anxiety: 0, avoidance: 0, ses: 0 };
    for (const o of opts) {
      merged.anxiety += (o.weights.anxiety ?? 0) / opts.length;
      merged.avoidance += (o.weights.avoidance ?? 0) / opts.length;
      merged.ses += (o.weights.ses ?? 0) / opts.length;
    }

    // Control / cross-check: light attachment contribution.
    const attachScale = q.control ? 0.25 : q.crosscheck ? 0.35 : 1;

    anxietyRaw += merged.anxiety * wMult * attachScale;
    avoidanceRaw += merged.avoidance * wMult * attachScale;
    sesRaw += merged.ses * wMult;

    anxietyMax += 2 * wMult * attachScale;
    avoidanceMax += 2 * wMult * attachScale;
    sesMax += 2 * wMult;
  }

  const to100 = (raw: number, max: number) =>
    max <= 0 ? 0 : clamp((raw / max) * 100, 0, 100);

  let anxiety = to100(anxietyRaw, anxietyMax);
  let avoidance = to100(avoidanceRaw, avoidanceMax);
  const ses = to100(sesRaw, sesMax);

  const paired = applySupportPair(answers, anxiety, avoidance, notes);
  anxiety = paired.anxiety;
  avoidance = paired.avoidance;

  // Confidence from coverage, then disclosure dampen (preference vs capacity).
  let confAnx = clamp01(0.4 + Math.min(answered, 18) * 0.03);
  let confAvo = clamp01(0.4 + Math.min(answered, 18) * 0.03);

  if (disclosure?.items?.length) {
    for (const item of disclosure.items) {
      const targets = DISCLOSURE_DAMPEN[item.conditionKey] ?? [];
      const cut = 0.035 * (item.impactLevel ?? 2);
      for (const t of targets) {
        if (t === 'anxiety') confAnx = clamp01(confAnx - cut);
        if (t === 'avoidance') confAvo = clamp01(confAvo - cut);
      }
      notes.push(`disclosure:${item.conditionKey}:impact${item.impactLevel ?? 2}`);
    }
    notes.push('disclosure_context_applied');
  }

  // High SES with mid anxiety: note that embarrassment ≠ attachment.
  if (ses >= 60 && anxiety < 55) {
    notes.push('ses_high_anxiety_mid:interpret_carefully');
  }

  const style = deriveStyle(anxiety, avoidance);
  const copy = ATTACHMENT_STYLE_COPY[style];

  // Closeness comfort ≈ inverse of avoidance; independence ≈ avoidance (reframed).
  const closenessComfort = 100 - avoidance;
  const independenceComfort = avoidance; // "comfortable alone / self-reliant"
  // Rejection sensitivity tracks anxiety; uncertainty similar.
  const uncertaintySensitivity = anxiety;
  const rejectionSensitivity = anxiety * 0.7 + ses * 0.3;

  return {
    anxiety: Math.round(anxiety),
    avoidance: Math.round(avoidance),
    ses: Math.round(ses),
    style,
    styleTitle: copy.title,
    styleBlurb: copy.blurb,
    bands: {
      closenessComfort: bandLabel(closenessComfort),
      independenceComfort: bandLabel(independenceComfort),
      uncertaintySensitivity: bandLabel(uncertaintySensitivity),
      rejectionSensitivity: bandLabel(rejectionSensitivity)
    },
    confidence: { anxiety: confAnx, avoidance: confAvo },
    notes,
    version: 1
  };
}

/**
 * Turn a scored result into the flat 0–1 map the matching API stores.
 * Anxiety / avoidance are stored 0–100 on the client; matching wants 0–1.
 * PRIVACY: scores + confidence only — never answers or style blurbs.
 */
export function attachmentToMatchDimensions(r: AttachmentScoreResult): {
  dimensionScores: Record<string, number>;
  confidence: Record<string, number>;
  version: number;
} {
  return {
    dimensionScores: {
      anxiety: clamp01(r.anxiety / 100),
      avoidance: clamp01(r.avoidance / 100)
    },
    confidence: {
      anxiety: clamp01(
        Number.isFinite(r.confidence.anxiety) ? r.confidence.anxiety : 1
      ),
      avoidance: clamp01(
        Number.isFinite(r.confidence.avoidance) ? r.confidence.avoidance : 1
      )
    },
    version: r.version
  };
}

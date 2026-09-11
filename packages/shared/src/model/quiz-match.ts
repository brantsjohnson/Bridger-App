// ============================================
// WHAT THIS FILE DOES (plain English):
// The psychology baked into Personality quizzes. Some dials want two people
// the same (humor, values, warmth). Some want opposites (who takes charge).
// The Friend Zone uses a style chart, not "same score = good." Nest matching
// and the quiz apps must use this file so they never drift apart.
// ============================================

export type QuizDimMatchMode =
  | 'similarity'
  | 'mild_similarity'
  | 'complementarity'
  | 'none'
  | 'matrix';

export type AttachmentStyle =
  | 'secure'
  | 'anxious'
  | 'avoidant'
  | 'fearful';

/** Per-dimension mode. `*` = every dial on that quiz uses the same rule. */
export const QUIZ_DIM_MATCH_MODE: Record<
  string,
  Record<string, QuizDimMatchMode>
> = {
  personality: {
    sociability: 'mild_similarity',
    assertiveness: 'complementarity',
    agreeableness: 'similarity',
    conscientiousness: 'mild_similarity',
    openness: 'mild_similarity',
    neuroticism: 'none'
  },
  values: { '*': 'similarity' },
  humor: { '*': 'similarity' },
  attachment: { '*': 'matrix' }
};

/**
 * Hand-authored Friend Zone pair quality (0–1).
 * Secure works widely. Anxious + avoidant is the classic trap.
 */
export const ATTACHMENT_MATCH_MATRIX: Record<
  AttachmentStyle,
  Record<AttachmentStyle, number>
> = {
  secure: {
    secure: 1,
    anxious: 0.85,
    avoidant: 0.8,
    fearful: 0.75
  },
  anxious: {
    secure: 0.85,
    anxious: 0.55,
    avoidant: 0.25,
    fearful: 0.4
  },
  avoidant: {
    secure: 0.8,
    anxious: 0.25,
    avoidant: 0.5,
    fearful: 0.35
  },
  fearful: {
    secure: 0.75,
    anxious: 0.4,
    avoidant: 0.35,
    fearful: 0.45
  }
};

/** Cut on the stored 0–1 dials (same as 55/100 on the quiz result screen). */
export const ATTACHMENT_STYLE_CUT = 0.55;

export function quizDimMatchMode(
  quizSlug: string,
  dimensionKey: string
): QuizDimMatchMode {
  const row = QUIZ_DIM_MATCH_MODE[quizSlug];
  if (!row) return 'similarity';
  return row[dimensionKey] ?? row['*'] ?? 'similarity';
}

export function attachmentStyleFromDials(
  anxiety01: number,
  avoidance01: number
): AttachmentStyle {
  const highAnx = anxiety01 >= ATTACHMENT_STYLE_CUT;
  const highAvo = avoidance01 >= ATTACHMENT_STYLE_CUT;
  if (!highAnx && !highAvo) return 'secure';
  if (highAnx && !highAvo) return 'anxious';
  if (!highAnx && highAvo) return 'avoidant';
  return 'fearful';
}

export function attachmentPairScore(
  a: AttachmentStyle,
  b: AttachmentStyle
): number {
  return ATTACHMENT_MATCH_MATRIX[a][b];
}

/**
 * Score one shared dial. Returns null when the dial is not a match gate
 * (emotional sensitivity) so it does not pull the average down or up.
 */
export function pairDimensionScore(
  mode: QuizDimMatchMode,
  scoreA: number,
  scoreB: number
): number | null {
  const a = clamp01(scoreA);
  const b = clamp01(scoreB);
  const gap = Math.abs(a - b);
  if (mode === 'none' || mode === 'matrix') return null;
  if (mode === 'similarity') return 1 - gap;
  if (mode === 'mild_similarity') return 0.5 + 0.5 * (1 - gap);
  // complementarity: opposites attract (who leads vs who follows).
  return gap;
}

/**
 * One shared-quiz score from both people's dials + confidence.
 * Attachment uses the style matrix. Other quizzes mix per-dial modes.
 */
export function sharedQuizAlignment(input: {
  quizSlug: string;
  scoresA: Record<string, number>;
  scoresB: Record<string, number>;
  confA: Record<string, number>;
  confB: Record<string, number>;
  confidenceFloor: number;
}): number | null {
  const { quizSlug, scoresA, scoresB, confA, confB, confidenceFloor } = input;

  if (quizDimMatchMode(quizSlug, '*') === 'matrix' || quizSlug === 'attachment') {
    const ca = Number(confA.anxiety ?? 1);
    const cb = Number(confB.anxiety ?? 1);
    const va = Number(confA.avoidance ?? 1);
    const vb = Number(confB.avoidance ?? 1);
    if (
      Math.min(ca, cb) < confidenceFloor ||
      Math.min(va, vb) < confidenceFloor
    ) {
      return null;
    }
    const styleA = attachmentStyleFromDials(
      Number(scoresA.anxiety ?? 0),
      Number(scoresA.avoidance ?? 0)
    );
    const styleB = attachmentStyleFromDials(
      Number(scoresB.anxiety ?? 0),
      Number(scoresB.avoidance ?? 0)
    );
    return attachmentPairScore(styleA, styleB);
  }

  const dims = new Set([...Object.keys(scoresA), ...Object.keys(scoresB)]);
  let sum = 0;
  let n = 0;
  for (const d of dims) {
    const mode = quizDimMatchMode(quizSlug, d);
    if (mode === 'none' || mode === 'matrix') continue;
    const qa = Number(confA[d] ?? 1);
    const qb = Number(confB[d] ?? 1);
    if (qa < confidenceFloor || qb < confidenceFloor) continue;
    const scored = pairDimensionScore(
      mode,
      Number(scoresA[d] ?? 0),
      Number(scoresB[d] ?? 0)
    );
    if (scored == null) continue;
    const w = Math.min(qa, qb);
    sum += scored * w;
    n += w;
  }
  if (n <= 0) return null;
  return sum / n;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.min(1, Math.max(0, n));
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The Friend Zone measures two continuous dials (anxiety + avoidance), then
// derives a gentle style label. Matching uses a hand-authored style matrix,
// not plain similarity. SES is a helper score so we do not mistake every
// embarrassed feeling for attachment anxiety.
// ============================================

/** Research-backed axes (friendship-worded, not romance). */
export const ATTACHMENT_DIMENSIONS = [
  {
    key: 'anxiety',
    label: 'Sensitivity to uncertainty',
    blurb: 'How strongly possible rejection, exclusion, or losing closeness activates you.',
    matchable: true
  },
  {
    key: 'avoidance',
    label: 'Independence comfort',
    blurb: 'How uncomfortable dependence, being known, and sustained closeness feel.',
    /** Stored as avoidance (high = more distance). UI may flip the label. */
    matchable: true
  }
] as const;

export type AttachmentDimensionKey = (typeof ATTACHMENT_DIMENSIONS)[number]['key'];

/** Derived style after anxiety × avoidance. */
export type AttachmentStyle =
  | 'secure'
  | 'anxious'
  | 'avoidant'
  | 'fearful';

export const ATTACHMENT_STYLE_COPY: Record<
  AttachmentStyle,
  { title: string; blurb: string }
> = {
  secure: {
    title: 'Close and steady',
    blurb:
      'You tend to like being close and you are okay having your own space. Uncertainty can still sting, but it usually does not run the show.'
  },
  anxious: {
    title: 'You tend to love closeness',
    blurb:
      'You are usually comfortable letting people into your world. When something feels uncertain, you may pay extra attention to signs that you are still wanted.'
  },
  avoidant: {
    title: 'You keep your own center',
    blurb:
      'You care about people and usually feel safest handling things yourself. Closeness is fine in doses; being needed (or needing) can feel heavy.'
  },
  fearful: {
    title: 'Close, carefully',
    blurb:
      'You want deep closeness, and being that open can also scare you. Safety and pace matter a lot before you lean in.'
  }
};

/**
 * Hand-authored match quality for style pairs (0–1).
 * Secure works with almost everyone. Anxious + avoidant is the classic trap.
 * Two secures are ideal. Not similarity and not complementarity.
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

export function attachmentMatchScore(
  a: AttachmentStyle,
  b: AttachmentStyle
): number {
  return ATTACHMENT_MATCH_MATRIX[a][b];
}

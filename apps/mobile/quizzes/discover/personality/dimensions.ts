// ============================================
// WHAT THIS FILE DOES (plain English):
// The dials Your Vibe measures. Big Five, with Extraversion split into
// sociability (wants people) and assertiveness (takes charge) because those
// can go opposite ways. Nest matching uses the same modes from
// @bridger/shared quiz-match (do not invent a second chart here).
// ============================================

export const PERSONALITY_DIMENSIONS = [
  {
    key: 'sociability',
    label: 'Sociability',
    /** Matching: mild similarity (logistics / friction, not spark). */
    matchMode: 'mild_similarity' as const,
    matchable: true,
    blurb: 'Wants people around vs needs quiet.'
  },
  {
    key: 'assertiveness',
    label: 'Assertiveness',
    /** Matching: complementarity (leader + go-along-er; two dominants clash). */
    matchMode: 'complementarity' as const,
    matchable: true,
    blurb: 'Takes charge vs goes along.'
  },
  {
    key: 'agreeableness',
    label: 'Agreeableness',
    /** Matching: similarity (warm matches warm). */
    matchMode: 'similarity' as const,
    matchable: true,
    blurb: 'Warmth and cooperation vs blunt comfort with friction.'
  },
  {
    key: 'conscientiousness',
    label: 'Conscientiousness',
    matchMode: 'mild_similarity' as const,
    matchable: true,
    blurb: 'Planning and follow-through vs spontaneity.'
  },
  {
    key: 'openness',
    label: 'Openness',
    matchMode: 'mild_similarity' as const,
    matchable: true,
    /** Light-touch — values + humor already cover a lot of novelty appetite. */
    blurb: 'Curiosity and novelty vs the familiar.'
  },
  {
    key: 'neuroticism',
    label: 'Emotional sensitivity',
    /** Never a matching axis — individual difficulty only. */
    matchMode: 'none' as const,
    matchable: false,
    blurb: 'How strongly negative emotion sticks. Not used to gate matches.'
  }
] as const;

export type PersonalityDimensionKey =
  (typeof PERSONALITY_DIMENSIONS)[number]['key'];

export type PersonalityWeights = Partial<Record<PersonalityDimensionKey, number>>;

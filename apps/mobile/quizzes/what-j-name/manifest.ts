// ============================================
// WHAT THIS FILE DOES (plain English):
// Metadata for the "What J name are you..." quiz plugin. The registry and
// admin tooling can read this without loading the full quiz UI. Status stays
// 'draft' until the take-flow screen (Quiz.tsx) is built and registered, so we
// never expose a half-finished quiz to people.
// ============================================

export const MANIFEST = {
  slug: 'what-j-name',
  /** The id used inside quiz.json (kept separate from the marketing title). */
  quizId: 'what_j_name_are_you',
  title: 'Which "J" name are you?',
  /** This quiz compares friends, so it powers a "who got who" style board. */
  comparable: true,
  status: 'live' as const
};

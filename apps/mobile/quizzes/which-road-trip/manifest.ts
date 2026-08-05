// ============================================
// WHAT THIS FILE DOES (plain English):
// Metadata for the "Which road trip are you?" quiz plugin. The registry and
// admin tooling can read this without loading the full quiz UI.
// ============================================

export const MANIFEST = {
  slug: 'which-road-trip',
  /** Fixture / Home alias. */
  aliases: ['road-trip'] as const,
  title: 'Which road trip are you?',
  comparable: true,
  status: 'live' as const
};

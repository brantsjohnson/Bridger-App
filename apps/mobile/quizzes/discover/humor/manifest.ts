// ============================================
// WHAT THIS FILE DOES (plain English):
// Name tag for the humor Discover quiz. People see "Your Funny Bone";
// code and matching use id `humor`. Live = five taste axes + breadth.
// ============================================

export const MANIFEST = {
  id: 'humor' as const,
  slug: 'your-funny-bone',
  title: 'Your Funny Bone',
  blurb: 'What makes you laugh, and how you joke with friends.',
  emoji: '😂',
  accent: 'coral' as const,
  kind: 'quiz' as const,
  matchable: true,
  status: 'live' as const
};

// ============================================
// WHAT THIS FILE DOES (plain English):
// Picks a flair emoji for a quiz option when the question pack forgot one.
// Same id always gets the same glyph so tiles stay stable.
// ============================================

const POOL = [
  '✨',
  '💫',
  '🎯',
  '🔥',
  '💜',
  '🌊',
  '🍀',
  '🎈',
  '⚡',
  '🌈',
  '🎲',
  '🧩',
  '🎭',
  '💥',
  '🌟',
  '🧡'
] as const;

export function optionEmoji(id: string, explicit?: string): string {
  if (explicit) return explicit;
  let hash = 0;
  for (let i = 0; i < id.length; i += 1) {
    hash = (hash * 31 + id.charCodeAt(i)) % 100000;
  }
  return POOL[hash % POOL.length]!;
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Metadata for the emoji-bomb gift plugin (rains emojis on next open).
// ============================================

export const MANIFEST = {
  slug: 'emoji-bomb',
  name: 'Emoji bomb',
  scope: 'gift' as const,
  mountMode: 'overlay_once' as const,
  attributionTemplate: 'emoji-bombed by {name}'
};

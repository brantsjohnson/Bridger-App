// ============================================
// WHAT THIS FILE DOES (plain English):
// Pulls emoji characters out of a label so a tap can explode those same
// emojis. Magic Patterns does not keep this delight, so Bridger does.
// ============================================

/** Every emoji in a string, in order. Empty if the label has none. */
export function emojisInText(text: string): string[] {
  try {
    return text.match(/\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*/gu) ?? [];
  } catch {
    return [];
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The privacy opening every system prompt must start with. Models are told
// they never get names, contact info, or images, and must not invent facts.
// ============================================

export const PRIVACY_PREAMBLE = `You will never receive names, contact info, or images. Refer to the subject only as 'this person'. Use ONLY the provided material; if it is insufficient, return null. Never invent facts.`;

export function withPreamble(body: string): string {
  return `${PRIVACY_PREAMBLE}\n\n${body}`;
}

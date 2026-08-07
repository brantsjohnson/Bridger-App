// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the quiz moderator: must reject any payload that tries to
// set scores (score-invariance).
// ============================================
import { describe, expect, it } from 'vitest';
import { validateJobOutput } from '../gateway/validate-output';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/quiz-moderator/v1';

describe('quiz-moderator golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('quiz-moderator/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
    expect(SYSTEM).toMatch(/NEVER include scores/i);
  });

  it('accepts confidence-only JSON', () => {
    const raw = JSON.stringify({
      confidence: { openness: 0.8 },
      flags: [],
      adaptations: []
    });
    expect(validateJobOutput('quiz_moderator', 'quiz_moderator', raw).ok).toBe(
      true
    );
  });

  it('rejects JSON that includes scores', () => {
    const raw = JSON.stringify({
      confidence: { openness: 0.8 },
      scores: { openness: 12 }
    });
    const result = validateJobOutput('quiz_moderator', 'quiz_moderator', raw);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('quiz_moderator_has_scores');
  });
});

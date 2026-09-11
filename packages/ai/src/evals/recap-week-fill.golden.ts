// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the Friend Pod fill-in prompt and JSON shape.
// ============================================
import { describe, expect, it } from 'vitest';
import { validateJobOutput } from '../gateway/validate-output';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/recap-week-fill/v1';

describe('recap_week_fill golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('recap-week-fill/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('accepts a questions array', () => {
    const raw = JSON.stringify({
      questions: ['What is your favorite thing that happened this week?']
    });
    expect(validateJobOutput('recap_week_fill', 'recap_week_fill', raw).ok).toBe(
      true
    );
  });

  it('rejects a missing questions list', () => {
    const raw = JSON.stringify({ prompt: 'hello' });
    expect(validateJobOutput('recap_week_fill', 'recap_week_fill', raw).ok).toBe(
      false
    );
  });
});

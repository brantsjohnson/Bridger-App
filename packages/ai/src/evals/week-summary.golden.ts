// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the week-summary prompt shape and JSON validator.
// ============================================
import { describe, expect, it } from 'vitest';
import { validateJobOutput } from '../gateway/validate-output';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/week-summary/v1';

describe('week-summary golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('week-summary/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('accepts day→text JSON', () => {
    const raw = JSON.stringify({
      '2026-08-01': 'Went climbing at the gym',
      '2026-08-02': null
    });
    const result = validateJobOutput(
      'week_summary',
      'week_summary',
      raw,
      'Went climbing at the gym'
    );
    expect(result.ok).toBe(true);
  });
});

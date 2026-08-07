// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the day-summary prompt: privacy preamble present, and
// grounding helper rejects invented claims.
// ============================================
import { describe, expect, it } from 'vitest';
import { isGrounded } from '../gateway/validate-output';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/day-summary/v1';

describe('day-summary golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('day-summary/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('accepts grounded summary', () => {
    const source = 'Sent the climbing route she had been projecting all month';
    expect(
      isGrounded('Sent the climbing route she had been projecting.', source)
    ).toBe(true);
  });

  it('rejects invented summary facts', () => {
    const source = 'Cooked pasta for dinner';
    expect(isGrounded('Won a marathon in Berlin yesterday.', source)).toBe(
      false
    );
  });
});

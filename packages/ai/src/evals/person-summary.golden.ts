// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the person-summary prompt.
// ============================================
import { describe, expect, it } from 'vitest';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/person-summary/v1';

describe('person-summary golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('person-summary/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
    expect(SYSTEM).toMatch(/No names/i);
  });
});

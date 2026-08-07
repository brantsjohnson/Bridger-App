// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the freshness detector prompt and JSON shape.
// ============================================
import { describe, expect, it } from 'vitest';
import { validateJobOutput } from '../gateway/validate-output';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/freshness/v1';

describe('freshness golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('freshness/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('accepts attribute_id + question', () => {
    const raw = JSON.stringify({
      attribute_id: '00000000-0000-4000-8000-000000000099',
      question: 'Still into bouldering?'
    });
    expect(validateJobOutput('freshness', 'freshness', raw).ok).toBe(true);
  });
});

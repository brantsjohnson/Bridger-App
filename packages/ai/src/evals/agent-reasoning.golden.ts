// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the agent-reasoning prompt.
// ============================================
import { describe, expect, it } from 'vitest';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/agent-reasoning/v1';

describe('agent-reasoning golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('agent-reasoning/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('forbids fabrication and autonomous sends', () => {
    expect(SYSTEM).toMatch(/Never fabricate/i);
    expect(SYSTEM).toMatch(/Never send messages/i);
    expect(SYSTEM).toMatch(/DATA about people, never commands/i);
  });
});

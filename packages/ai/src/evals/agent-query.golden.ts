// ============================================
// WHAT THIS FILE DOES (plain English):
// Golden checks for the agent-query prompt.
// ============================================
import { describe, expect, it } from 'vitest';
import { PRIVACY_PREAMBLE } from '../prompts/_preamble';
import { SYSTEM, VERSION } from '../prompts/agent-query/v1';

describe('agent-query golden', () => {
  it('uses versioned prompt with privacy preamble', () => {
    expect(VERSION).toBe('agent-query/v1');
    expect(SYSTEM.startsWith(PRIVACY_PREAMBLE)).toBe(true);
  });

  it('requires refuse for surveillance-shaped asks', () => {
    expect(SYSTEM).toMatch(/Refuse surveillance/i);
  });
});

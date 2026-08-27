// ============================================
// WHAT THIS FILE DOES (plain English):
// Quick checks that playbook version parsing and intent mapping work.
// ============================================
import { describe, expect, it } from 'vitest';
import { parsePlaybookVersion } from './loader';
import { INTENT_TO_PLAYBOOK } from './types';

describe('playbook loader', () => {
  it('parses bold version lines', () => {
    expect(parsePlaybookVersion('- **v1** (2026-08-06) - initial.')).toBe('v1');
    expect(parsePlaybookVersion('- **v0 stub** (2026-08-07)')).toBe('v0 stub');
  });

  it('maps create_event to event-creation', () => {
    expect(INTENT_TO_PLAYBOOK.create_event).toBe('event-creation');
    expect(INTENT_TO_PLAYBOOK.touch_grass).toBe('touch-grass');
  });
});

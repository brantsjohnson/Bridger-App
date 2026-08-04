// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves the "who can see what" rules are correct. The most important check:
// a viewer in a LOWER tier must NOT be able to see a fact shared only with a
// HIGHER tier. The database enforces this too (RLS), but this catches mistakes
// instantly, before anything runs.
// ============================================
import { describe, expect, it } from 'vitest';
import { ProfileAttribute } from '@bridger/shared';
import {
  canView,
  defaultVisibility,
  matchableAttributes,
  tierAtLeast,
  visibleAttributes } from
'./index';

function attr(overrides: Partial<ProfileAttribute>): ProfileAttribute {
  return {
    id: 'a1',
    ownerId: 'u1',
    key: 'favorite_candy',
    value: 'sour',
    layer: 'profile',
    visibleToTier: 'friend',
    matchable: true,
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('tier ordering', () => {
  it('close is at least friend, but acquaintance is not', () => {
    expect(tierAtLeast('close', 'friend')).toBe(true);
    expect(tierAtLeast('acquaintance', 'friend')).toBe(false);
  });
});

describe('canView — the core privacy rule', () => {
  it('lets a closer viewer see a friend-tier fact', () => {
    expect(canView(attr({ visibleToTier: 'friend' }), 'close')).toBe(true);
  });

  it('BLOCKS a lower tier from a higher-tier fact', () => {
    // An acquaintance must never see a Close-friends-only fact.
    expect(canView(attr({ visibleToTier: 'close' }), 'acquaintance')).toBe(false);
  });

  it("never shows a 'none' (private) fact to anyone", () => {
    expect(canView(attr({ visibleToTier: 'none' }), 'close')).toBe(false);
  });
});

describe('filtering helpers', () => {
  it('visibleAttributes drops anything above the viewer tier', () => {
    const attrs = [
      attr({ id: 'x', visibleToTier: 'acquaintance' }),
      attr({ id: 'y', visibleToTier: 'close' })
    ];
    const seen = visibleAttributes(attrs, 'friend').map((a) => a.id);
    expect(seen).toEqual(['x']);
  });

  it('matchableAttributes keeps only matchable facts', () => {
    const attrs = [
      attr({ id: 'x', matchable: true }),
      attr({ id: 'y', matchable: false })
    ];
    expect(matchableAttributes(attrs).map((a) => a.id)).toEqual(['x']);
  });
});

describe('defaultVisibility — sensible defaults per layer', () => {
  it('connection-layer signals are private but matchable', () => {
    expect(defaultVisibility('connection')).toEqual({
      visibleToTier: 'none',
      matchable: true
    });
  });
});

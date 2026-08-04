// ============================================
// WHAT THIS FILE DOES (plain English):
// This is the "tagged twice" engine. Every fact about a person carries two
// tags: who is allowed to SEE it (visibleToTier) and whether the matchmaker
// may USE it (matchable). These pure functions are the ONE place that decides
// both. The API imports them to ENFORCE the rules; the app imports them to
// PREDICT what to show, so the screen never offers something the server rejects.
// ============================================
import {
  Layer,
  ProfileAttribute,
  Tier,
  TIER_ORDER } from
'@bridger/shared';

/** is `viewer` at least as close as `required`? */
export function tierAtLeast(viewer: Tier, required: Tier): boolean {
  return TIER_ORDER[viewer] >= TIER_ORDER[required];
}

export function canView(attr: ProfileAttribute, viewerTier: Tier): boolean {
  if (attr.visibleToTier === 'none') return false;
  return tierAtLeast(viewerTier, attr.visibleToTier);
}

export function visibleAttributes(
attrs: ProfileAttribute[],
viewerTier: Tier)
: ProfileAttribute[] {
  return attrs.filter((a) => canView(a, viewerTier));
}

export function matchableAttributes(
attrs: ProfileAttribute[])
: ProfileAttribute[] {
  return attrs.filter((a) => a.matchable);
}

/** Defaults spare users from toggling every field. */
export function defaultVisibility(layer: Layer): {
  visibleToTier: Tier;
  matchable: boolean;
} {
  switch (layer) {
    case 'essential':
      return { visibleToTier: 'acquaintance', matchable: true };
    case 'profile':
      return { visibleToTier: 'friend', matchable: true };
    case 'connection':
      return { visibleToTier: 'none', matchable: true };
  }
}
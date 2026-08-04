import {
  Layer,
  ProfileAttribute,
  Tier,
  TIER_ORDER } from
'../shared';

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
// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared privacy helpers for stories and the Home feed. The API uses the
// service-role key (bypasses row-level security), so every read re-checks
// "are these two people blocked?" and "has the owner tiered the viewer high
// enough?" here instead of trusting the client.
// ============================================
import type { Tier } from '@bridger/shared';
import type { SupabaseService } from '../supabase/supabase.service';

/** Higher number = closer circle. Used for "is my tier enough?" compares. */
export const TIER_RANK: Record<Tier, number> = {
  close: 3,
  friend: 2,
  acquaintance: 1,
  none: 0
};

/** Is there a block either direction between two people? */
export async function isBlocked(
  supabase: SupabaseService,
  a: string,
  b: string
): Promise<boolean> {
  if (a === b) return false;
  const { data, error } = await supabase.admin
    .from('blocks')
    .select('blocker_id, blocked_id')
    .or(
      `and(blocker_id.eq.${a},blocked_id.eq.${b}),and(blocker_id.eq.${b},blocked_id.eq.${a})`
    );
  if (error) throw error;
  return (data?.length ?? 0) > 0;
}

/** How the owner has privately sorted the viewer (null = not sorted). */
export async function viewerTier(
  supabase: SupabaseService,
  ownerId: string,
  viewerId: string
): Promise<Tier | null> {
  if (ownerId === viewerId) return 'close';
  const { data, error } = await supabase.admin
    .from('tiers')
    .select('tier')
    .eq('user_id', ownerId)
    .eq('other_id', viewerId)
    .maybeSingle();
  if (error) throw error;
  return (data?.tier as Tier | undefined) ?? null;
}

/**
 * May the viewer see something the owner shared at `required` tier?
 * Owner always can. 'none' is visible to no one. Blocks always deny.
 */
export async function canViewTier(
  supabase: SupabaseService,
  ownerId: string,
  viewerId: string,
  required: Tier
): Promise<boolean> {
  if (ownerId === viewerId) return true;
  if (required === 'none') return false;
  if (await isBlocked(supabase, ownerId, viewerId)) return false;
  const tier = await viewerTier(supabase, ownerId, viewerId);
  if (!tier) return false;
  return TIER_RANK[tier] >= TIER_RANK[required];
}

/** Deterministic accent from an id (matches the mobile people-cache hash). */
export function accentForId(
  id: string
): 'purple' | 'coral' | 'teal' | 'amber' | 'pink' | 'blue' | 'green' {
  const accents = [
    'purple',
    'coral',
    'teal',
    'amber',
    'pink',
    'blue',
    'green'
  ] as const;
  let h = 0;
  for (let i = 0; i < id.length; i += 1) {
    h = (h * 31 + id.charCodeAt(i)) | 0;
  }
  return accents[Math.abs(h) % accents.length] ?? 'purple';
}

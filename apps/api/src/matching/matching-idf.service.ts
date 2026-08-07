// ============================================
// WHAT THIS FILE DOES (plain English):
// Counts how common each Everyone+matchable attribute is, so rare overlaps
// (aerial silks) beat generic ones (likes music) in shared_attributes.
// ============================================
import { Injectable } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class MatchingIdfService {
  private cache: Map<string, number> | null = null;
  private cacheAt = 0;
  private readonly ttlMs = 10 * 60 * 1000;

  constructor(private readonly supabase: SupabaseService) {}

  /** Inverse-frequency weight in (0,1] — rarer keys score higher. */
  async weightForKey(attrKey: string): Promise<number> {
    const freq = await this.frequencies();
    const n = freq.get(attrKey) ?? 1;
    const total = Math.max(1, freq.get('__users__') ?? 1);
    // classic idf-ish: log((N+1)/(n+1)) normalized
    const raw = Math.log((total + 1) / (n + 1));
    const max = Math.log((total + 1) / 2);
    if (max <= 0) return 0.5;
    return Math.min(1, Math.max(0.05, raw / max));
  }

  async clearCache() {
    this.cache = null;
  }

  private async frequencies(): Promise<Map<string, number>> {
    if (this.cache && Date.now() - this.cacheAt < this.ttlMs) return this.cache;

    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('user_id')
      .eq('discoverable', true);
    const userCount = settings?.length ?? 1;

    const { data: attrs } = await this.supabase.admin
      .from('attributes')
      .select('key, owner_id')
      .eq('matchable', true)
      .eq('visible_to_tier', 'acquaintance');

    const map = new Map<string, number>();
    map.set('__users__', Math.max(1, userCount));
    const seen = new Map<string, Set<string>>();
    for (const a of attrs ?? []) {
      if (!seen.has(a.key)) seen.set(a.key, new Set());
      seen.get(a.key)!.add(a.owner_id);
    }
    for (const [key, owners] of seen) {
      map.set(key, owners.size);
    }
    this.cache = map;
    this.cacheAt = Date.now();
    return map;
  }
}

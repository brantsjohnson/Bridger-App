// ============================================
// WHAT THIS FILE DOES (plain English):
// Touch Grass on the server: the "I'm free to hang" signal. People send a
// signal to Close or Friends (never Everyone / acquaintances) with a timing (now / tonight
// / weekend) and a short why. Friends in that circle get a notification and see
// it on Home + Events. Recipients respond "I'm in" (notifies the sender) or
// dismiss. The sender sees who's in (visible to them only). Signals expire.
//
// PRIVACY: we never expose who dismissed. We never store the why in analytics.
// This service uses the service-role client, so it re-checks the audience by
// hand (the tiers table) instead of relying on row-level security.
// ============================================
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { GrassSignal, GrassWhen, Tier } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

/** How close each audience choice reaches (higher = more exclusive). */
const TIER_RANK: Record<Tier, number> = {
  close: 3,
  friend: 2,
  acquaintance: 1,
  none: 0
};

/** Friendly display for each timing window. */
const WHEN_LABEL: Record<GrassWhen, string> = {
  now: 'Now',
  tonight: 'Tonight',
  weekend: 'This weekend'
};

/** Map the app's "who" choice to a stored audience tier. Everyone is not allowed. */
const AUDIENCE_TIER: Record<string, Tier> = {
  close: 'close',
  friends: 'friend',
  friend: 'friend'
};

@Injectable()
export class TouchGrassService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Work out when a signal should stop showing, from its timing window. */
  private computeExpiry(when: GrassWhen): string {
    const now = new Date();
    if (when === 'now') {
      // A "now" signal is good for a few hours.
      now.setHours(now.getHours() + 4);
      return now.toISOString();
    }
    if (when === 'tonight') {
      // End of today (local server midnight).
      now.setHours(23, 59, 59, 0);
      return now.toISOString();
    }
    // weekend: end of the upcoming Sunday.
    const day = now.getDay(); // 0 = Sun
    const daysUntilSunday = (7 - day) % 7;
    now.setDate(now.getDate() + daysUntilSunday);
    now.setHours(23, 59, 59, 0);
    return now.toISOString();
  }

  // --- List signals the user should see (their circle, not dismissed) ---

  async list(userId: string): Promise<GrassSignal[]> {
    const nowIso = new Date().toISOString();

    // Active (unexpired) signals, newest first.
    const { data: rows, error } = await this.supabase.admin
      .from('touch_grass')
      .select('*')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const signals = rows ?? [];
    if (signals.length === 0) return [];

    const authorIds = Array.from(new Set(signals.map((s) => s.author_id)));

    // How each author has tiered THIS user (decides which signals they see).
    const { data: tierRows, error: tierErr } = await this.supabase.admin
      .from('tiers')
      .select('user_id, tier')
      .in('user_id', authorIds)
      .eq('other_id', userId);
    if (tierErr) throw tierErr;
    const myTierFromAuthor = new Map<string, Tier>();
    for (const t of tierRows ?? []) {
      myTierFromAuthor.set(t.user_id, t.tier as Tier);
    }

    // Signals this user has already dismissed (hide them).
    const { data: dismissedRows, error: disErr } = await this.supabase.admin
      .from('touch_grass_responses')
      .select('signal_id')
      .eq('user_id', userId)
      .eq('status', 'dismissed');
    if (disErr) throw disErr;
    const dismissed = new Set((dismissedRows ?? []).map((d) => d.signal_id));

    // Responses for the user's own signals, so they can see who's in.
    const myOwnSignalIds = signals
      .filter((s) => s.author_id === userId)
      .map((s) => s.id);
    const inBySignal = new Map<string, string[]>();
    if (myOwnSignalIds.length) {
      const { data: inRows, error: inErr } = await this.supabase.admin
        .from('touch_grass_responses')
        .select('signal_id, user_id')
        .in('signal_id', myOwnSignalIds)
        .eq('status', 'in');
      if (inErr) throw inErr;
      for (const r of inRows ?? []) {
        const arr = inBySignal.get(r.signal_id) ?? [];
        arr.push(r.user_id);
        inBySignal.set(r.signal_id, arr);
      }
    }

    const visible = signals.filter((s) => {
      if (dismissed.has(s.id)) return false;
      if (s.author_id === userId) return true;
      const myTier = myTierFromAuthor.get(s.author_id);
      if (!myTier) return false;
      return TIER_RANK[myTier] >= TIER_RANK[s.audience_tier as Tier];
    });

    return visible.map((s) => this.toSignal(s, userId, inBySignal.get(s.id)));
  }

  /** The user's own currently-live signal (if any), with who's in. */
  async getMine(userId: string): Promise<GrassSignal | null> {
    const nowIso = new Date().toISOString();
    const { data, error } = await this.supabase.admin
      .from('touch_grass')
      .select('*')
      .eq('author_id', userId)
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;

    const { data: inRows, error: inErr } = await this.supabase.admin
      .from('touch_grass_responses')
      .select('user_id')
      .eq('signal_id', data.id)
      .eq('status', 'in');
    if (inErr) throw inErr;

    return this.toSignal(data, userId, (inRows ?? []).map((r) => r.user_id));
  }

  // --- Send a new signal + notify the chosen circle ---

  async create(
    userId: string,
    body: { who: string; when: GrassWhen; note?: string }
  ): Promise<GrassSignal> {
    const whoKey = (body.who ?? '').toLowerCase();
    const audienceTier = AUDIENCE_TIER[whoKey];
    if (!audienceTier) {
      throw new BadRequestException('Touch Grass can only go to Close or Friends.');
    }
    const when = body.when;
    const expiresAt = this.computeExpiry(when);

    const { data, error } = await this.supabase.admin
      .from('touch_grass')
      .insert({
        author_id: userId,
        audience_tier: audienceTier,
        when_window: when,
        why: body.note ?? null,
        expires_at: expiresAt
      })
      .select('*')
      .single();
    if (error) throw error;

    await this.notifyAudience(userId, audienceTier, data.id, when);

    return this.toSignal(data, userId, []);
  }

  /** Find everyone in the author's chosen circle and drop a notification. */
  private async notifyAudience(
    authorId: string,
    audienceTier: Tier,
    signalId: string,
    when: GrassWhen
  ): Promise<void> {
    // People the author has tiered at or above the audience tier.
    const { data: tierRows, error } = await this.supabase.admin
      .from('tiers')
      .select('other_id, tier')
      .eq('user_id', authorId);
    if (error) throw error;

    const recipientIds = (tierRows ?? [])
      .filter((t) => TIER_RANK[t.tier as Tier] >= TIER_RANK[audienceTier])
      .map((t) => t.other_id);

    if (recipientIds.length === 0) return;

    const rows = recipientIds.map((uid) => ({
      user_id: uid,
      kind: 'touch_grass',
      payload: { signal_id: signalId, when } as never
    }));
    const { error: notifErr } = await this.supabase.admin
      .from('notifications')
      .insert(rows);
    if (notifErr) throw notifErr;
  }

  // --- Respond: I'm in (notifies the author) ---

  async join(userId: string, signalId: string): Promise<void> {
    const signal = await this.requireSignal(signalId);

    const { error } = await this.supabase.admin
      .from('touch_grass_responses')
      .upsert(
        { signal_id: signalId, user_id: userId, status: 'in' },
        { onConflict: 'signal_id,user_id' }
      );
    if (error) throw error;

    // Tell the sender someone is in (never tell anyone else).
    if (signal.author_id !== userId) {
      const { error: notifErr } = await this.supabase.admin
        .from('notifications')
        .insert({
          user_id: signal.author_id,
          kind: 'touch_grass_in',
          payload: { signal_id: signalId, from: userId } as never
        });
      if (notifErr) throw notifErr;
    }
  }

  // --- Respond: dismiss (hide it for me only) ---

  async dismiss(userId: string, signalId: string): Promise<void> {
    await this.requireSignal(signalId);
    const { error } = await this.supabase.admin
      .from('touch_grass_responses')
      .upsert(
        { signal_id: signalId, user_id: userId, status: 'dismissed' },
        { onConflict: 'signal_id,user_id' }
      );
    if (error) throw error;
  }

  // --- End my own live signal ---

  async endMine(userId: string): Promise<void> {
    const { error } = await this.supabase.admin
      .from('touch_grass')
      .delete()
      .eq('author_id', userId);
    if (error) throw error;
  }

  private async requireSignal(signalId: string) {
    const { data, error } = await this.supabase.admin
      .from('touch_grass')
      .select('id, author_id, audience_tier')
      .eq('id', signalId)
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundException('Signal not found');
    return data;
  }

  /** Shape a DB row into the shared GrassSignal the app expects. */
  private toSignal(
    row: {
      id: string;
      author_id: string;
      audience_tier: string;
      when_window: string;
      why: string | null;
      expires_at: string | null;
    },
    userId: string,
    inIds?: string[]
  ): GrassSignal {
    const when = row.when_window as GrassWhen;
    return {
      id: row.id,
      personId: row.author_id,
      whenWindow: when,
      when: WHEN_LABEL[when] ?? when,
      note: row.why ?? undefined,
      what: row.why ?? undefined,
      audience: row.audience_tier,
      // Who's in: author sees everyone who joined; a joiner always sees
      // themselves so "I'm in" updates Who's in on their phone right away.
      inIds:
        row.author_id === userId
          ? inIds ?? []
          : (inIds ?? []).includes(userId)
            ? [userId]
            : undefined,
      expiresAt: row.expires_at ?? undefined,
      mine: row.author_id === userId
    };
  }
}

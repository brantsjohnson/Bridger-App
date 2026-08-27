// ============================================
// WHAT THIS FILE DOES (plain English):
// The server brain for the "Which J name are you?" quiz. It can:
//  1) save a person's result,
//  2) hand back one stable share link for them,
//  3) show the free, no-account web view of a shared result (and quietly note
//     that someone opened it),
//  4) after a new person signs up, connect them to the friend whose link they
//     opened ("who invited whom"),
//  5) build the "your version of Jake" leaderboard (friends grouped by the
//     J-name they got),
//  6) notify when a friend opens your link, or when a friend lands on one of
//     your top three J-name picks.
//
// PRIVACY: we only ever store the fun result (a J-name + a percent) and opaque
// user ids. No names in analytics, no message text, no photos. Everything
// hard-deletes with the account via the database cascade.
// ============================================
import {
  BadRequestException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  JnameLeaderboard,
  JnameResultInput,
  JnameShareResponse,
  JnameSharedView
} from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class JnameService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService
  ) {}

  // --- Where the public web page lives (used to build share links). ---
  private webBase(): string {
    const base =
      this.config.get<string>('APP_WEB_URL') ?? 'https://bridger.app';
    return base.replace(/\/$/, '');
  }

  // --- Accepted friends both ways, minus anyone blocked either way. ---
  private async friendIdsOf(userId: string): Promise<Set<string>> {
    const { data: rows, error } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;

    const otherIds = (rows ?? []).map((r) =>
      r.user_a === userId ? r.user_b : r.user_a
    );

    const { data: blocks, error: bErr } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    if (bErr) throw bErr;

    const blocked = new Set<string>();
    for (const b of blocks ?? []) {
      blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }

    return new Set(otherIds.filter((id) => !blocked.has(id)));
  }

  // --- Save (or overwrite on retake) this person's result + notify friends. ---
  async saveResult(userId: string, body: JnameResultInput) {
    if (!body?.jName) {
      throw new BadRequestException('jName is required');
    }
    const percent = Math.max(0, Math.min(100, Math.round(body.percent ?? 0)));
    const topNames = Array.isArray(body.topNames)
      ? body.topNames.filter((n) => typeof n === 'string' && n.trim()).slice(0, 3)
      : [];

    // Did they already have this same result? Skip re-notifying on a retake.
    const { data: prior } = await this.supabase.admin
      .from('jname_results')
      .select('j_name')
      .eq('user_id', userId)
      .maybeSingle();
    const isNewResult = !prior || prior.j_name !== body.jName;

    const { error } = await this.supabase.admin.from('jname_results').upsert(
      {
        user_id: userId,
        j_name: body.jName,
        percent,
        top_names: topNames,
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;

    if (isNewResult) {
      await this.notifyFriendsOfTopMatch(userId, body.jName);
    }

    return { ok: true };
  }

  // --- "Your version of X": friends grouped by the J-name they got. ---
  async getLeaderboard(userId: string): Promise<JnameLeaderboard> {
    const friends = await this.friendIdsOf(userId);
    if (!friends.size) {
      return { buckets: [], teaserLimit: 3 };
    }

    const friendList = Array.from(friends);
    const { data: rows, error } = await this.supabase.admin
      .from('jname_results')
      .select('user_id, j_name')
      .in('user_id', friendList);
    if (error) throw error;

    const byName = new Map<string, string[]>();
    for (const row of rows ?? []) {
      const list = byName.get(row.j_name) ?? [];
      list.push(row.user_id);
      byName.set(row.j_name, list);
    }

    // Biggest groups first so the Home teaser's top 3 are the busiest ones.
    // New personas appear as friends take the quiz (the board grows).
    const buckets = Array.from(byName.entries())
      .map(([jName, friendIds]) => ({ jName, friendIds }))
      .sort(
        (a, b) =>
          b.friendIds.length - a.friendIds.length ||
          a.jName.localeCompare(b.jName)
      );

    return { buckets, teaserLimit: 3 };
  }

  // --- Get (or make once) this person's stable share link. ---
  async getOrCreateShare(userId: string): Promise<JnameShareResponse> {
    const { data: existing, error: exErr } = await this.supabase.admin
      .from('jname_shares')
      .select('token')
      .eq('sharer_id', userId)
      .maybeSingle();
    if (exErr) throw exErr;
    if (existing?.token) {
      return { token: existing.token, url: this.linkFor(existing.token) };
    }

    const { data: result, error: rErr } = await this.supabase.admin
      .from('jname_results')
      .select('j_name, percent')
      .eq('user_id', userId)
      .maybeSingle();
    if (rErr) throw rErr;
    if (!result) {
      throw new BadRequestException('Finish the quiz before sharing.');
    }

    const { data: created, error: cErr } = await this.supabase.admin
      .from('jname_shares')
      .insert({
        sharer_id: userId,
        j_name: result.j_name,
        percent: result.percent
      })
      .select('token')
      .single();
    if (cErr) throw cErr;

    return { token: created.token, url: this.linkFor(created.token) };
  }

  private linkFor(token: string): string {
    return `${this.webBase()}/q/${token}`;
  }

  // --- The free, no-account web view + quietly record that it was opened. ---
  async getSharedView(
    token: string,
    viewerId?: string,
    anonRef?: string
  ): Promise<JnameSharedView> {
    const { data: share, error } = await this.supabase.admin
      .from('jname_shares')
      .select('sharer_id, j_name, percent')
      .eq('token', token)
      .maybeSingle();
    if (error) throw error;
    if (!share) throw new NotFoundException('That link is not available.');

    if (viewerId && viewerId !== share.sharer_id) {
      await this.recordOpenByUser(token, share.sharer_id, viewerId);
    } else if (!viewerId && anonRef) {
      await this.recordOpenByAnon(token, share.sharer_id, anonRef);
    }

    let sharerFirstName: string | undefined;
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name')
      .eq('user_id', share.sharer_id)
      .maybeSingle();
    if (identity?.display_name) {
      sharerFirstName = identity.display_name.trim().split(/\s+/)[0];
    }

    return { jName: share.j_name, percent: share.percent, sharerFirstName };
  }

  // A logged-in opener: link the open to their account and notify the sharer once.
  private async recordOpenByUser(
    token: string,
    sharerId: string,
    invitedUserId: string
  ) {
    const { data: existing } = await this.supabase.admin
      .from('jname_referrals')
      .select('id')
      .eq('token', token)
      .eq('invited_user_id', invitedUserId)
      .maybeSingle();
    if (existing) return;

    await this.supabase.admin.from('jname_referrals').insert({
      token,
      sharer_id: sharerId,
      invited_user_id: invitedUserId,
      resolved_at: new Date().toISOString()
    });

    await this.notifyLinkOpened(sharerId, invitedUserId);
  }

  // An anonymous opener: remember the device; notify sharer once (no person id).
  private async recordOpenByAnon(
    token: string,
    sharerId: string,
    anonRef: string
  ) {
    const { data: existing } = await this.supabase.admin
      .from('jname_referrals')
      .select('id')
      .eq('token', token)
      .eq('anon_ref', anonRef)
      .is('invited_user_id', null)
      .maybeSingle();
    if (existing) return;

    await this.supabase.admin.from('jname_referrals').insert({
      token,
      sharer_id: sharerId,
      anon_ref: anonRef
    });

    await this.notifyLinkOpened(sharerId, undefined);
  }

  // --- After signup: connect the new account to the friend who invited them. ---
  async resolveReferral(
    userId: string,
    input: { token?: string; anonRef?: string }
  ) {
    let token = input.token;
    if (!token && input.anonRef) {
      const { data: byAnon } = await this.supabase.admin
        .from('jname_referrals')
        .select('token')
        .eq('anon_ref', input.anonRef)
        .is('invited_user_id', null)
        .limit(1)
        .maybeSingle();
      token = byAnon?.token ?? undefined;
    }
    if (!token) return { resolved: false };

    const { data: share } = await this.supabase.admin
      .from('jname_shares')
      .select('sharer_id')
      .eq('token', token)
      .maybeSingle();
    if (!share || share.sharer_id === userId) return { resolved: false };

    await this.supabase.admin.from('jname_referrals').upsert(
      {
        token,
        sharer_id: share.sharer_id,
        invited_user_id: userId,
        resolved_at: new Date().toISOString()
      },
      { onConflict: 'token,invited_user_id' }
    );
    return { resolved: true };
  }

  // --- NOTIFY: someone opened your shared quiz link. ---
  private async notifyLinkOpened(sharerId: string, fromUserId?: string) {
    await this.supabase.admin.from('notifications').insert({
      user_id: sharerId,
      kind: 'jname_link_opened',
      payload: {
        quiz_slug: 'what-j-name',
        ...(fromUserId ? { from: fromUserId } : {})
      } as never
    });
  }

  // --- NOTIFY: a friend landed on a J-name that was in your top 3 picks. ---
  private async notifyFriendsOfTopMatch(takerId: string, jName: string) {
    const friends = await this.friendIdsOf(takerId);
    if (!friends.size) return;

    const { data: rows, error } = await this.supabase.admin
      .from('jname_results')
      .select('user_id, top_names')
      .in('user_id', Array.from(friends));
    if (error) throw error;

    for (const row of rows ?? []) {
      const tops = Array.isArray(row.top_names) ? row.top_names : [];
      if (!tops.includes(jName)) continue;
      await this.supabase.admin.from('notifications').insert({
        user_id: row.user_id,
        kind: 'jname_top_match',
        payload: {
          from: takerId,
          quiz_slug: 'what-j-name',
          j_name: jName
        } as never
      });
    }
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the Assistant's context from ONLY what you could already see in the
// app: your notes, your friends' tier-visible facts, your upcoming dates, your
// events. Never a privileged backdoor. Never matching/ML internals.
//
// --- SECURITY / PRIVACY ---
// Single-user. Fail closed if a person is not connected.
// ============================================
import { Injectable } from '@nestjs/common';
import type { Tier } from '@bridger/shared';
import { canViewTier, isBlocked, TIER_RANK } from '../common/visibility';
import { NotesService } from '../notes/notes.service';
import { SupabaseService } from '../supabase/supabase.service';

export interface FriendContext {
  personId: string;
  displayName: string;
  tier: Tier;
  notes: Array<{ id: string; kind: string; text: string; date?: string }>;
  profileFacts: string[];
}

@Injectable()
export class AssistantContextService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly notes: NotesService
  ) {}

  /** Wrap blocks so the model treats them as data, never instructions. */
  delimit(label: string, body: string): string {
    return `<data kind="${label}">\n${body}\n</data>`;
  }

  async listConnections(userId: string): Promise<
    Array<{ personId: string; displayName: string; tier: Tier; createdAt: string }>
  > {
    const { data: rows } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b, created_at')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);

    const out: Array<{
      personId: string;
      displayName: string;
      tier: Tier;
      createdAt: string;
    }> = [];

    for (const row of rows ?? []) {
      const other = row.user_a === userId ? row.user_b : row.user_a;
      if (await isBlocked(this.supabase, userId, other)) continue;
      const tier = await this.tierToward(userId, other);
      const { data: identity } = await this.supabase.admin
        .from('user_identity')
        .select('display_name')
        .eq('user_id', other)
        .maybeSingle();
      out.push({
        personId: other,
        displayName: identity?.display_name ?? 'Friend',
        tier,
        createdAt: row.created_at
      });
    }
    return out;
  }

  async recallFriend(userId: string, personId: string): Promise<FriendContext | null> {
    const friends = await this.listConnections(userId);
    const link = friends.find((f) => f.personId === personId);
    if (!link) return null;

    const notes = await this.notes.list(userId, personId);
    const profileFacts = await this.visibleFacts(userId, personId, link.tier);

    return {
      personId,
      displayName: link.displayName,
      tier: link.tier,
      notes: notes.map((n) => ({
        id: n.id,
        kind: n.kind,
        text: n.body,
        date: n.date
      })),
      profileFacts
    };
  }

  async searchNotes(userId: string, query: string) {
    const q = query.trim().toLowerCase();
    const notes = await this.notes.list(userId);
    return notes
      .filter((n) => n.body.toLowerCase().includes(q))
      .slice(0, 20)
      .map((n) => ({
        id: n.id,
        personId: n.personId,
        kind: n.kind,
        text: n.body,
        date: n.date
      }));
  }

  async listUpcoming(userId: string) {
    const notes = await this.notes.list(userId);
    const now = Date.now();
    const items: Array<{ label: string; personId: string; when: string }> = [];
    for (const n of notes) {
      if (n.kind === 'date' && n.date && n.remind) {
        items.push({
          label: n.body,
          personId: n.personId,
          when: n.date
        });
      }
      if (n.kind === 'check_in' && n.nextRemindAt) {
        if (new Date(n.nextRemindAt).getTime() <= now) {
          items.push({
            label: `Check in: ${n.body}`,
            personId: n.personId,
            when: 'now'
          });
        }
      }
    }
    return items.slice(0, 20);
  }

  /**
   * Reconnect: quiet friends (14+ days) without an upcoming date in 7 days.
   * Messages tables may be absent — fall back to connection.created_at + check-ins.
   */
  async whoToReconnect(userId: string) {
    const friends = await this.listConnections(userId);
    const notes = await this.notes.list(userId);
    const upcomingPersonIds = new Set(
      notes
        .filter((n) => n.kind === 'date' && n.date && withinDays(n.date, 7))
        .map((n) => n.personId)
    );

    const scored = friends
      .filter((f) => !upcomingPersonIds.has(f.personId))
      .map((f) => {
        const daysQuiet = daysSince(f.createdAt);
        return { ...f, daysQuiet };
      })
      .filter((f) => f.daysQuiet >= 14)
      .sort((a, b) => b.daysQuiet - a.daysQuiet)
      .slice(0, 3);

    return scored.map((f) => ({
      personId: f.personId,
      displayName: f.displayName,
      daysQuiet: f.daysQuiet
    }));
  }

  async buildDelimitedContext(userId: string, focusPersonIds: string[] = []) {
    const friends = await this.listConnections(userId);
    const roster = friends
      .map((f) => `${f.displayName} (id=${f.personId}, tier=${f.tier})`)
      .join('\n');

    const focusBlocks: string[] = [];
    for (const id of focusPersonIds) {
      const ctx = await this.recallFriend(userId, id);
      if (!ctx) continue;
      focusBlocks.push(
        this.delimit(
          'friend',
          JSON.stringify({
            name: ctx.displayName,
            person_id: ctx.personId,
            notes: ctx.notes,
            profile_facts: ctx.profileFacts
          })
        )
      );
    }

    const upcoming = await this.listUpcoming(userId);
    return [
      this.delimit('friends_roster', roster || '(no friends yet)'),
      this.delimit('upcoming', JSON.stringify(upcoming)),
      ...focusBlocks
    ].join('\n\n');
  }

  private async tierToward(viewerId: string, ownerId: string): Promise<Tier> {
    // How the owner sorted the viewer (tiers.user_id = owner, other_id = viewer).
    const { data } = await this.supabase.admin
      .from('tiers')
      .select('tier')
      .eq('user_id', ownerId)
      .eq('other_id', viewerId)
      .maybeSingle();
    return (data?.tier as Tier) ?? 'acquaintance';
  }

  private async visibleFacts(
    viewerId: string,
    ownerId: string,
    viewerTier: Tier
  ): Promise<string[]> {
    const { data: attrs } = await this.supabase.admin
      .from('attributes')
      .select('key, value, visible_to_tier')
      .eq('owner_id', ownerId);

    const out: string[] = [];
    for (const a of attrs ?? []) {
      const need = a.visible_to_tier as Tier;
      if ((TIER_RANK[viewerTier] ?? 0) < (TIER_RANK[need] ?? 99)) continue;
      const ok = await canViewTier(this.supabase, ownerId, viewerId, need);
      if (!ok) continue;
      out.push(`${a.key}: ${JSON.stringify(a.value)}`);
    }
    return out.slice(0, 40);
  }
}

function daysSince(iso: string): number {
  const t = new Date(iso).getTime();
  return Math.floor((Date.now() - t) / 86400000);
}

function withinDays(dateStr: string, days: number): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!m) return false;
  const target = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  return diff >= 0 && diff <= days;
}

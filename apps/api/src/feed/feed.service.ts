// ============================================
// WHAT THIS FILE DOES (plain English):
// Assembles the Home "stories" row and the "what people said" replies strip.
// Only shows Updates from people you're connected to (plus you), filtered by
// the tier they put you in — and only while still inside the 24h live window.
// After that, pictures live on the author's Profile calendar archive.
// No view counts are returned (no vanity metrics).
// ============================================
import { Injectable } from '@nestjs/common';
import type {
  AppNotification,
  Reaction,
  ReactionKind,
  Story,
  Tier,
  UpcomingItem
} from '@bridger/shared';
import { sortUpcomingItems } from '@bridger/shared';
import { accentForId, canViewTier, isBlocked } from '../common/visibility';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class FeedService {
  constructor(private readonly supabase: SupabaseService) {}

  /** Accepted connection other-ids for me (blocks excluded). */
  private async connectionIds(userId: string): Promise<string[]> {
    const { data: rows, error } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    if (error) throw error;

    const others = (rows ?? []).map((r) =>
      r.user_a === userId ? r.user_b : r.user_a
    );

    const { data: blocks } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`);
    const blocked = new Set<string>();
    for (const b of blocks ?? []) {
      blocked.add(b.blocker_id === userId ? b.blocked_id : b.blocker_id);
    }
    return others.filter((id) => !blocked.has(id));
  }

  /** One Home tray tile — only if this person still has a LIVE (≤24h) update. */
  private async storyTileFor(
    viewerId: string,
    authorId: string,
    name: string
  ): Promise<Story | null> {
    const nowIso = new Date().toISOString();

    // Home tray = LIVE updates only (inside the 24h window). Past that, the
    // picture is archived on the author's Profile calendar — not here.
    const { data: rows, error } = await this.supabase.admin
      .from('stories')
      .select('id, update_text, theme_slug, created_at, visible_to_tier, live_until, revision')
      .eq('author_id', authorId)
      .in('type', ['photo', 'video'])
      .gt('live_until', nowIso)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const visible = [];
    for (const row of rows ?? []) {
      const ok = await canViewTier(
        this.supabase,
        authorId,
        viewerId,
        row.visible_to_tier as Tier
      );
      if (ok) visible.push(row);
    }
    if (visible.length === 0) return null;

    const latest = visible[0]!;
    const prompt =
      latest.theme_slug ||
      (latest.update_text ? latest.update_text.slice(0, 40) : 'Update');

    return {
      id: authorId,
      authorId,
      authorName: name,
      emoji: '📸',
      accent: accentForId(authorId),
      prompt,
      postedAt: latest.created_at,
      // PRIVACY: no vanity view tracking exposed; always unread until that ships.
      seen: false,
      segments: visible.length,
      // Sum of page revisions: when the author adds to a page, this changes and
      // the phone lights the ring again (per-viewer, never a public count).
      revision: visible.reduce((n, r) => n + ((r as { revision?: number }).revision ?? 1), 0)
    };
  }

  async listStories(userId: string): Promise<Story[]> {
    const others = await this.connectionIds(userId);
    const authorIds = [userId, ...others];

    const { data: identities } = await this.supabase.admin
      .from('user_identity')
      .select('user_id, display_name')
      .in('user_id', authorIds);
    const nameById = new Map(
      (identities ?? []).map((i) => [i.user_id, i.display_name || 'Friend'])
    );

    const out: Story[] = [];
    for (const id of authorIds) {
      // Skip blocked (connectionIds already filtered; self is fine).
      if (id !== userId && (await isBlocked(this.supabase, userId, id))) {
        continue;
      }
      const tile = await this.storyTileFor(
        userId,
        id,
        nameById.get(id) ?? (id === userId ? 'You' : 'Friend')
      );
      if (tile) out.push(tile);
    }
    return out;
  }

  async getMyStory(userId: string): Promise<Story | null> {
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name')
      .eq('user_id', userId)
      .maybeSingle();
    return this.storyTileFor(
      userId,
      userId,
      identity?.display_name || 'You'
    );
  }

  /** Recent reactions on MY stories for the Home "what people said" strip. */
  async listStoryReplies(userId: string): Promise<Reaction[]> {
    const { data: myStories, error: sErr } = await this.supabase.admin
      .from('stories')
      .select('id')
      .eq('author_id', userId);
    if (sErr) throw sErr;
    const ids = (myStories ?? []).map((s) => s.id);
    if (ids.length === 0) return [];

    const { data: rows, error } = await this.supabase.admin
      .from('reactions')
      .select('*')
      .in('story_id', ids)
      .order('created_at', { ascending: false })
      .limit(20);
    if (error) throw error;

    return (rows ?? []).map((r) => ({
      id: r.id,
      postId: r.story_id,
      authorId: r.author_id,
      kind: r.kind as ReactionKind,
      text: r.text ?? undefined,
      stickerId: r.sticker_id ?? undefined,
      parentReactionId: r.parent_reaction_id ?? undefined,
      at: r.created_at
    }));
  }

  /**
   * Coming up — private date notes (within a week) and due check-in nudges.
   * Birthdays from shared attributes land here when that path is wired.
   * SECURITY: only the author's own friend_notes rows (RLS + author_id filter).
   */
  async listComingUp(userId: string): Promise<UpcomingItem[]> {
    const { data: notes, error } = await this.supabase.admin
      .from('friend_notes')
      .select('id, person_id, kind, text, date, remind, cadence, next_remind_at')
      .eq('author_id', userId)
      .in('kind', ['date', 'check_in']);
    if (error) throw error;

    const out: UpcomingItem[] = [];
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const n of notes ?? []) {
      if (n.kind === 'date' && n.remind && n.date) {
        const target = new Date(`${n.date}T00:00:00`);
        if (Number.isNaN(target.getTime())) continue;
        const diffDays = Math.round(
          (target.getTime() - today.getTime()) / 86400000
        );
        if (diffDays < 0 || diffDays > 7) continue;
        const when =
          diffDays === 0 ? 'Today' : diffDays === 1 ? 'Tomorrow' : `in ${diffDays} days`;
        out.push({
          id: `note-${n.id}`,
          kind: 'note',
          // Label uses opaque person id only in API; client can enrich display.
          label: n.text?.trim() || 'Saved date',
          when,
          daysUntil: diffDays,
          personId: n.person_id
        });
      }
      if (n.kind === 'check_in' && n.next_remind_at) {
        if (new Date(n.next_remind_at).getTime() > now) continue;
        out.push({
          id: `checkin-${n.id}`,
          kind: 'check_in',
          label: 'Check in?',
          when: 'now',
          daysUntil: -0.5,
          personId: n.person_id
        });
      }
    }
    return sortUpcomingItems(out);
  }

  /** In-app notification list for Home preview / Notifications page. */
  async listNotifications(
    userId: string,
    limit?: number
  ): Promise<AppNotification[]> {
    let query = this.supabase.admin
      .from('notifications')
      .select('id, kind, payload, read, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (limit && limit > 0) {
      query = query.limit(limit);
    } else {
      query = query.limit(50);
    }

    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((n) => {
      const payload = (n.payload ?? {}) as Record<string, string>;
      const from = payload.from ?? payload.person_id;
      return {
        id: n.id,
        kind: mapNotificationKind(n.kind),
        personId: from,
        // UI copy only — never logged to analytics.
        text: labelForKind(n.kind, payload),
        time: relativeTime(n.created_at),
        createdAt: n.created_at,
        unread: !n.read,
        target: {
          authorId: from,
          postId: payload.story_id ?? payload.post_id,
          personId: from,
          requestId: payload.request_id,
          signalId: payload.signal_id,
          eventId: payload.event_id,
          pollId: payload.poll_id,
          quizSlug: payload.quiz_slug
        }
      };
    });
  }
}

/** Map DB kind strings onto the shared NotificationKind union. */
function mapNotificationKind(kind: string): AppNotification['kind'] {
  switch (kind) {
    case 'connection_request':
      return 'connect_request';
    case 'connection_accepted':
      return 'mutual_connection';
    case 'touch_grass':
      return 'touch_grass_signal';
    case 'touch_grass_in':
      return 'touch_grass_im_in';
    case 'story_reply':
    case 'story_reply_elsewhere':
    case 'story_prompt':
    case 'connect_request':
    case 'mutual_connection':
    case 'touch_grass_signal':
    case 'touch_grass_im_in':
    case 'birthday':
    case 'custom_date':
    case 'friend_check_in':
    case 'event_invite':
    case 'event_reminder':
    case 'rsvp_going':
    case 'event_assignment':
    case 'poll_activity':
    case 'quiz_share':
    case 'jname_link_opened':
    case 'jname_top_match':
    case 'recap_reaction':
    case 'inside_joke':
    case 'message':
    case 'coop_announcement':
    case 'activity_live':
    case 'delight_gift':
      return kind;
    default:
      return 'story_reply';
  }
}

function labelForKind(kind: string, payload: Record<string, string>): string {
  switch (kind) {
    case 'story_reply':
      return 'Replied to your update';
    case 'story_prompt':
      return payload.event_id
        ? "📸 Don't forget to capture the mems"
        : 'Time to post an update';
    case 'friend_check_in':
      return 'Check in with a friend?';
    case 'connection_request':
    case 'connect_request':
      return 'Wants to connect';
    case 'connection_accepted':
    case 'mutual_connection':
      return payload.via === 'invite'
        ? 'Joined from your invite'
        : 'Accepted your request';
    case 'touch_grass':
    case 'touch_grass_signal':
      return 'Is free to hang';
    case 'touch_grass_in':
    case 'touch_grass_im_in':
      return 'Is in on Touch Grass';
    case 'event_invite':
      return 'Invited you to an event';
    case 'rsvp_going':
      return 'Is going to your event';
    case 'event_assignment':
      return payload.action === 'released'
        ? 'Released an assignment'
        : 'Snagged an assignment';
    case 'event_reminder':
      return 'Event reminder';
    case 'poll_activity':
      return payload.action === 'created'
        ? 'Posted a poll for your circle'
        : 'Answered your poll';
    case 'quiz_share':
      return 'Shared a quiz with you';
    case 'jname_link_opened':
      return 'Opened your quiz link';
    case 'jname_top_match':
      return payload.j_name
        ? `Got ${payload.j_name} — one of your top picks`
        : 'Got one of your top J-name picks';
    case 'recap_reaction':
      return payload.emoji
        ? `reacted ${payload.emoji} to your recap`
        : 'Reacted to your recap';
    default:
      return payload.text || 'New notification';
  }
}

function relativeTime(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

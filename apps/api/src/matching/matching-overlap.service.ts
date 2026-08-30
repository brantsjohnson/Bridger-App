// ============================================
// WHAT THIS FILE DOES (plain English):
// Mode 2: after beat 0 sets the friendship tier, compute what two connected
// people share (reveal + In common). Never invents filler when overlap is thin.
// Quiz answers/explanations never cross — only the quiz's in-app title + %.
// Hobby follow-up answers, favorites items, and music picks/artists all count.
// ============================================
import {
  ForbiddenException,
  Injectable,
  NotFoundException
} from '@nestjs/common';
import { DISCOVER_QUIZ_IDS } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';
import { MatchingConfigService } from './matching-config.service';
import { MatchingIdfService } from './matching-idf.service';
import type {
  InCommonPayloadDto,
  OverlapItemDto,
  RevealPayloadDto
} from './matching.types';

const TIER_RANK: Record<string, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};

type AttrEntry = {
  fp: string;
  key: string;
  label: string;
  layer: string;
  detail?: string;
};

@Injectable()
export class MatchingOverlapService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: MatchingConfigService,
    private readonly idf: MatchingIdfService
  ) {}

  async getOverlap(
    viewerId: string,
    otherId: string,
    variant: 'reveal' | 'in_common'
  ): Promise<RevealPayloadDto | InCommonPayloadDto> {
    const conn = await this.findAccepted(viewerId, otherId);
    if (!conn) throw new NotFoundException('Not connected');

    // CRITICAL: beat 0 must set tier / met_context before any overlap.
    if (!conn.met_context) {
      throw new ForbiddenException('Finish how-you-met before overlap');
    }

    const { data: tiers } = await this.supabase.admin
      .from('tiers')
      .select('user_id, other_id, tier')
      .or(
        `and(user_id.eq.${viewerId},other_id.eq.${otherId}),and(user_id.eq.${otherId},other_id.eq.${viewerId})`
      );
    const viewerGranted =
      tiers?.find((t) => t.user_id === otherId && t.other_id === viewerId)
        ?.tier ?? 'acquaintance';
    const otherGranted =
      tiers?.find((t) => t.user_id === viewerId && t.other_id === otherId)
        ?.tier ?? 'acquaintance';

    // Each side filtered by what THAT person shares at the tier they granted.
    const mineList = [
      ...(await this.attrsVisibleAt(viewerId, otherGranted)),
      ...(await this.musicPicksVisibleAt(viewerId, otherGranted))
    ];
    const theirsList = [
      ...(await this.attrsVisibleAt(otherId, viewerGranted)),
      ...(await this.musicPicksVisibleAt(otherId, viewerGranted))
    ];
    const mine = new Map(mineList.map((e) => [e.fp, e]));
    const theirs = new Map(theirsList.map((e) => [e.fp, e]));

    const overlaps: Array<OverlapItemDto & { w: number }> = [];
    for (const [fp, m] of mine) {
      const t = theirs.get(fp);
      if (!t) continue;
      const idfKey =
        m.key.startsWith('fav:') || m.key === 'fav'
          ? 'fav'
          : m.key.startsWith('music.pick') || m.key === 'music.pick'
            ? 'music.pick'
            : m.key;
      const w = await this.idf.weightForKey(idfKey);
      const isMusic = fp.startsWith('music.');
      const kind = kindFromLayer(m.layer, m.key);
      const title =
        isMusic || kind === 'hobby'
          ? `You both love ${m.label}`
          : kind === 'this_or_that'
            ? `You both picked ${m.label}`
            : `You both ${m.label}`;
      overlaps.push({
        kind,
        title,
        pairedAnswers:
          m.detail && t.detail
            ? { yours: m.detail, theirs: t.detail }
            : undefined,
        // Shared music is conversation gold — nudge weight slightly up.
        w: isMusic ? w * 1.15 : w
      });
    }
    overlaps.sort((a, b) => b.w - a.w);

    const cfg = await this.config.getActive();
    const strongest = overlaps[0] ? stripW(overlaps[0]) : null;
    const extras = overlaps.slice(1, 1 + cfg.revealExtrasMax).map(stripW);

    const quizCompat = await this.quizCompat(
      viewerId,
      otherId,
      cfg.confidenceFloor
    );

    const base: RevealPayloadDto = {
      strongest,
      quizCompat,
      extras
    };

    if (variant === 'reveal') return base;

    const mutuals = await this.mutuals(viewerId, otherId);
    const howYouMet = this.howYouMet(conn);

    return {
      ...base,
      fullList: overlaps.map(stripW),
      mutuals,
      howYouMet,
      sharedPlacePhotos: []
    };
  }

  private async findAccepted(a: string, b: string) {
    const { data } = await this.supabase.admin
      .from('connections')
      .select('*')
      .eq('status', 'accepted')
      .or(`and(user_a.eq.${a},user_b.eq.${b}),and(user_a.eq.${b},user_b.eq.${a})`)
      .maybeSingle();
    return data;
  }

  /**
   * Attributes the owner shares at the granted tier, expanded so one fav group
   * becomes many item fingerprints (and hobby follow-ups keep their answer).
   */
  private async attrsVisibleAt(
    ownerId: string,
    grantedTier: string
  ): Promise<AttrEntry[]> {
    const need = TIER_RANK[grantedTier] ?? 1;
    const { data } = await this.supabase.admin
      .from('attributes')
      .select('key, value, layer, visible_to_tier')
      .eq('owner_id', ownerId)
      .neq('visible_to_tier', 'none');

    const out: AttrEntry[] = [];
    for (const row of data ?? []) {
      const rank = TIER_RANK[row.visible_to_tier] ?? 0;
      if (rank === 0 || rank > need) continue;

      // THIS SECTION DOES: expand fav: group rows into one fingerprint per item.
      if (
        typeof row.key === 'string' &&
        row.key.startsWith('fav:') &&
        row.value &&
        typeof row.value === 'object' &&
        !Array.isArray(row.value)
      ) {
        const items = (row.value as { items?: unknown }).items;
        if (Array.isArray(items)) {
          for (const raw of items) {
            if (typeof raw !== 'string') continue;
            const item = raw.trim();
            if (!item) continue;
            out.push({
              fp: `fav.item::${item.toLowerCase()}`,
              key: 'fav',
              label: item,
              layer: row.layer
            });
          }
          continue;
        }
      }

      const label = labelOf(row.key, row.value);
      const detail = detailOf(row.value);
      // Music artists: match on the artist name so Spotify ↔ Apple Music can overlap.
      const fp = row.key.startsWith('music.artist.')
        ? `music.artist::${label.toLowerCase()}`
        : `${row.key}::${label}`;
      out.push({
        fp,
        key: row.key,
        label,
        layer: row.layer,
        detail
      });
    }
    return out;
  }

  /**
   * Music picks (song of the week, fav track/album/artist) visible at the
   * granted tier, fingerprinted by normalized title + artist.
   */
  private async musicPicksVisibleAt(
    ownerId: string,
    grantedTier: string
  ): Promise<AttrEntry[]> {
    const need = TIER_RANK[grantedTier] ?? 1;
    const { data } = await this.supabase.admin
      .from('music_picks')
      .select('kind, title, artist_name, visible_to_tier')
      .eq('owner_id', ownerId)
      .in('kind', [
        'listening_now',
        'song_of_week',
        'fav_track',
        'fav_album',
        'fav_artist'
      ]);

    const out: AttrEntry[] = [];
    for (const row of data ?? []) {
      const rank = TIER_RANK[row.visible_to_tier] ?? 0;
      if (rank === 0 || rank > need) continue;
      const title = (row.title ?? '').trim();
      if (!title) continue;
      const artist = (row.artist_name ?? '').trim();
      const label = artist ? `${title} by ${artist}` : title;
      const fp = `music.pick::${`${title} ${artist}`.toLowerCase().trim()}`;
      out.push({
        fp,
        key: 'music.pick',
        label,
        layer: 'profile'
      });
    }
    return out;
  }

  /**
   * One confidence-weighted % per shared Discover quiz, labeled by the
   * in-app title (e.g. "Your Funny Bone"). Never returns answers.
   */
  private async quizCompat(
    a: string,
    b: string,
    floor: number
  ): Promise<
    { quizId: string; title: string; dimension: string; percent: number }[]
  > {
    const { data: regs } = await this.supabase.admin
      .from('quiz_registry')
      .select('slug, quiz_id, title')
      .in('slug', [...DISCOVER_QUIZ_IDS]);
    const byId = new Map(
      (regs ?? [])
        .filter((r) => r.quiz_id)
        .map((r) => [
          r.quiz_id as string,
          { slug: r.slug as string, title: (r.title as string) || (r.slug as string) }
        ])
    );
    const quizIds = [...byId.keys()];
    if (!quizIds.length) return [];

    const { data: results } = await this.supabase.admin
      .from('quiz_results')
      .select('user_id, quiz_id, dimension_scores, confidence')
      .in('user_id', [a, b])
      .in('quiz_id', quizIds);

    const out: {
      quizId: string;
      title: string;
      dimension: string;
      percent: number;
    }[] = [];
    for (const [quizId, meta] of byId) {
      const ar = results?.find((r) => r.user_id === a && r.quiz_id === quizId);
      const br = results?.find((r) => r.user_id === b && r.quiz_id === quizId);
      if (!ar || !br) continue;
      const sa = (ar.dimension_scores ?? {}) as Record<string, number>;
      const sb = (br.dimension_scores ?? {}) as Record<string, number>;
      const ca = (ar.confidence ?? {}) as Record<string, number>;
      const cb = (br.confidence ?? {}) as Record<string, number>;
      let sum = 0;
      let n = 0;
      for (const dim of new Set([...Object.keys(sa), ...Object.keys(sb)])) {
        if ((ca[dim] ?? 1) < floor || (cb[dim] ?? 1) < floor) continue;
        const sim =
          1 -
          Math.min(
            1,
            Math.abs(Number(sa[dim] ?? 0) - Number(sb[dim] ?? 0))
          );
        const w = Math.min(Number(ca[dim] ?? 1), Number(cb[dim] ?? 1));
        sum += sim * w;
        n += w;
      }
      if (n <= 0) continue;
      const percent = Math.round((sum / n) * 100);
      out.push({
        quizId: meta.slug,
        title: meta.title,
        dimension: meta.title,
        percent
      });
    }
    return out;
  }

  private async mutuals(a: string, b: string) {
    const aFriends = await this.connectedIds(a);
    const bFriends = await this.connectedIds(b);
    const blocked = await this.blockedSet(a, b);
    const mutualIds = [...aFriends].filter(
      (id) => bFriends.has(id) && !blocked.has(id)
    );
    if (!mutualIds.length) return [];
    const { data: identities } = await this.supabase.admin
      .from('user_identity')
      .select('user_id, display_name')
      .in('user_id', mutualIds.slice(0, 12));
    return (identities ?? []).map((u) => ({
      id: u.user_id,
      firstName: (u.display_name ?? 'Friend').split(' ')[0]!,
      photoRef: ''
    }));
  }

  private async connectedIds(userId: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('connections')
      .select('user_a, user_b')
      .eq('status', 'accepted')
      .or(`user_a.eq.${userId},user_b.eq.${userId}`);
    const out = new Set<string>();
    for (const row of data ?? []) {
      out.add(row.user_a === userId ? row.user_b : row.user_a);
    }
    return out;
  }

  private async blockedSet(a: string, b: string): Promise<Set<string>> {
    const { data } = await this.supabase.admin
      .from('blocks')
      .select('blocker_id, blocked_id')
      .or(
        `blocker_id.eq.${a},blocked_id.eq.${a},blocker_id.eq.${b},blocked_id.eq.${b}`
      );
    const out = new Set<string>();
    for (const row of data ?? []) {
      out.add(row.blocker_id);
      out.add(row.blocked_id);
    }
    return out;
  }

  private howYouMet(conn: {
    met_context: string | null;
    met_place_label: string | null;
    met_note: string | null;
    met_at: string | null;
    created_at: string;
  }) {
    const date = (conn.met_at ?? conn.created_at).slice(0, 10);
    const items: InCommonPayloadDto['howYouMet'] = [];
    if (conn.met_place_label) {
      items.push({
        kind: 'place',
        label: conn.met_place_label,
        date,
        approximate: true
      });
    }
    if (conn.met_note) {
      items.push({ kind: 'note', label: conn.met_note, date });
    }
    if (!items.length && conn.met_context) {
      items.push({
        kind: 'note',
        label:
          conn.met_context === 'just-met'
            ? 'Just met'
            : 'Already knew each other',
        date
      });
    }
    return items;
  }
}

function stripW(item: OverlapItemDto & { w?: number }): OverlapItemDto {
  const { w: _w, ...rest } = item;
  return rest;
}

function labelOf(key: string, value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.label === 'string') return v.label;
    if (typeof v.title === 'string') return v.title;
  }
  if (typeof value === 'string') return value;
  return key.replace(/^.*\./, '').replace(/_/g, ' ');
}

/**
 * Pull a side-by-side detail (hobby follow-up answer, or a freeform note).
 * Hobbies store the answer at value.followUp.answer.
 */
function detailOf(value: unknown): string | undefined {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    if (typeof v.detail === 'string' && v.detail.trim()) return v.detail.trim();
    if (typeof v.note === 'string' && v.note.trim()) return v.note.trim();
    const fu =
      v.followUp && typeof v.followUp === 'object' && !Array.isArray(v.followUp)
        ? (v.followUp as Record<string, unknown>)
        : null;
    if (fu && typeof fu.answer === 'string' && fu.answer.trim()) {
      return fu.answer.trim();
    }
  }
  return undefined;
}

function kindFromLayer(
  layer: string,
  key?: string
): OverlapItemDto['kind'] {
  if (layer === 'hobby' || (key && key.startsWith('hobby:'))) return 'hobby';
  if (layer === 'place' || (key && key.startsWith('place:'))) return 'place';
  if (
    layer === 'this_or_that' ||
    (key && (key.startsWith('tot:') || key.startsWith('this_or_that')))
  ) {
    return 'this_or_that';
  }
  return 'attribute';
}

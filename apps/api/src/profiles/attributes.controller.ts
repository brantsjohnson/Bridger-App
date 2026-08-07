// ============================================
// WHAT THIS FILE DOES (plain English):
// The read/write routes for your "facts" - the rows in the `attributes` table.
// Everything on your profile that isn't your name or photo lives here: hobbies,
// favorites, places, this-or-that answers, About-Me answers, your birthday,
// your "currently" song/book, your bio.
//
// Each fact is "tagged twice" (see DATA.md):
//   visibleToTier - who is allowed to SEE it (close/friend/acquaintance/none)
//   matchable     - whether the matchmaker may USE it
// The app sends these tags with every write; the server just stores them.
//
//   GET    /me/attributes?kind=hobby   - read your facts (optionally one kind)
//   POST   /me/attributes              - save a batch (optionally replacing a
//                                        whole category, e.g. all hobbies)
//   PATCH  /me/attributes/:id          - change one fact's value/visibility
//   DELETE /me/attributes/:id          - remove one fact
//
// SECURITY: the server writes with owner_id = the logged-in user, so you can
// only ever touch your own facts. Reads come back only for you here; seeing
// OTHER people's facts (tier-filtered) is the /people/:id/profile route.
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import { normalizeAttribute } from '@bridger/ai';
import type { Json } from '@bridger/shared';
import { AiJobsService } from '../ai/ai-jobs.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

/** Which tier may see a fact, and whether matching may use it. */
type Tier = 'none' | 'acquaintance' | 'friend' | 'close';
type Layer = 'essential' | 'profile' | 'connection';

/** A fact the app sends up to be saved. */
interface AttributeInput {
  key: string;
  value: Json;
  layer?: Layer;
  visibleToTier?: Tier;
  matchable?: boolean;
}

/** The shape we hand back to the app for each saved fact. */
interface AttributeDto {
  id: string;
  key: string;
  value: Json;
  layer: Layer;
  visibleToTier: Tier;
  matchable: boolean;
  updatedAt: string;
}

/**
 * The "kind" the app asks for maps to a key prefix in the table. Keeping the
 * mapping on the server means the app never has to know our storage naming.
 */
const KIND_PREFIX: Record<string, string> = {
  about: 'about:',
  hobby: 'hobby:',
  fav: 'fav:',
  food: 'food:',
  ent: 'ent:',
  everyday: 'everyday:',
  sports: 'sports:',
  thisOrThat: 'tot:',
  place: 'place:',
  top5: 'top5:',
  obsession: 'obsession:',
  timeline: 'timeline:',
  rec: 'rec:',
  goal: 'goal:',
  currently: 'currently_'
};

/** Kinds that are a single exact key rather than a prefix. */
const KIND_EXACT: Record<string, string> = {
  birthday: 'birthday',
  bio: 'bio'
};

@Controller('me/attributes')
@UseGuards(SupabaseAuthGuard)
export class AttributesController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly aiJobs: AiJobsService
  ) {}

  // --- READ your facts (all, or just one kind) ---
  @Get()
  async list(
    @CurrentUser() user: AuthUser,
    @Query('kind') kind?: string
  ): Promise<AttributeDto[]> {
    let query = this.supabase.admin
      .from('attributes')
      .select('id, key, value, layer, visible_to_tier, matchable, updated_at')
      .eq('owner_id', user.id);

    // Narrow to one kind when asked (exact key or "prefix%").
    if (kind && KIND_EXACT[kind]) {
      query = query.eq('key', KIND_EXACT[kind]);
    } else if (kind && KIND_PREFIX[kind]) {
      query = query.like('key', `${KIND_PREFIX[kind]}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(toDto);
  }

  // --- SAVE a batch of facts ---
  // If `replacePrefix` is given, all existing rows whose key starts with it are
  // cleared first, then the new set is written. That's how "re-run the hobbies
  // module" replaces your hobbies instead of piling up duplicates.
  @Post()
  async save(
    @CurrentUser() user: AuthUser,
    @Body() body: { attributes: AttributeInput[]; replacePrefix?: string }
  ): Promise<AttributeDto[]> {
    const rows = Array.isArray(body?.attributes) ? body.attributes : [];

    if (typeof body?.replacePrefix === 'string' && body.replacePrefix) {
      const { error: delErr } = await this.supabase.admin
        .from('attributes')
        .delete()
        .eq('owner_id', user.id)
        .like('key', `${body.replacePrefix}%`);
      if (delErr) throw delErr;
    }

    if (rows.length === 0) return [];

    const insertRows = rows.map((r) => ({
      owner_id: user.id,
      key: r.key,
      value: r.value ?? {},
      layer: (r.layer ?? 'profile') as Layer,
      visible_to_tier: (r.visibleToTier ?? 'friend') as Tier,
      matchable: r.matchable ?? true
    }));

    const { data, error } = await this.supabase.admin
      .from('attributes')
      .insert(insertRows)
      .select('id, key, value, layer, visible_to_tier, matchable, updated_at');
    if (error) throw error;

    // AI: re-embed + refresh person summary when matchable facts change.
    await this.enqueueMatchableAi(user.id);

    // Optional Discover-module notes when a whole category was replaced.
    if (typeof body?.replacePrefix === 'string' && body.replacePrefix) {
      await this.aiJobs.enqueueModuleNotes({
        userId: user.id,
        moduleKey: body.replacePrefix.replace(/:$/, ''),
        answers: rows.map((r) => ({ key: r.key, value: r.value }))
      });
    }

    return (data ?? []).map(toDto);
  }

  // --- CHANGE one fact (value and/or who sees it) ---
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { value?: Json; visibleToTier?: Tier; matchable?: boolean }
  ): Promise<AttributeDto | null> {
    const patch: Record<string, unknown> = {};
    if (body?.value !== undefined) patch.value = body.value;
    if (body?.visibleToTier !== undefined) patch.visible_to_tier = body.visibleToTier;
    if (body?.matchable !== undefined) patch.matchable = body.matchable;

    const { data, error } = await this.supabase.admin
      .from('attributes')
      // Cast: the patch is built dynamically from optional fields.
      .update(patch as never)
      // owner_id guard: you can only edit your own facts.
      .eq('id', id)
      .eq('owner_id', user.id)
      .select('id, key, value, layer, visible_to_tier, matchable, updated_at')
      .maybeSingle();
    if (error) throw error;
    await this.enqueueMatchableAi(user.id);
    return data ? toDto(data) : null;
  }

  // --- REMOVE one fact ---
  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const { error } = await this.supabase.admin
      .from('attributes')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);
    if (error) throw error;
    await this.enqueueMatchableAi(user.id);
    return { ok: true };
  }

  /**
   * PRIVACY: only matchable Zone B facts are embedded. Writers no-op when the
   * person has turned Discoverable off (checked below).
   */
  private async enqueueMatchableAi(userId: string): Promise<void> {
    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('discoverable')
      .eq('user_id', userId)
      .maybeSingle();
    if (settings && settings.discoverable === false) return;

    const { data: attrs } = await this.supabase.admin
      .from('attributes')
      .select('key, value, matchable')
      .eq('owner_id', userId)
      .eq('matchable', true);

    const matchable = (attrs ?? []).map((a) => ({
      key: a.key,
      value: a.value
    }));
    if (!matchable.length) return;

    await this.aiJobs.enqueueEmbeddings({
      userId,
      attributes: matchable
    });
    await this.aiJobs.enqueuePersonSummary({
      userId,
      facts: matchable.map((a) => normalizeAttribute(a))
    });
  }
}

/** Map a database row (snake_case) to the app-facing shape (camelCase). */
function toDto(row: {
  id: string;
  key: string;
  value: Json;
  layer: string;
  visible_to_tier: string;
  matchable: boolean;
  updated_at: string;
}): AttributeDto {
  return {
    id: row.id,
    key: row.key,
    value: row.value,
    layer: row.layer as Layer,
    visibleToTier: row.visible_to_tier as Tier,
    matchable: row.matchable,
    updatedAt: row.updated_at
  };
}

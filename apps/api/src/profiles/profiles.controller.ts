// ============================================
// WHAT THIS FILE DOES (plain English):
// The routes for your profile "header" and settings, plus reading SOMEONE
// ELSE's profile with privacy applied.
//
//   GET  /me/profile            - your card header: city, bio, "currently"
//                                 song + book, name, avatar.
//   PATCH /me/profile           - save any of those (partial save).
//   GET  /me/settings           - your switches (discoverable, meet scope,
//                                 home city, notification prefs, onboarded?).
//   PATCH /me/settings          - save meet scope / home city / discoverable.
//   PATCH /me/notification-prefs- save which nudges you want (onboarding step).
//   GET  /people/:id/profile    - another person's card, filtered to only what
//                                 your tier is allowed to see (and nothing if
//                                 either of you blocked the other).
//
// STORAGE NOTE: name + avatar live on `user_identity`; city + switches live on
// `user_settings`; bio and the "currently" song/book are stored as `attributes`
// under fixed keys (bio, currently_song, currently_book) so they carry their
// own visibility like every other fact.
// ============================================
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  UseGuards
} from '@nestjs/common';
import type { Json } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { RequireCoopMemberGuard } from '../coop/require-coop-member.guard';
import { SupabaseService } from '../supabase/supabase.service';

type Tier = 'none' | 'acquaintance' | 'friend' | 'close';

/** Tier strength, so "can this viewer see a friend-level fact?" is one compare. */
const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};

/** Presentation is token-only so custom pages cannot inject CSS or unsafe URLs. */
const PROFILE_ACCENTS = new Set([
  'purple',
  'coral',
  'teal',
  'amber',
  'pink',
  'blue',
  'green'
]);
const PROFILE_BACKGROUNDS = new Set(['default', 'eggshell', 'ink', 'grid']);

@Controller()
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  constructor(private readonly supabase: SupabaseService) {}

  // --- READ your own card header ---
  @Get('me/profile')
  async getMyProfile(@CurrentUser() user: AuthUser) {
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name, avatar_media_id')
      .eq('user_id', user.id)
      .maybeSingle();

    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('home_city')
      .eq('user_id', user.id)
      .maybeSingle();

    // bio + currently song/book are attributes under fixed keys.
    const { data: attrs } = await this.supabase.admin
      .from('attributes')
      .select('key, value')
      .eq('owner_id', user.id)
      .in('key', ['bio', 'currently_song', 'currently_book']);

    const byKey = new Map((attrs ?? []).map((a) => [a.key, a.value]));
    const song = (byKey.get('currently_song') as { title?: string; artist?: string } | undefined) ?? {};

    return {
      name: identity?.display_name ?? '',
      avatarMediaId: identity?.avatar_media_id ?? null,
      city: settings?.home_city ?? '',
      bio: ((byKey.get('bio') as { text?: string } | undefined)?.text) ?? '',
      song: { title: song.title ?? '', artist: song.artist ?? '' },
      book: byKey.get('currently_book') ?? null
    };
  }

  // --- SAVE your card header (any subset) ---
  @Patch('me/profile')
  async patchMyProfile(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      city?: string;
      bio?: string;
      song?: { title: string; artist: string };
      book?: { title: string; author: string } | null;
    }
  ) {
    if (typeof body?.city === 'string') {
      const { error } = await this.supabase.admin
        .from('user_settings')
        .upsert({ user_id: user.id, home_city: body.city.trim() }, { onConflict: 'user_id' });
      if (error) throw error;
    }
    if (typeof body?.bio === 'string') {
      await this.setSingleAttribute(user.id, 'bio', { text: body.bio.trim() });
    }
    if (body?.song) {
      await this.setSingleAttribute(user.id, 'currently_song', body.song as unknown as Json);
    }
    if (body?.book !== undefined) {
      await this.setSingleAttribute(user.id, 'currently_book', (body.book ?? {}) as unknown as Json);
    }
    return { ok: true };
  }

  // --- READ your settings / switches ---
  @Get('me/settings')
  async getSettings(@CurrentUser() user: AuthUser) {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select(
        'discoverable, meet_scope, home_city, notif_prefs, onboarding_complete, profile_presentation'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      discoverable: data?.discoverable ?? true,
      meetScope: data?.meet_scope ?? 'nearby',
      homeCity: data?.home_city ?? '',
      notifPrefs: data?.notif_prefs ?? {},
      onboardingComplete: data?.onboarding_complete ?? false,
      profilePresentation: data?.profile_presentation ?? null
    };
  }

  // --- SAVE meet scope / home city / discoverable ---
  @Patch('me/settings')
  async patchSettings(
    @CurrentUser() user: AuthUser,
    @Body()
    body: { meetScope?: 'nearby' | 'anywhere'; homeCity?: string; discoverable?: boolean }
  ) {
    const patch: Record<string, unknown> = { user_id: user.id };
    if (body?.meetScope) patch.meet_scope = body.meetScope;
    if (typeof body?.homeCity === 'string') patch.home_city = body.homeCity.trim();
    if (typeof body?.discoverable === 'boolean') patch.discoverable = body.discoverable;

    const { error } = await this.supabase.admin
      .from('user_settings')
      // Cast: the patch is built dynamically from optional fields.
      .upsert(patch as never, { onConflict: 'user_id' });
    if (error) throw error;
    return { ok: true };
  }

  // --- CO-OP CUSTOMIZE: save approved presentation tokens, or clear to original. ---
  @Patch('me/settings/presentation')
  @UseGuards(RequireCoopMemberGuard)
  async patchPresentation(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      presentation?: { accent?: string; background?: string } | null;
    }
  ) {
    const presentation = body?.presentation;
    let stored: Json | null = null;

    if (presentation !== null) {
      const accent = presentation?.accent ?? 'purple';
      const background = presentation?.background ?? 'default';
      if (!PROFILE_ACCENTS.has(accent) || !PROFILE_BACKGROUNDS.has(background)) {
        throw new BadRequestException('Choose an approved profile style');
      }
      stored = { accent, background };
    }

    const { error } = await this.supabase.admin
      .from('user_settings')
      .upsert(
        { user_id: user.id, profile_presentation: stored },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    return { profilePresentation: stored };
  }

  // --- SAVE which nudges you want (onboarding notifications step) ---
  @Patch('me/notification-prefs')
  async patchNotificationPrefs(
    @CurrentUser() user: AuthUser,
    @Body() body: { prefIds: string[] }
  ) {
    const selected = Array.isArray(body?.prefIds) ? body.prefIds : [];
    const { error } = await this.supabase.admin
      .from('user_settings')
      .upsert(
        { user_id: user.id, notif_prefs: { selected } as unknown as Json },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    return { selected };
  }

  // --- READ another person's card, filtered by what your tier may see ---
  // PRIVACY: this is the tier gate in code. The server bypasses row-level
  // security (admin key), so we re-enforce it here: blocks hide everything, and
  // a fact only comes back if your tier (as THAT person set it) is high enough.
  @Get('people/:id/profile')
  async getPersonProfile(
    @CurrentUser() viewer: AuthUser,
    @Param('id') ownerId: string
  ) {
    const isSelf = viewer.id === ownerId;

    // A block in either direction = you see nothing.
    if (!isSelf) {
      const { data: blocks } = await this.supabase.admin
        .from('blocks')
        .select('blocker_id, blocked_id')
        .or(
          `and(blocker_id.eq.${viewer.id},blocked_id.eq.${ownerId}),` +
            `and(blocker_id.eq.${ownerId},blocked_id.eq.${viewer.id})`
        );
      if (blocks && blocks.length > 0) return null;
    }

    // How the OWNER has tiered the viewer decides what the viewer may see.
    let viewerTier: Tier = isSelf ? 'close' : 'none';
    if (!isSelf) {
      const { data: t } = await this.supabase.admin
        .from('tiers')
        .select('tier')
        .eq('user_id', ownerId)
        .eq('other_id', viewer.id)
        .maybeSingle();
      if (t?.tier) viewerTier = t.tier as Tier;
    }

    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name, avatar_media_id')
      .eq('user_id', ownerId)
      .maybeSingle();

    const { data: attrs } = await this.supabase.admin
      .from('attributes')
      .select('id, key, value, layer, visible_to_tier, matchable, updated_at')
      .eq('owner_id', ownerId);

    const rank = TIER_RANK[viewerTier];
    const visible = (attrs ?? []).filter((a) => {
      if (isSelf) return true;
      const need = a.visible_to_tier as Tier;
      // 'none' is hidden from everyone; otherwise viewer must rank high enough.
      return need !== 'none' && rank >= TIER_RANK[need];
    });

    return {
      id: ownerId,
      name: identity?.display_name ?? '',
      avatarMediaId: identity?.avatar_media_id ?? null,
      viewerTier,
      attributes: visible.map((a) => ({
        id: a.id,
        key: a.key,
        value: a.value,
        layer: a.layer,
        visibleToTier: a.visible_to_tier,
        matchable: a.matchable,
        updatedAt: a.updated_at
      }))
    };
  }

  // --- helper: store exactly one attribute under a fixed key (replace it) ---
  // Used for bio / currently_song / currently_book, which are single-value.
  private async setSingleAttribute(ownerId: string, key: string, value: Json) {
    const { error: delErr } = await this.supabase.admin
      .from('attributes')
      .delete()
      .eq('owner_id', ownerId)
      .eq('key', key);
    if (delErr) throw delErr;

    const { error: insErr } = await this.supabase.admin.from('attributes').insert({
      owner_id: ownerId,
      key,
      value,
      layer: 'profile',
      visible_to_tier: 'friend',
      matchable: true
    });
    if (insErr) throw insErr;
  }
}

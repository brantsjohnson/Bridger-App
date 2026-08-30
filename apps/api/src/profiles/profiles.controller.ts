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
//   PATCH /me/settings          - save meet scope / home city / discoverable /
//                                 always-view-original.
//   PATCH /me/settings/presentation - co-op Theme + Layout skin (or clear).
//   PATCH /me/notification-prefs- save which nudges you want (onboarding step).
//   GET  /me/greatest-hits      - your co-op Greatest hits slots (≤3).
//   PUT  /me/greatest-hits      - replace slots (co-op only).
//   DELETE /me/greatest-hits/:id- remove one slot + its media (co-op only).
//   GET  /people/:id/profile    - another person's card, filtered to only what
//                                 your tier is allowed to see (and nothing if
//                                 either of you blocked the other).
//
// STORAGE NOTE: name + avatar live on `user_identity`; city + switches live on
// `user_settings`; bio and the "currently" song/book are stored as `attributes`
// under fixed keys (bio, currently_song, currently_book) so they carry their
// own visibility like every other fact. Greatest hits live in
// `profile_greatest_hits` (Bridger-hosted media only).
// ============================================
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Put,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Json, Tier } from '@bridger/shared';
import {
  mergeNotificationPrefs,
  normalizeProfilePresentation,
  normalizeStoredNotificationPrefs,
  prefsFromOnboardingGroups,
  type NotificationCircleId,
  type NotificationKind,
  type NotificationPrefsState
} from '@bridger/shared';
import { AssistantGateService } from '../assistant/assistant-gate.service';
import { BillyBillingService } from '../assistant/billy-billing.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { RequireCoopMemberGuard } from '../coop/require-coop-member.guard';
import { SupabaseService } from '../supabase/supabase.service';
import { GreatestHitsService } from './greatest-hits.service';

/** Tier strength, so "can this viewer see a friend-level fact?" is one compare. */
const TIER_RANK: Record<Tier, number> = {
  none: 0,
  acquaintance: 1,
  friend: 2,
  close: 3
};

@Controller()
@UseGuards(SupabaseAuthGuard)
export class ProfilesController {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly assistantGate: AssistantGateService,
    private readonly billyBilling: BillyBillingService,
    private readonly greatestHits: GreatestHitsService,
    private readonly config: ConfigService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // THIS SECTION DOES: turn a media id into a short-lived https URL for photos.
  private async signAvatarUrl(
    mediaId: string | null | undefined
  ): Promise<string | null> {
    if (!mediaId) return null;
    const { data: media } = await this.supabase.admin
      .from('media')
      .select('storage_path')
      .eq('id', mediaId)
      .maybeSingle();
    if (!media?.storage_path) return null;
    const { data, error } = await this.supabase.admin.storage
      .from(this.mediaBucket)
      .createSignedUrl(media.storage_path, this.signedUrlTtl);
    if (error || !data) return null;
    return data.signedUrl;
  }

  // --- READ your Greatest hits (co-op slots; empty if none) ---
  @Get('me/greatest-hits')
  async getMyGreatestHits(@CurrentUser() user: AuthUser) {
    return this.greatestHits.listMine(user.id);
  }

  // --- REPLACE Greatest hits (co-op only; ≤3 Bridger-hosted photos) ---
  @Put('me/greatest-hits')
  @UseGuards(RequireCoopMemberGuard)
  async putMyGreatestHits(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      slots?: Array<{
        mediaId: string;
        placementIndex: number;
        afterModule?: string | null;
        visibleToTier?: Tier;
      }>;
    }
  ) {
    return this.greatestHits.replaceMine(user.id, body?.slots ?? []);
  }

  // --- REMOVE one Greatest hits slot (and its media) ---
  @Delete('me/greatest-hits/:id')
  @UseGuards(RequireCoopMemberGuard)
  async deleteMyGreatestHit(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ) {
    await this.greatestHits.removeMine(user.id, id);
    return { ok: true };
  }

  // --- READ your own card header ---
  @Get('me/profile')
  async getMyProfile(@CurrentUser() user: AuthUser) {
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select(
        'display_name, avatar_media_id, avatar_original_media_id, avatar_filter'
      )
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
    const avatarUrl = await this.signAvatarUrl(identity?.avatar_media_id);
    const avatarOriginalUrl = await this.signAvatarUrl(
      identity?.avatar_original_media_id
    );

    return {
      name: identity?.display_name ?? '',
      avatarMediaId: identity?.avatar_media_id ?? null,
      avatarOriginalMediaId: identity?.avatar_original_media_id ?? null,
      avatarFilter: identity?.avatar_filter ?? null,
      // Short-lived signed URL so the profile header can show the real photo.
      avatarUrl,
      // Unfiltered original so Edit can switch looks without a re-upload.
      avatarOriginalUrl,
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
        'discoverable, meet_scope, home_city, notif_prefs, onboarding_complete, profile_intro_seen, profile_presentation, assistant_enabled, always_view_original, delight_opt_ins, profile_color, social_battery, connection_style'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    const assistant = await this.assistantGate.visibility(user.id);

    // Normalize older accent/background-only saves into the Phase B shape.
    const rawPresentation = data?.profile_presentation ?? null;
    const normalized = normalizeProfilePresentation(rawPresentation);
    const profilePresentation =
      normalized.ok && normalized.value !== null
        ? normalized.value
        : rawPresentation;

    return {
      discoverable: data?.discoverable ?? false,
      meetScope: data?.meet_scope ?? 'nearby',
      homeCity: data?.home_city ?? '',
      notifPrefs: data?.notif_prefs ?? {},
      onboardingComplete: data?.onboarding_complete ?? false,
      // True after they dismissed the one-time Profile welcome ("Hell yeah").
      profileIntroSeen: data?.profile_intro_seen ?? false,
      profilePresentation,
      alwaysViewOriginal: data?.always_view_original ?? false,
      assistantEnabled: assistant.assistantEnabled,
      assistantEligible: assistant.assistantEligible,
      assistantVisible: assistant.assistantVisible,
      delightOptIns: Array.isArray(data?.delight_opt_ins)
        ? data.delight_opt_ins
        : [],
      // Personal SynthGrid tint from onboarding ColorStep (#RRGGBB or null).
      profileColor:
        typeof data?.profile_color === 'string' ? data.profile_color : null,
      // Nights out per week (0..7) from onboarding SocialBatteryStep.
      socialBattery:
        typeof data?.social_battery === 'number' ? data.social_battery : null,
      // FoF matching style keys from FriendsOfFriendsStep.
      connectionStyle: Array.isArray(data?.connection_style)
        ? data.connection_style
        : []
    };
  }

  // --- SAVE meet scope / home city / discoverable / assistant opt-in ---
  @Patch('me/settings')
  async patchSettings(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      meetScope?: 'nearby' | 'anywhere';
      homeCity?: string;
      discoverable?: boolean;
      assistantEnabled?: boolean;
      /** Standing preference: always render others' profiles as original. */
      alwaysViewOriginal?: boolean;
      /** Opt-in standalone delighter slugs. */
      delightOptIns?: string[];
      /** Personal grid-line tint (#RRGGBB) from onboarding ColorStep. */
      profileColor?: string | null;
      /** Nights out per week (0..7) from onboarding SocialBatteryStep. */
      socialBattery?: number | null;
      /** Opaque FoF matching style keys from FriendsOfFriendsStep. */
      connectionStyle?: string[];
      /** True after the one-time Profile welcome intro was dismissed. */
      profileIntroSeen?: boolean;
    }
  ) {
    const patch: Record<string, unknown> = { user_id: user.id };
    if (body?.meetScope) patch.meet_scope = body.meetScope;
    if (typeof body?.homeCity === 'string') patch.home_city = body.homeCity.trim();
    if (typeof body?.discoverable === 'boolean') patch.discoverable = body.discoverable;
    if (typeof body?.alwaysViewOriginal === 'boolean') {
      patch.always_view_original = body.alwaysViewOriginal;
    }
    // THIS SECTION DOES: remember they finished the Profile welcome intro.
    if (typeof body?.profileIntroSeen === 'boolean') {
      patch.profile_intro_seen = body.profileIntroSeen;
    }
    if (typeof body?.assistantEnabled === 'boolean') {
      // Only eligible users may turn Assistant on.
      if (body.assistantEnabled && !(await this.assistantGate.isEligible(user.id))) {
        throw new BadRequestException('Assistant is not available for this account');
      }
      patch.assistant_enabled = body.assistantEnabled;
    }
    if (Array.isArray(body?.delightOptIns)) {
      // Keep only slugs that are live opt-in standalones.
      const { data: allowed, error: aErr } = await this.supabase.admin
        .from('delights')
        .select('slug')
        .eq('status', 'live')
        .eq('kind', 'standalone')
        .eq('scope', 'opt-in')
        .eq('enabled', true);
      if (aErr) throw aErr;
      const allow = new Set(
        (allowed ?? []).map((d) => d.slug).filter((s): s is string => !!s)
      );
      patch.delight_opt_ins = body.delightOptIns
        .filter((s) => typeof s === 'string' && allow.has(s))
        .slice(0, 40);
    }
    // THIS SECTION DOES: save the onboarding grid color (hex or clear to null).
    if ('profileColor' in (body ?? {})) {
      if (body.profileColor === null || body.profileColor === '') {
        patch.profile_color = null;
      } else if (typeof body.profileColor === 'string') {
        const hex = body.profileColor.trim();
        if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) {
          throw new BadRequestException('profileColor must be #RRGGBB');
        }
        patch.profile_color = hex;
      }
    }
    // THIS SECTION DOES: save nights-out social battery (0..7 or clear).
    if ('socialBattery' in (body ?? {})) {
      if (body.socialBattery === null) {
        patch.social_battery = null;
      } else if (typeof body.socialBattery === 'number') {
        const n = Math.round(body.socialBattery);
        if (n < 0 || n > 7) {
          throw new BadRequestException('socialBattery must be 0..7');
        }
        patch.social_battery = n;
      }
    }
    // THIS SECTION DOES: save FoF connection-style keys (opaque strings only).
    if (Array.isArray(body?.connectionStyle)) {
      patch.connection_style = body.connectionStyle
        .filter((s) => typeof s === 'string' && s.trim().length > 0)
        .map((s) => s.trim())
        .slice(0, 20);
    }

    const { error } = await this.supabase.admin
      .from('user_settings')
      // Cast: the patch is built dynamically from optional fields.
      .upsert(patch as never, { onConflict: 'user_id' });
    if (error) throw error;
    // THIS SECTION DOES: start Billy taste allowance when they turn Billy on.
    if (body?.assistantEnabled === true) {
      await this.billyBilling.ensureTasteSubscription(user.id);
    }
    return { ok: true };
  }

  // --- CO-OP CUSTOMIZE: save Theme + Layout presentation, or clear to original. ---
  // SECURITY: token/allowlist only. Code-tier CSS/HTML columns stay null (flag OFF).
  @Patch('me/settings/presentation')
  @UseGuards(RequireCoopMemberGuard)
  async patchPresentation(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      presentation?: unknown | null;
    }
  ) {
    // null = clear to original; object = Theme + Layout; missing body is invalid.
    if (!('presentation' in (body ?? {}))) {
      throw new BadRequestException('presentation is required (object or null)');
    }
    const presentation = body?.presentation;
    let stored: Json | null = null;

    if (presentation !== null) {
      const normalized = normalizeProfilePresentation(presentation);
      if (!normalized.ok) {
        throw new BadRequestException(normalized.error);
      }
      stored = (normalized.value ?? null) as Json | null;
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

  // --- READ which nudges you want (Settings + onboarding) ---
  @Get('me/notification-prefs')
  async getNotificationPrefs(
    @CurrentUser() user: AuthUser
  ): Promise<NotificationPrefsState> {
    const { data } = await this.supabase.admin
      .from('user_settings')
      .select('notif_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    return normalizeStoredNotificationPrefs(data?.notif_prefs);
  }

  // --- SAVE which nudges you want (Settings toggles + onboarding expand) ---
  @Patch('me/notification-prefs')
  async patchNotificationPrefs(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      /** Partial kind toggles from Settings. */
      kinds?: Partial<Record<NotificationKind, boolean>>;
      /** Partial circle toggles from Settings. */
      circles?: Partial<Record<NotificationCircleId, boolean>>;
      /** Legacy / coarse onboarding chips (expanded server-side). */
      prefIds?: string[];
    }
  ): Promise<NotificationPrefsState> {
    const { data: existing } = await this.supabase.admin
      .from('user_settings')
      .select('notif_prefs')
      .eq('user_id', user.id)
      .maybeSingle();
    let next = normalizeStoredNotificationPrefs(existing?.notif_prefs);

    // Onboarding coarse chips replace kinds (circles stay as defaults/merged).
    if (Array.isArray(body?.prefIds)) {
      next = prefsFromOnboardingGroups(body.prefIds);
    }
    if (body?.kinds || body?.circles) {
      next = mergeNotificationPrefs(next, {
        kinds: body.kinds,
        circles: body.circles
      });
    }

    const { error } = await this.supabase.admin
      .from('user_settings')
      .upsert(
        { user_id: user.id, notif_prefs: next as unknown as Json },
        { onConflict: 'user_id' }
      );
    if (error) throw error;
    return next;
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

    // THIS SECTION DOES: attach tier-visible Greatest hits for the friend card.
    const greatestHits = await this.greatestHits.listForViewer(
      ownerId,
      viewer.id,
      viewerTier
    );

    const avatarUrl = await this.signAvatarUrl(identity?.avatar_media_id);

    return {
      id: ownerId,
      name: identity?.display_name ?? '',
      avatarMediaId: identity?.avatar_media_id ?? null,
      avatarUrl,
      viewerTier,
      attributes: visible.map((a) => ({
        id: a.id,
        key: a.key,
        value: a.value,
        layer: a.layer,
        visibleToTier: a.visible_to_tier,
        matchable: a.matchable,
        updatedAt: a.updated_at
      })),
      greatestHits
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

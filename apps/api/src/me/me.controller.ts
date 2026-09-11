// ============================================
// WHAT THIS FILE DOES (plain English):
// The core "who am I" routes. Everything here needs a valid login token.
//
//   GET  /me  - read your account: your id/email, your name + avatar, and
//               whether you have finished onboarding (the app's root gate uses
//               this to decide onboarding-vs-Home).
//   PATCH /me - save your name and/or flip the "onboarding finished" flag. The
//               name step and finishing Co-op (pay / invite 3 / auth code) call
//               this.
//   POST /me/analytics/purge - erase this account's PostHog person (Settings
//               opt-out). Account deletion should call the same helper.
//
// The app talks to this API (never to the database directly); the server uses
// its admin connection to write on your behalf after the guard proves it's you.
// ============================================
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { InviteAccessStatus, Json } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from '../coop/coop.service';
import { DemoWeekService } from '../demo-week/demo-week.service';
import { PosthogService } from '../posthog/posthog.service';
import { SupabaseService } from '../supabase/supabase.service';

/** The four profile-photo looks people can pick. */
type AvatarFilter = 'pop_art' | 'comic' | 'x_ray' | 'sepia';

/** What the app may send to PATCH /me. Every field is optional (partial save). */
interface UpdateMeBody {
  /** Display name (first + last), from the onboarding "name" step. */
  name?: string;
  /**
   * Media id of the uploaded profile photo, from the onboarding confirm-profile
   * step. The file already lives in the private media bucket; here we just point
   * the identity row at it. Usually the filtered (baked) copy.
   */
  avatarMediaId?: string;
  /**
   * Unfiltered source photo id. Kept so Profile Edit can switch looks without
   * a re-upload. Optional when saving a plain photo with no look.
   */
  avatarOriginalMediaId?: string | null;
  /** Which look is baked into avatarMediaId (null clears the look key). */
  avatarFilter?: AvatarFilter | null;
  /** Set true from the final "welcome-in" screen when setup is done. */
  onboardingComplete?: boolean;
}

const AVATAR_FILTERS = new Set<AvatarFilter>([
  'pop_art',
  'comic',
  'x_ray',
  'sepia'
]);

/**
 * What the app sends to PATCH /me/onboarding-progress. `step` is the screen the
 * person is on (a blank/missing step clears the resume point); `draft` is the
 * JSON snapshot of their in-progress answers so far.
 */
interface OnboardingProgressBody {
  step?: string | null;
  draft?: Json | null;
}

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  private readonly mediaBucket: string;
  private readonly signedUrlTtl = 60 * 60;

  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly posthog: PosthogService,
    private readonly demoWeek: DemoWeekService,
    private readonly config: ConfigService
  ) {
    this.mediaBucket =
      this.config.get<string>('SUPABASE_MEDIA_BUCKET') ?? 'media';
  }

  // THIS SECTION DOES: turn your stored avatar media id into a short-lived
  // https URL the header Avatar can load.
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

  // --- Story storage bar (Profile calendar) ---
  @Get('storage')
  getStorage(@CurrentUser() user: AuthUser) {
    return this.coop.getStorage(user.id);
  }

  // --- Demo week invite access (TestFlight closed beta) ---
  @Get('access')
  getAccess(@CurrentUser() user: AuthUser): Promise<InviteAccessStatus> {
    return this.demoWeek.getAccessStatus(user.id);
  }

  @Post('access/demo-invite-sent')
  async markDemoInviteSent(@CurrentUser() user: AuthUser) {
    await this.demoWeek.markDemoInviteSent(user.id);
    return this.demoWeek.getAccessStatus(user.id);
  }

  // --- READ your account (identity + onboarding gate) ---
  @Get()
  async me(@CurrentUser() user: AuthUser) {
    // The account row (created automatically on signup by the DB trigger).
    const { data: account } = await this.supabase.admin
      .from('users')
      .select('id, status, created_at')
      .eq('id', user.id)
      .maybeSingle();

    // Your public face: name + avatar reference + which look was baked.
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select(
        'display_name, avatar_media_id, avatar_original_media_id, avatar_filter, profile_song'
      )
      .eq('user_id', user.id)
      .maybeSingle();

    // The onboarding-finished flag + resume point live on your settings row.
    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('onboarding_complete, onboarding_step, onboarding_draft')
      .eq('user_id', user.id)
      .maybeSingle();

    const avatarUrl = await this.signAvatarUrl(identity?.avatar_media_id);
    const avatarOriginalUrl = await this.signAvatarUrl(
      identity?.avatar_original_media_id
    );

    return {
      authUserId: user.id,
      email: user.email,
      profile: account,
      name: identity?.display_name ?? null,
      avatarMediaId: identity?.avatar_media_id ?? null,
      avatarOriginalMediaId: identity?.avatar_original_media_id ?? null,
      avatarFilter: identity?.avatar_filter ?? null,
      // Short-lived signed URL for the header / profile photo (null if none).
      avatarUrl,
      // Unfiltered original (for Edit → switch look). Null when never baked.
      avatarOriginalUrl,
      // Missing settings row = brand-new account = not onboarded yet.
      onboardingComplete: settings?.onboarding_complete ?? false,
      // Resume point for a run that was interrupted (null before start / after
      // finish). The app reads these to drop the person back where they were.
      onboardingStep: settings?.onboarding_step ?? null,
      onboardingDraft: settings?.onboarding_draft ?? null
    };
  }

  // --- SAVE your name and/or mark onboarding finished ---
  @Patch()
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateMeBody
  ) {
    // THIS SECTION DOES: write name and/or avatar onto identity without wiping
    // the other field (a partial upsert used to risk clearing whichever column
    // was not in that request).
    const identityPatch: {
      user_id: string;
      display_name?: string;
      avatar_media_id?: string;
      avatar_original_media_id?: string | null;
      avatar_filter?: string | null;
    } = { user_id: user.id };
    if (typeof body?.name === 'string') {
      identityPatch.display_name = body.name.trim();
    }
    if (typeof body?.avatarMediaId === 'string') {
      identityPatch.avatar_media_id = body.avatarMediaId;
    }
    if (body?.avatarOriginalMediaId === null) {
      identityPatch.avatar_original_media_id = null;
    } else if (typeof body?.avatarOriginalMediaId === 'string') {
      identityPatch.avatar_original_media_id = body.avatarOriginalMediaId;
    }
    if (body?.avatarFilter === null) {
      identityPatch.avatar_filter = null;
    } else if (
      typeof body?.avatarFilter === 'string' &&
      AVATAR_FILTERS.has(body.avatarFilter)
    ) {
      identityPatch.avatar_filter = body.avatarFilter;
    }
    if (
      identityPatch.display_name !== undefined ||
      identityPatch.avatar_media_id !== undefined ||
      identityPatch.avatar_original_media_id !== undefined ||
      identityPatch.avatar_filter !== undefined
    ) {
      const { data: existing } = await this.supabase.admin
        .from('user_identity')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        // Only the fields that were sent — never wipe name when saving a photo
        // (or the reverse).
        const fields: {
          display_name?: string;
          avatar_media_id?: string;
          avatar_original_media_id?: string | null;
          avatar_filter?: string | null;
        } = {};
        if (identityPatch.display_name !== undefined) {
          fields.display_name = identityPatch.display_name;
        }
        if (identityPatch.avatar_media_id !== undefined) {
          fields.avatar_media_id = identityPatch.avatar_media_id;
        }
        if (identityPatch.avatar_original_media_id !== undefined) {
          fields.avatar_original_media_id = identityPatch.avatar_original_media_id;
        }
        if (identityPatch.avatar_filter !== undefined) {
          fields.avatar_filter = identityPatch.avatar_filter;
        }
        const { error } = await this.supabase.admin
          .from('user_identity')
          .update(fields)
          .eq('user_id', user.id);
        if (error) {
          // Missing avatar filter columns (migration 0051) or other DB issues
          // used to surface as a bare gateway 502 with no hint.
          const msg = `${error.message ?? ''} ${error.details ?? ''}`;
          if (/avatar_filter|avatar_original|column .* does not exist/i.test(msg)) {
            throw new BadRequestException(
              'Photo looks are not ready on this server yet. Try again without a filter, or update later.'
            );
          }
          throw new InternalServerErrorException(
            'Could not save your profile. Please try again.'
          );
        }
      } else {
        const { error } = await this.supabase.admin
          .from('user_identity')
          .insert(identityPatch);
        if (error) {
          const msg = `${error.message ?? ''} ${error.details ?? ''}`;
          if (/avatar_filter|avatar_original|column .* does not exist/i.test(msg)) {
            throw new BadRequestException(
              'Photo looks are not ready on this server yet. Try again without a filter, or update later.'
            );
          }
          throw new InternalServerErrorException(
            'Could not save your profile. Please try again.'
          );
        }
      }
    }

    // Flip the onboarding gate on your settings row (upsert for first-timers).
    if (typeof body?.onboardingComplete === 'boolean') {
      const { error } = await this.supabase.admin
        .from('user_settings')
        .upsert(
          { user_id: user.id, onboarding_complete: body.onboardingComplete },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    }

    return { ok: true };
  }

  // --- SAVE / CLEAR the onboarding resume point ---
  // Called as the person advances (or steps back) through onboarding, and once
  // more with nulls when they finish. Sending a step + draft records where they
  // are so a crash / force-quit / reinstall never restarts the run from screen
  // one. Sending nulls clears the resume point (used at completion).
  @Patch('onboarding-progress')
  async saveOnboardingProgress(
    @CurrentUser() user: AuthUser,
    @Body() body: OnboardingProgressBody
  ) {
    // Normalize: a blank/absent step means "clear", which also drops the draft
    // so no stale answers linger after finishing.
    const step =
      typeof body?.step === 'string' && body.step.trim() ? body.step.trim() : null;
    const draft = step ? (body?.draft ?? null) : null;

    const { error } = await this.supabase.admin
      .from('user_settings')
      .upsert(
        {
          user_id: user.id,
          onboarding_step: step,
          onboarding_draft: draft
        },
        { onConflict: 'user_id' }
      );
    if (error) throw error;

    return { ok: true };
  }

  // THIS SECTION DOES: erase this account's PostHog person (opt-out / future delete).
  @Post('analytics/purge')
  async purgeAnalytics(@CurrentUser() user: AuthUser) {
    const result = await this.posthog.purgePerson(user.id);
    return { ok: true, purged: result.purged };
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The core "who am I" routes. Everything here needs a valid login token.
//
//   GET  /me  - read your account: your id/email, your name + avatar, and
//               whether you have finished onboarding (the app's root gate uses
//               this to decide onboarding-vs-Home).
//   PATCH /me - save your name and/or flip the "onboarding finished" flag. This
//               is what the onboarding "name" step and the final "welcome-in"
//               screen call.
//   POST /me/analytics/purge - erase this account's PostHog person (Settings
//               opt-out). Account deletion should call the same helper.
//
// The app talks to this API (never to the database directly); the server uses
// its admin connection to write on your behalf after the guard proves it's you.
// ============================================
import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import type { InviteAccessStatus } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from '../coop/coop.service';
import { DemoWeekService } from '../demo-week/demo-week.service';
import { PosthogService } from '../posthog/posthog.service';
import { SupabaseService } from '../supabase/supabase.service';

/** What the app may send to PATCH /me. Every field is optional (partial save). */
interface UpdateMeBody {
  /** Display name (first + last), from the onboarding "name" step. */
  name?: string;
  /**
   * Media id of the uploaded profile photo, from the onboarding confirm-profile
   * step. The file already lives in the private media bucket; here we just point
   * the identity row at it.
   */
  avatarMediaId?: string;
  /** Set true from the final "welcome-in" screen when setup is done. */
  onboardingComplete?: boolean;
}

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService,
    private readonly posthog: PosthogService,
    private readonly demoWeek: DemoWeekService
  ) {}

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

    // Your public face: name + avatar reference.
    const { data: identity } = await this.supabase.admin
      .from('user_identity')
      .select('display_name, avatar_media_id, profile_song')
      .eq('user_id', user.id)
      .maybeSingle();

    // The onboarding-finished flag lives on your settings row.
    const { data: settings } = await this.supabase.admin
      .from('user_settings')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle();

    return {
      authUserId: user.id,
      email: user.email,
      profile: account,
      name: identity?.display_name ?? null,
      avatarMediaId: identity?.avatar_media_id ?? null,
      // Missing settings row = brand-new account = not onboarded yet.
      onboardingComplete: settings?.onboarding_complete ?? false
    };
  }

  // --- SAVE your name and/or mark onboarding finished ---
  @Patch()
  async updateMe(
    @CurrentUser() user: AuthUser,
    @Body() body: UpdateMeBody
  ) {
    // Save the name onto your identity row (upsert so first save creates it).
    if (typeof body?.name === 'string') {
      const { error } = await this.supabase.admin
        .from('user_identity')
        .upsert(
          { user_id: user.id, display_name: body.name.trim() },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
    }

    // Point your identity at the uploaded profile photo (upsert for first save).
    // The media row was already created + owned by you during the upload, so we
    // only store the reference here.
    if (typeof body?.avatarMediaId === 'string') {
      const { error } = await this.supabase.admin
        .from('user_identity')
        .upsert(
          { user_id: user.id, avatar_media_id: body.avatarMediaId },
          { onConflict: 'user_id' }
        );
      if (error) throw error;
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

  // THIS SECTION DOES: erase this account's PostHog person (opt-out / future delete).
  @Post('analytics/purge')
  async purgeAnalytics(@CurrentUser() user: AuthUser) {
    const result = await this.posthog.purgePerson(user.id);
    return { ok: true, purged: result.purged };
  }
}

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
//
// The app talks to this API (never to the database directly); the server uses
// its admin connection to write on your behalf after the guard proves it's you.
// ============================================
import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from '../coop/coop.service';
import { SupabaseService } from '../supabase/supabase.service';

/** What the app may send to PATCH /me. Every field is optional (partial save). */
interface UpdateMeBody {
  /** Display name (first + last), from the onboarding "name" step. */
  name?: string;
  /** Set true from the final "welcome-in" screen when setup is done. */
  onboardingComplete?: boolean;
}

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly coop: CoopService
  ) {}

  // --- Story storage bar (Profile calendar) ---
  @Get('storage')
  getStorage(@CurrentUser() user: AuthUser) {
    return this.coop.getStorage(user.id);
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
}

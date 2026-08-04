// ============================================
// WHAT THIS FILE DOES (plain English):
// A protected route: GET /me. You can only reach it with a valid login token.
// It proves the whole auth chain works: the app logs in, sends its token, the
// guard verifies it, and here we look up that user's profile row in the
// database using the server's admin connection.
// ============================================
import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('me')
@UseGuards(SupabaseAuthGuard)
export class MeController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  async me(@CurrentUser() user: AuthUser) {
    // Look up the matching public.users row (created automatically on signup).
    const { data: profile } = await this.supabase.admin
      .from('users')
      .select('id, status, created_at')
      .eq('id', user.id)
      .maybeSingle();

    return {
      authUserId: user.id,
      email: user.email,
      profile
    };
  }
}

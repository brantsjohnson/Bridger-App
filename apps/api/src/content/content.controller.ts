// ============================================
// WHAT THIS FILE DOES (plain English):
// Read-only (and one write) routes for Home content knobs the app needs:
// the admin default widget layout, themed capture prompts, and each user's
// own saved Home layout. All routes require a signed-in user.
// ============================================
import {
  Body,
  Controller,
  Get,
  Put,
  UseGuards
} from '@nestjs/common';
import type { HomeDefaults, HomeWidgetDefault, ThemedPrompt } from '@bridger/shared';
import { DEFAULT_HOME_LAYOUT } from '@bridger/shared';
import { AdminService } from '../admin/admin.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { SupabaseService } from '../supabase/supabase.service';

@Controller('content')
@UseGuards(SupabaseAuthGuard)
export class ContentController {
  constructor(
    private readonly admin: AdminService,
    private readonly supabase: SupabaseService
  ) {}

  // --- Admin defaults the Home screen falls back to ---

  @Get('home-defaults')
  async homeDefaults(): Promise<HomeDefaults> {
    try {
      return await this.admin.getHomeDefaults();
    } catch {
      // If admin_config is unreachable, ship the seeded layout so Home still works.
      return { layout: DEFAULT_HOME_LAYOUT };
    }
  }

  @Get('themed-prompts')
  async themedPrompts(): Promise<ThemedPrompt[]> {
    return this.admin.getThemedPrompts();
  }

  // --- Per-user Home widget layout (null in DB = use admin defaults) ---

  @Get('home-layout')
  async getHomeLayout(@CurrentUser() user: AuthUser) {
    const { data, error } = await this.supabase.admin
      .from('user_settings')
      .select('home_layout')
      .eq('user_id', user.id)
      .maybeSingle();
    if (error) throw error;

    const layout = data?.home_layout as HomeWidgetDefault[] | null;
    return {
      layout: Array.isArray(layout) ? layout : null,
      // Convenience: the effective layout the app should render.
      effective: Array.isArray(layout) ? layout : DEFAULT_HOME_LAYOUT
    };
  }

  @Put('home-layout')
  async putHomeLayout(
    @CurrentUser() user: AuthUser,
    @Body() body: { layout: HomeWidgetDefault[] }
  ) {
    const layout = Array.isArray(body?.layout) ? body.layout : [];

    // Upsert so first-time users without a settings row still save cleanly.
    const { error } = await this.supabase.admin.from('user_settings').upsert(
      {
        user_id: user.id,
        home_layout: layout as never
      },
      { onConflict: 'user_id' }
    );
    if (error) throw error;

    return { layout };
  }
}

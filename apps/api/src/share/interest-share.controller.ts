// ============================================
// WHAT THIS FILE DOES (plain English):
// The web addresses for the opt-in "share my interests to my own website"
// feature. There are two audiences:
//
//   OWNER (must be logged in):
//     GET   /me/share/interests  - read my switch, my link/token, my checkboxes,
//                                  plus a preview of exactly what a site would get.
//     PATCH /me/share/interests  - turn it on/off and choose which fields.
//
//   PUBLIC (no Bridger login; this is the whole point):
//     GET   /public/share/interests/:slug         - fetch by friendly link.
//     GET   /public/share/interests               - fetch by secret token, sent
//                                                   as "Authorization: Bearer <token>"
//                                                   or as ?token=<token>.
//
// SECURITY: the owner routes use the normal login guard. The public routes have
// NO Bridger-login guard on purpose (a website cannot log in as the user); they
// are gated instead by the opt-in switch + the unguessable slug/token. When the
// person has not opted in, the public routes return a clean 404.
// ============================================
import {
  BadRequestException,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Query,
  Body,
  UseGuards
} from '@nestjs/common';
import type {
  InterestShareDto,
  InterestShareSettings,
  InterestShareUpdateInput
} from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { InterestShareService } from './interest-share.service';

/** What the owner GET returns: their settings plus a live preview of the export. */
type OwnerShareResponse = InterestShareSettings & { preview: InterestShareDto };

// ============================================================
// OWNER routes (logged in): /me/share/interests
// ============================================================
@Controller('me/share/interests')
@UseGuards(SupabaseAuthGuard)
export class MeInterestShareController {
  constructor(private readonly share: InterestShareService) {}

  // --- READ my share settings + a preview of what a site would receive ---
  @Get()
  async get(@CurrentUser() user: AuthUser): Promise<OwnerShareResponse> {
    const settings = await this.share.getSettings(user.id);
    const preview = await this.share.previewFor(user.id);
    return { ...settings, preview };
  }

  // --- SAVE my share settings (opt in/out + which fields + rotate token) ---
  @Patch()
  async patch(
    @CurrentUser() user: AuthUser,
    @Body() body: InterestShareUpdateInput
  ): Promise<OwnerShareResponse> {
    const settings = await this.share.updateSettings(user.id, body ?? {});
    const preview = await this.share.previewFor(user.id);
    return { ...settings, preview };
  }
}

// ============================================================
// PUBLIC routes (no login): /public/share/interests
// ============================================================
@Controller('public/share/interests')
export class PublicInterestShareController {
  constructor(private readonly share: InterestShareService) {}

  // --- Fetch by secret token (Authorization: Bearer <token> or ?token=). ---
  // Registered before the ":slug" route so the token path is matched first.
  @Get()
  async byToken(
    @Headers('authorization') authHeader?: string,
    @Query('token') tokenQuery?: string
  ): Promise<InterestShareDto> {
    const fromHeader =
      authHeader && authHeader.startsWith('Bearer ')
        ? authHeader.slice('Bearer '.length).trim()
        : '';
    const token = (fromHeader || tokenQuery || '').trim();
    if (!token) {
      throw new BadRequestException(
        'Provide a share token via Authorization: Bearer <token> or ?token=.'
      );
    }
    return this.share.getPublicByToken(token);
  }

  // --- Fetch by friendly slug (the personal-site link). ---
  @Get(':slug')
  async bySlug(@Param('slug') slug: string): Promise<InterestShareDto> {
    return this.share.getPublicBySlug(slug);
  }
}

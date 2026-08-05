// ============================================
// WHAT THIS FILE DOES (plain English):
// The one route Friends uses to move someone between circles:
//   PATCH /tiers/:personId  { tier }
// Returns where they actually landed (may be Acquaintances if a free cap hit)
// and whether the app should show a co-op upsell.
// ============================================
import { Body, Controller, Param, Patch, UseGuards } from '@nestjs/common';
import type { Tier } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { TiersService } from './tiers.service';

@Controller('tiers')
@UseGuards(SupabaseAuthGuard)
export class TiersController {
  constructor(private readonly tiers: TiersService) {}

  @Patch(':personId')
  setTier(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string,
    @Body() body: { tier: Tier }
  ) {
    return this.tiers.setTier(user.id, personId, body.tier);
  }
}

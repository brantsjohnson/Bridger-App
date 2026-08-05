// ============================================
// WHAT THIS FILE DOES (plain English):
// Routes for easter-egg delights: which ones are on, pending gifts for you,
// sending a gift, and marking one as played after it animates.
// ============================================
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { DelightService } from './delight.service';

@Controller('delights')
@UseGuards(SupabaseAuthGuard)
export class DelightController {
  constructor(private readonly delights: DelightService) {}

  @Get('active')
  listActive() {
    return this.delights.listActive();
  }

  @Get('triggers')
  listTriggers(@CurrentUser() user: AuthUser) {
    return this.delights.listTriggers(user.id);
  }

  @Post('triggers')
  createTrigger(
    @CurrentUser() user: AuthUser,
    @Body() body: { delightId: string; toUserId: string }
  ) {
    return this.delights.createTrigger(user.id, body);
  }

  @Post('triggers/:id/played')
  markPlayed(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ) {
    return this.delights.markPlayed(user.id, id);
  }
}

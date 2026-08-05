// ============================================
// WHAT THIS FILE DOES (plain English):
// Routes for co-op announcements and membership. Membership never gates what
// you can see; it only changes what you can create (see COOP.md).
// ============================================
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from './coop.service';

@Controller('coop')
@UseGuards(SupabaseAuthGuard)
export class CoopController {
  constructor(private readonly coop: CoopService) {}

  @Get('announcements')
  listAnnouncements() {
    return this.coop.listAnnouncements();
  }

  @Get('membership')
  getMembership(@CurrentUser() user: AuthUser) {
    return this.coop.getMembership(user.id);
  }

  @Post('membership')
  setMembership(
    @CurrentUser() user: AuthUser,
    @Body() body: { join: boolean }
  ) {
    return this.coop.setMembership(user.id, body);
  }
}

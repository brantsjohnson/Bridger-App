// ============================================
// WHAT THIS FILE DOES (plain English):
// Routes for co-op announcements and membership. Membership never gates what
// you can see; it only changes what you can create (see COOP.md).
//
// PAYMENT: join with apple/google/card goes through PurchaseGateway (soft-join
// stub today). Leave flips membership + plan_state back to free.
// ============================================
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { CoopService } from './coop.service';
import { PurchaseGateway, type DuesMethod } from './purchase.gateway';

@Controller('coop')
@UseGuards(SupabaseAuthGuard)
export class CoopController {
  constructor(
    private readonly coop: CoopService,
    private readonly purchases: PurchaseGateway
  ) {}

  @Get('announcements')
  listAnnouncements() {
    return this.coop.listAnnouncements();
  }

  @Get('membership')
  getMembership(@CurrentUser() user: AuthUser) {
    return this.coop.getMembership(user.id);
  }

  @Post('membership')
  async setMembership(
    @CurrentUser() user: AuthUser,
    @Body() body: { join: boolean; method?: DuesMethod; cancel?: boolean }
  ) {
    // Quiet period-end cancel (keeps perks until renews date).
    if (body?.cancel === true) {
      return this.coop.cancelMembership(user.id);
    }
    if (body?.join === false) {
      return this.coop.setMembership(user.id, { join: false });
    }
    if (body?.join !== true) {
      return this.coop.setMembership(user.id, body);
    }
    const method = body.method ?? 'soft';
    if (method === 'soft') {
      return this.coop.setMembership(user.id, { join: true });
    }
    // Apple / Google / Card: only door for future IAP.
    const result = await this.purchases.startAnnualDues(user.id, method);
    return result.membership;
  }

  @Post('membership/cancel')
  cancelMembership(@CurrentUser() user: AuthUser) {
    return this.coop.cancelMembership(user.id);
  }

  @Get('storage')
  getStorage(@CurrentUser() user: AuthUser) {
    return this.coop.getStorage(user.id);
  }
}

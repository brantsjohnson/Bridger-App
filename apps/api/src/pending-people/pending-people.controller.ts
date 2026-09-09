// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for private pending-person cards:
//   POST /me/pending-people        create / update a card for a phone
//   POST /me/pending-people/merge  attach matching cards after phone sign-up
// ============================================
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { PendingPeopleService } from './pending-people.service';

@Controller('me/pending-people')
@UseGuards(SupabaseAuthGuard)
export class PendingPeopleController {
  constructor(private readonly pending: PendingPeopleService) {}

  @Post()
  upsert(
    @CurrentUser() user: AuthUser,
    @Body() body: { phoneE164: string; displayName?: string | null }
  ) {
    return this.pending.upsert(user.id, body);
  }

  @Post('merge')
  merge(@CurrentUser() user: AuthUser) {
    return this.pending.mergeForUser(user.id);
  }
}

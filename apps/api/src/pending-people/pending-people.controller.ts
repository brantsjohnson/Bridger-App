// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for private pending-person cards:
//   GET  /me/pending-people        list cards you still own
//   GET  /me/pending-people/:id    one card (even after it merged)
//   POST /me/pending-people        create / update a card for a phone
//   POST /me/pending-people/merge  attach matching cards after phone sign-up
// ============================================
import {
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { PendingPeopleService } from './pending-people.service';

@Controller('me/pending-people')
@UseGuards(SupabaseAuthGuard)
export class PendingPeopleController {
  constructor(private readonly pending: PendingPeopleService) {}

  // THIS SECTION DOES: list the private cards you still own.
  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.pending.list(user.id);
  }

  // THIS SECTION DOES: open one card you made (or send you to the real profile).
  @Get(':id')
  async getById(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    const row = await this.pending.getById(user.id, id);
    if (!row) throw new NotFoundException('Pending person not found');
    return row;
  }

  @Post('merge')
  merge(@CurrentUser() user: AuthUser) {
    return this.pending.mergeForUser(user.id);
  }

  @Post()
  upsert(
    @CurrentUser() user: AuthUser,
    @Body() body: { phoneE164: string; displayName?: string | null }
  ) {
    return this.pending.upsert(user.id, body);
  }
}

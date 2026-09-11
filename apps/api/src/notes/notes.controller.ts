// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for your private friend notes.
//   GET    /me/notes?personId=
//   POST   /me/notes
//   PATCH  /me/notes/:id
//   DELETE /me/notes/:id
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards
} from '@nestjs/common';
import type { FriendNoteCadence } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { NotesService } from './notes.service';

@Controller('me/notes')
@UseGuards(SupabaseAuthGuard)
export class NotesController {
  constructor(private readonly notes: NotesService) {}

  @Get()
  list(
    @CurrentUser() user: AuthUser,
    @Query('personId') personId?: string,
    @Query('pendingPersonId') pendingPersonId?: string
  ) {
    return this.notes.list(user.id, personId, pendingPersonId);
  }

  @Post()
  create(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      personId?: string;
      pendingPersonId?: string;
      kind: 'text' | 'date' | 'check_in';
      text?: string;
      date?: string;
      remind?: boolean;
      cadence?: FriendNoteCadence;
    }
  ) {
    return this.notes.create(user.id, body);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      text?: string;
      date?: string;
      remind?: boolean;
      cadence?: FriendNoteCadence;
      nextRemindAt?: string | null;
    }
  ) {
    return this.notes.update(user.id, id, body);
  }

  @Delete(':id')
  async remove(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    await this.notes.remove(user.id, id);
    return { ok: true };
  }
}

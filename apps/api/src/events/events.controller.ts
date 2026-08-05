// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for Events: list, create, detail, edit, RSVP, assignments.
// Meet-suggestions returns an empty list until matching ships.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import {
  EventsService,
  type CreateEventBody,
  type PatchEventBody
} from './events.service';

@Controller('events')
@UseGuards(SupabaseAuthGuard)
export class EventsController {
  constructor(private readonly events: EventsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.events.list(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() body: CreateEventBody) {
    return this.events.create(user.id, body ?? ({} as CreateEventBody));
  }

  @Get(':id/meet-suggestions')
  meetSuggestions(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string
  ) {
    return this.events.meetSuggestions(user.id, id);
  }

  @Get(':id')
  get(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.events.get(user.id, id);
  }

  @Patch(':id')
  patch(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: PatchEventBody
  ) {
    return this.events.patch(user.id, id, body ?? {});
  }

  @Post(':id/rsvp')
  rsvp(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body()
    body: {
      status: 'going' | 'cant';
      allergiesOptIn?: boolean;
      allergiesText?: string;
    }
  ) {
    return this.events.rsvp(user.id, id, body ?? { status: 'going' });
  }

  @Patch(':id/assignments/:itemId')
  patchAssignment(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Param('itemId') itemId: string,
    @Body() body: { assigneeId?: string | null; done?: boolean }
  ) {
    return this.events.patchAssignment(user.id, id, itemId, body ?? {});
  }
}

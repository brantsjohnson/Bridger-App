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
import { StoriesService } from '../stories/stories.service';

@Controller('events')
@UseGuards(SupabaseAuthGuard)
export class EventsController {
  constructor(
    private readonly events: EventsService,
    private readonly stories: StoriesService
  ) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.events.list(user.id);
  }

  // THIS SECTION DOES: profile Upcoming rows (viewer-invited ∩ subject host/going).
  // Static path before :id so Nest does not treat "upcoming-with" as an event id.
  // Pass personId=me to mean the signed-in viewer (own profile).
  @Get('upcoming-with/:personId')
  upcomingWith(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string
  ) {
    const subjectId = !personId || personId === 'me' ? user.id : personId;
    return this.events.listUpcomingWithPerson(user.id, subjectId);
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

  /** Photo updates guests tagged to this event (party capture album). */
  @Get(':id/photos')
  photos(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.stories.listEventPhotos(user.id, id);
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

  // THIS SECTION DOES: host or going attendee invites more people (attribution stored).
  @Post(':id/invite')
  invite(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { userIds?: string[] }
  ) {
    return this.events.inviteGuests(user.id, id, body?.userIds ?? []);
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

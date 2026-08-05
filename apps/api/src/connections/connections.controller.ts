// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for connecting people: list friends, pending requests,
// invite links / QR, redeeming those, how-you-met, remove, and block.
// Every route needs a valid login token.
// ============================================
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import type { MeetContext, Tier } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { ConnectionsService } from './connections.service';

@Controller()
@UseGuards(SupabaseAuthGuard)
export class ConnectionsController {
  constructor(private readonly connections: ConnectionsService) {}

  // --- Roster ---

  @Get('connections')
  list(@CurrentUser() user: AuthUser) {
    return this.connections.list(user.id);
  }

  // --- Requests (Discover "Wants to connect") ---

  @Get('connections/requests')
  listRequests(@CurrentUser() user: AuthUser) {
    return this.connections.listRequests(user.id);
  }

  @Post('connections')
  createPending(
    @CurrentUser() user: AuthUser,
    @Body() body: { targetId: string; madeVia?: string; viaFriendId?: string }
  ) {
    return this.connections.createPending(user.id, body);
  }

  @Post('connections/requests/:id/accept')
  accept(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.connections.acceptRequest(user.id, id);
  }

  @Post('connections/requests/:id/decline')
  decline(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.connections.declineRequest(user.id, id);
  }

  // --- Invite link / QR / redeem (instant friends) ---

  @Post('connections/invite-link')
  inviteLink(@CurrentUser() user: AuthUser) {
    return this.connections.createInviteLink(user.id);
  }

  @Post('connections/qr-token')
  qrToken(@CurrentUser() user: AuthUser) {
    return this.connections.createQrToken(user.id);
  }

  @Post('connections/redeem')
  redeem(
    @CurrentUser() user: AuthUser,
    @Body() body: { token: string; kind: 'link' | 'qr' }
  ) {
    return this.connections.redeem(user.id, body);
  }

  // --- How you met ---

  @Post('connections/:personId/how-you-met')
  saveHowYouMet(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string,
    @Body()
    body: {
      context: MeetContext;
      recordPlace: boolean;
      meetNote?: string;
      tier?: Tier | null;
      placeLabel?: string;
      viaFriendId?: string;
    }
  ) {
    return this.connections.saveHowYouMet(user.id, personId, body);
  }

  @Get('connections/:personId/how-you-met')
  getHowYouMet(
    @CurrentUser() user: AuthUser,
    @Param('personId') personId: string
  ) {
    return this.connections.getHowYouMet(user.id, personId);
  }

  // --- Quiet remove ---

  @Delete('connections/:personId')
  remove(@CurrentUser() user: AuthUser, @Param('personId') personId: string) {
    return this.connections.remove(user.id, personId);
  }

  // --- Block (Settings → Blocked) ---

  @Get('me/blocked')
  listBlocked(@CurrentUser() user: AuthUser) {
    return this.connections.listBlocked(user.id);
  }

  @Post('me/blocked/:id')
  block(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.connections.block(user.id, id);
  }

  @Delete('me/blocked/:id')
  unblock(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.connections.unblock(user.id, id);
  }
}

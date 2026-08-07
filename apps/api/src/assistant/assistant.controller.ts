// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for the opt-in Assistant. Hidden unless eligible + enabled.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { AssistantService } from './assistant.service';

@Controller('assistant')
@UseGuards(SupabaseAuthGuard)
export class AssistantController {
  constructor(private readonly assistant: AssistantService) {}

  @Post('sessions')
  openSession(@CurrentUser() user: AuthUser) {
    return this.assistant.openSession(user.id);
  }

  @Post('sessions/:id/close')
  closeSession(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assistant.closeSession(user.id, id);
  }

  @Post('sessions/:id/turn')
  turn(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { text?: string }
  ) {
    return this.assistant.turn(user.id, id, body?.text ?? '');
  }

  @Post('sessions/:id/voice')
  voice(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { audioBase64?: string; filename?: string }
  ) {
    return this.assistant.voiceTurn(
      user.id,
      id,
      body?.audioBase64 ?? '',
      body?.filename ?? 'voice.m4a'
    );
  }

  @Post('actions/confirm')
  confirm(
    @CurrentUser() user: AuthUser,
    @Body() body: { proposalId?: string }
  ) {
    return this.assistant.confirmAction(user.id, body?.proposalId ?? '');
  }

  @Post('actions/cancel')
  cancel(
    @CurrentUser() user: AuthUser,
    @Body() body: { proposalId?: string }
  ) {
    return this.assistant.cancelAction(user.id, body?.proposalId ?? '');
  }

  @Get('activity')
  activity(@CurrentUser() user: AuthUser) {
    return this.assistant.listActivity(user.id);
  }

  @Post('activity/:id/undo')
  undo(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.assistant.undoActivity(user.id, id);
  }
}

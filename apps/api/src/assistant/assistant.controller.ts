// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for the opt-in Assistant (Billy). Hidden unless eligible + enabled.
// Also exposes Billy allowance status and soft Billy+ stub controls.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { AssistantService } from './assistant.service';
import { BillyBillingService } from './billy-billing.service';

@Controller('assistant')
@UseGuards(SupabaseAuthGuard)
export class AssistantController {
  constructor(
    private readonly assistant: AssistantService,
    private readonly billing: BillyBillingService,
    private readonly config: ConfigService
  ) {}

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
    @Body() body: { proposalId?: string; argsPatch?: Record<string, unknown> }
  ) {
    return this.assistant.confirmAction(
      user.id,
      body?.proposalId ?? '',
      body?.argsPatch
    );
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

  // THIS SECTION DOES: show how much Billy time is left this period.
  @Get('billy/status')
  billyStatus(@CurrentUser() user: AuthUser) {
    return this.billing.getStatus(user.id);
  }

  // Soft stub for local/dev until real IAP lands.
  @Post('billy/plus/stub')
  async billyPlusStub(@CurrentUser() user: AuthUser) {
    const allow =
      this.config.get<string>('BILLY_PLUS_STUB') === '1' ||
      process.env.NODE_ENV !== 'production';
    if (!allow) {
      return { ok: false, message: 'Billy+ checkout is not available yet.' };
    }
    return this.billing.activatePlus(user.id, 'stub');
  }

  @Post('billy/plus/cancel')
  billyPlusCancel(@CurrentUser() user: AuthUser) {
    return this.billing.cancelPlusAtPeriodEnd(user.id);
  }
}

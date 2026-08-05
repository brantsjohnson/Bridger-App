// ============================================
// WHAT THIS FILE DOES (plain English):
// The Weekly Recap routes the app calls: this week's summary, the playlist to
// play, posting your 5 recorded answers, reacting to a clip, and submitting /
// upvoting questions.
// ============================================
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards
} from '@nestjs/common';
import type { RecapAudience } from '@bridger/shared';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { RecapService } from './recap.service';

@Controller('recap')
@UseGuards(SupabaseAuthGuard)
export class RecapController {
  constructor(private readonly recap: RecapService) {}

  @Get('week')
  getWeek(@CurrentUser() user: AuthUser) {
    return this.recap.getWeek(user.id);
  }

  @Get('playlist')
  getPlaylist(@CurrentUser() user: AuthUser) {
    return this.recap.getPlaylist(user.id);
  }

  @Post('answers')
  postAnswers(
    @CurrentUser() user: AuthUser,
    @Body()
    body: {
      audience: RecapAudience;
      answers: Array<{ questionIndex: number; mediaId: string; duration?: number }>;
    }
  ) {
    return this.recap.postAnswers(user.id, body);
  }

  @Get('questions')
  listQuestions() {
    return this.recap.listSubmittedQuestions();
  }

  @Post('questions')
  submitQuestion(
    @CurrentUser() user: AuthUser,
    @Body() body: { text: string }
  ) {
    return this.recap.submitQuestion(user.id, body?.text ?? '');
  }

  @Post('questions/:id/vote')
  voteQuestion(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.recap.voteQuestion(user.id, id);
  }

  @Post('answers/:id/reactions')
  reactToAnswer(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() body: { emoji: string }
  ) {
    return this.recap.reactToAnswer(user.id, id, body?.emoji ?? '');
  }
}

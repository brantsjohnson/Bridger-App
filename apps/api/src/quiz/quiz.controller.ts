// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for taking quizzes: current live quiz, archived ones you have
// not finished, saving each answer, and completing (which scores you).
// ============================================
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { QuizService } from './quiz.service';

@Controller('quizzes')
@UseGuards(SupabaseAuthGuard)
export class QuizController {
  constructor(private readonly quizzes: QuizService) {}

  @Get('current')
  getCurrent(@CurrentUser() user: AuthUser) {
    return this.quizzes.getCurrent(user.id);
  }

  @Get('archived')
  listArchived(@CurrentUser() user: AuthUser) {
    return this.quizzes.listArchived(user.id);
  }

  @Post(':slug/responses')
  saveResponse(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body()
    body: {
      questionId: string;
      selectedOptionIds: string[];
      explainText?: string;
    }
  ) {
    return this.quizzes.saveResponse(user.id, slug, body);
  }

  @Post(':slug/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string
  ) {
    return this.quizzes.complete(user.id, slug);
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// HTTP routes for Discover Connect Over quizzes. The phone can ask which ones
// you finished (so the cards say Done), and posts scored 0–1 dimensions when
// you finish one so matching can use them.
// ============================================
import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard, type AuthUser } from '../auth/auth.guard';
import { DiscoverQuizService } from './discover-quiz.service';

@Controller('discover/quizzes')
@UseGuards(SupabaseAuthGuard)
export class DiscoverQuizController {
  constructor(private readonly discoverQuizzes: DiscoverQuizService) {}

  // THIS SECTION DOES: return which Connect Over quizzes this person finished.
  @Get('completed')
  listCompleted(@CurrentUser() user: AuthUser) {
    return this.discoverQuizzes.listCompleted(user.id);
  }

  @Post(':slug/complete')
  complete(
    @CurrentUser() user: AuthUser,
    @Param('slug') slug: string,
    @Body()
    body: {
      dimensionScores?: Record<string, number>;
      confidence?: Record<string, number>;
      version?: number;
    }
  ) {
    return this.discoverQuizzes.complete(user.id, slug, body ?? {});
  }
}

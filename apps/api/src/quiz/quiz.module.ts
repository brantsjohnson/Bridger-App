// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the quiz routes + scoring service so the app can take and finish
// quizzes through the public API.
// ============================================
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { DiscoverQuizController } from './discover-quiz.controller';
import { DiscoverQuizService } from './discover-quiz.service';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [AiModule],
  controllers: [QuizController, DiscoverQuizController],
  providers: [QuizService, DiscoverQuizService, SupabaseAuthGuard],
  exports: [QuizService, DiscoverQuizService]
})
export class QuizModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the quiz routes + scoring service so the app can take and finish
// quizzes through the public API.
// ============================================
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { QuizController } from './quiz.controller';
import { QuizService } from './quiz.service';

@Module({
  imports: [AiModule],
  controllers: [QuizController],
  providers: [QuizService, SupabaseAuthGuard],
  exports: [QuizService]
})
export class QuizModule {}

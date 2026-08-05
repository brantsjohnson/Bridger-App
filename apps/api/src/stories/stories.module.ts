// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Stories (Updates) routes so Home and the story player can talk
// to a real API. Added to app.module.ts.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';

@Module({
  imports: [CoopModule],
  controllers: [StoriesController],
  providers: [StoriesService, SupabaseAuthGuard],
  exports: [StoriesService]
})
export class StoriesModule {}

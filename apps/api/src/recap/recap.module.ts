// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Weekly Recap Podcast routes for the Friends tab.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { AiModule } from '../ai/ai.module';
import { CoopModule } from '../coop/coop.module';
import { RecapController } from './recap.controller';
import { RecapService } from './recap.service';

@Module({
  imports: [CoopModule, AiModule],
  controllers: [RecapController],
  providers: [RecapService, SupabaseAuthGuard],
  exports: [RecapService]
})
export class RecapModule {}

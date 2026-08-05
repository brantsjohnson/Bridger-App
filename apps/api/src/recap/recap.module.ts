// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Weekly Recap Podcast routes for the Friends tab.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { RecapController } from './recap.controller';
import { RecapService } from './recap.service';

@Module({
  imports: [CoopModule],
  controllers: [RecapController],
  providers: [RecapService, SupabaseAuthGuard]
})
export class RecapModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the tiers routes (and the service Connections also reuses when
// saving how-you-met). Added to app.module.ts so PATCH /tiers/:personId is live.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { TiersController } from './tiers.controller';
import { TiersService } from './tiers.service';

@Module({
  imports: [CoopModule],
  controllers: [TiersController],
  providers: [TiersService, SupabaseAuthGuard],
  // Connections needs setTier when saving how-you-met.
  exports: [TiersService]
})
export class TiersModule {}

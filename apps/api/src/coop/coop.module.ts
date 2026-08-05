// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the co-op announcement + membership routes for the public API.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopController } from './coop.controller';
import { CoopService } from './coop.service';

@Module({
  controllers: [CoopController],
  providers: [CoopService, SupabaseAuthGuard]
})
export class CoopModule {}

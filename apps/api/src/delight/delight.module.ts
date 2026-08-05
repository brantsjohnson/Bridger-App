// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the delight (easter-egg) routes for the public API.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { DelightController } from './delight.controller';
import { DelightService } from './delight.service';

@Module({
  controllers: [DelightController],
  providers: [DelightService, SupabaseAuthGuard]
})
export class DelightModule {}

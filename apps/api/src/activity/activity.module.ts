// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the weekly activity routes so Home can show the challenge collage.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  controllers: [ActivityController],
  providers: [ActivityService, SupabaseAuthGuard]
})
export class ActivityModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Home feed routes (stories row, replies strip, notifications).
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';

@Module({
  controllers: [FeedController],
  providers: [FeedService, SupabaseAuthGuard]
})
export class FeedModule {}

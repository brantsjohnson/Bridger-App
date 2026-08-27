// ============================================
// WHAT THIS FILE DOES (plain English):
// Makes the PostHog helper available to /me (person purge) and admin health.
// ============================================
import { Module } from '@nestjs/common';
import { PosthogService } from './posthog.service';

@Module({
  providers: [PosthogService],
  exports: [PosthogService]
})
export class PosthogModule {}

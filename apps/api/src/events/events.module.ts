// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the Events routes so the Events tab and create wizard talk to a
// real API. Added to app.module.ts.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { MatchingModule } from '../matching/matching.module';
import { StoriesModule } from '../stories/stories.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [CoopModule, MatchingModule, StoriesModule],
  controllers: [EventsController],
  providers: [EventsService, SupabaseAuthGuard],
  exports: [EventsService]
})
export class EventsModule {}

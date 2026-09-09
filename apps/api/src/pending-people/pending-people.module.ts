// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the pending-people routes into the API.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { PosthogModule } from '../posthog/posthog.module';
import { PendingPeopleController } from './pending-people.controller';
import { PendingPeopleService } from './pending-people.service';

@Module({
  imports: [PosthogModule],
  controllers: [PendingPeopleController],
  providers: [PendingPeopleService, SupabaseAuthGuard],
  exports: [PendingPeopleService]
})
export class PendingPeopleModule {}

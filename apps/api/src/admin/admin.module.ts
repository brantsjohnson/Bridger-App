// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the admin content controller + service and pulls in AdminGuard from
// the admin-auth module.
// ============================================
import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { AiModule } from '../ai/ai.module';
import { AssistantModule } from '../assistant/assistant.module';
import { CoopModule } from '../coop/coop.module';
import { MatchingModule } from '../matching/matching.module';
import { PhotoFiltersModule } from '../photo-filters/photo-filters.module';
import { PosthogModule } from '../posthog/posthog.module';
import { RecapModule } from '../recap/recap.module';
import { TelemetryModule } from '../telemetry/telemetry.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { IntegrationsHealthService } from './integrations-health.service';

@Module({
  imports: [
    AdminAuthModule,
    TelemetryModule,
    CoopModule,
    AiModule,
    AssistantModule,
    MatchingModule,
    PosthogModule,
    PhotoFiltersModule,
    RecapModule
  ],
  controllers: [AdminController],
  providers: [AdminService, IntegrationsHealthService],
  exports: [AdminService]
})
export class AdminModule {}

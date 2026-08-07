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
import { TelemetryModule } from '../telemetry/telemetry.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [
    AdminAuthModule,
    TelemetryModule,
    CoopModule,
    AiModule,
    AssistantModule,
    MatchingModule
  ],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService]
})
export class AdminModule {}

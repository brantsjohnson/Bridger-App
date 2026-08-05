// ============================================
// WHAT THIS FILE DOES (plain English):
// Public-ish telemetry the app can post without going through the admin
// console: right now, 404 / broken-path hits so organizers can see the trail.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseModule } from '../supabase/supabase.module';
import { TelemetryController } from './telemetry.controller';
import { TelemetryService } from './telemetry.service';

@Module({
  imports: [SupabaseModule],
  controllers: [TelemetryController],
  providers: [TelemetryService],
  exports: [TelemetryService]
})
export class TelemetryModule {}

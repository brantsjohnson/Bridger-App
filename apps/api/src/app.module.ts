// ============================================
// WHAT THIS FILE DOES (plain English):
// The "wiring diagram" for the backend. It lists every feature module the API
// is made of: health check, auth/Supabase, /me, admin console, and the
// public user modules (content, quiz, activity, co-op, delights).
// ============================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ActivityModule } from './activity/activity.module';
import { AdminAuthModule } from './admin-auth/admin-auth.module';
import { AdminModule } from './admin/admin.module';
import { ContentModule } from './content/content.module';
import { CoopModule } from './coop/coop.module';
import { DelightModule } from './delight/delight.module';
import { HealthModule } from './health/health.module';
import { MeModule } from './me/me.module';
import { QuizModule } from './quiz/quiz.module';
import { RecapModule } from './recap/recap.module';
import { SupabaseModule } from './supabase/supabase.module';
import { TelemetryModule } from './telemetry/telemetry.module';
import { TouchGrassModule } from './touchgrass/touchgrass.module';

@Module({
  imports: [
    // Loads apps/api/.env and makes settings available everywhere (isGlobal).
    ConfigModule.forRoot({ isGlobal: true }),
    // The server's admin connection to Supabase (global).
    SupabaseModule,
    HealthModule,
    MeModule,
    AdminAuthModule,
    AdminModule,
    ContentModule,
    QuizModule,
    ActivityModule,
    CoopModule,
    DelightModule,
    TouchGrassModule,
    RecapModule,
    TelemetryModule
  ]
})
export class AppModule {}

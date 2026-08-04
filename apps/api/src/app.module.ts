// ============================================
// WHAT THIS FILE DOES (plain English):
// The "wiring diagram" for the backend. It lists every feature module the API
// is made of. Right now there is only the Health module (a simple "are you
// alive?" check). As we build features (profiles, attributes, tiers, ...), each
// gets its own module and gets added to this list.
// ============================================
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './supabase/supabase.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    // Loads apps/api/.env and makes settings available everywhere (isGlobal).
    ConfigModule.forRoot({ isGlobal: true }),
    // The server's admin connection to Supabase (global).
    SupabaseModule,
    HealthModule,
    MeModule
  ]
})
export class AppModule {}

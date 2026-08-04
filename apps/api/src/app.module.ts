// ============================================
// WHAT THIS FILE DOES (plain English):
// The "wiring diagram" for the backend. It lists every feature module the API
// is made of. Right now there is only the Health module (a simple "are you
// alive?" check). As we build features (profiles, attributes, tiers, ...), each
// gets its own module and gets added to this list.
// ============================================
import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule]
})
export class AppModule {}

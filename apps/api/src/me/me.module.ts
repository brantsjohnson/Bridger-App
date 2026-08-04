// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the /me route together with the auth guard it needs. Added to the
// app's wiring diagram (app.module.ts) so the route is live.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { MeController } from './me.controller';

@Module({
  controllers: [MeController],
  providers: [SupabaseAuthGuard]
})
export class MeModule {}

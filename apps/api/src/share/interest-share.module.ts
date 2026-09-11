// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the opt-in interests-share routes together and gives the owner routes
// the login guard they need. Added to the app's wiring diagram (app.module.ts)
// so /me/share/interests (owner) and /public/share/interests (public) go live.
// ============================================
import { Module } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import {
  MeInterestShareController,
  PublicInterestShareController
} from './interest-share.controller';
import { InterestShareService } from './interest-share.service';

@Module({
  controllers: [MeInterestShareController, PublicInterestShareController],
  providers: [SupabaseAuthGuard, InterestShareService]
})
export class InterestShareModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the profile + attributes + Greatest hits routes together and gives
// them the auth guard they need. Added to the app's wiring diagram
// (app.module.ts) so /me/profile, /me/settings, /me/attributes,
// /me/greatest-hits, and /people/:id/profile routes go live.
// ============================================
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { AssistantModule } from '../assistant/assistant.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { RequireCoopMemberGuard } from '../coop/require-coop-member.guard';
import { AttributesController } from './attributes.controller';
import { GreatestHitsService } from './greatest-hits.service';
import { ProfilesController } from './profiles.controller';

@Module({
  imports: [CoopModule, AiModule, AssistantModule],
  controllers: [ProfilesController, AttributesController],
  providers: [SupabaseAuthGuard, RequireCoopMemberGuard, GreatestHitsService]
})
export class ProfilesModule {}

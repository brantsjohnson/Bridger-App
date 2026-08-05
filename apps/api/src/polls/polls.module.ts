// ============================================
// WHAT THIS FILE DOES (plain English):
// Bundles the poll routes and database work. Importing CoopModule makes the
// same membership check used by the co-op portal available to poll creation.
// ============================================
import { Module } from "@nestjs/common";
import { SupabaseAuthGuard } from "../auth/auth.guard";
import { CoopModule } from "../coop/coop.module";
import { RequireCoopMemberGuard } from "../coop/require-coop-member.guard";
import { PollsController } from "./polls.controller";
import { PollsService } from "./polls.service";

@Module({
  imports: [CoopModule],
  controllers: [PollsController],
  providers: [PollsService, SupabaseAuthGuard, RequireCoopMemberGuard],
})
export class PollsModule {}

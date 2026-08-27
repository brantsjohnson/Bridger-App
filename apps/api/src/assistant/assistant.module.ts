// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the opt-in Assistant (Billy): gates, playbooks, fill loop, context,
// chat turns, Billy billing, and act confirms.
// ============================================
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { NotesModule } from '../notes/notes.module';
import { TouchGrassModule } from '../touchgrass/touchgrass.module';
import { AssistantContextService } from './assistant-context.service';
import { AssistantController } from './assistant.controller';
import { AssistantGateService } from './assistant-gate.service';
import { AssistantService } from './assistant.service';
import { BillyBillingService } from './billy-billing.service';
import { FillLoopService } from './fill-loop.service';
import { PlaybookLoaderService } from './playbook-loader.service';

@Module({
  imports: [AiModule, CoopModule, NotesModule, TouchGrassModule],
  controllers: [AssistantController],
  providers: [
    AssistantGateService,
    AssistantContextService,
    PlaybookLoaderService,
    FillLoopService,
    BillyBillingService,
    AssistantService,
    SupabaseAuthGuard
  ],
  exports: [AssistantGateService, BillyBillingService]
})
export class AssistantModule {}

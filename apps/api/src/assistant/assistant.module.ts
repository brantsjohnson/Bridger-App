// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the opt-in Assistant: gates, context, chat turns, and act confirms.
// ============================================
import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SupabaseAuthGuard } from '../auth/auth.guard';
import { CoopModule } from '../coop/coop.module';
import { NotesModule } from '../notes/notes.module';
import { AssistantContextService } from './assistant-context.service';
import { AssistantController } from './assistant.controller';
import { AssistantGateService } from './assistant-gate.service';
import { AssistantService } from './assistant.service';

@Module({
  imports: [AiModule, CoopModule, NotesModule],
  controllers: [AssistantController],
  providers: [
    AssistantGateService,
    AssistantContextService,
    AssistantService,
    SupabaseAuthGuard
  ],
  exports: [AssistantGateService]
})
export class AssistantModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Wires the AI layer into Nest: config store, enqueue service, worker, and
// ops helpers. Domain modules import AiModule to call AiJobsService.enqueue.
// Never re-exports Anthropic/OpenAI SDK clients.
// ============================================
import { Module } from '@nestjs/common';
import { NestAiConfigStore } from './ai-config.store';
import { AiJobsService } from './ai-jobs.service';
import { AiOpsService } from './ai-ops.service';
import { AiWorkerService } from './ai-worker.service';

@Module({
  providers: [
    NestAiConfigStore,
    AiJobsService,
    AiWorkerService,
    AiOpsService
  ],
  exports: [AiJobsService, AiWorkerService, AiOpsService, NestAiConfigStore]
})
export class AiModule {}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The public door into @bridger/ai. Nest imports from here. Clients must not.
// We deliberately do NOT re-export Anthropic/OpenAI SDK clients.
// ============================================

export type { JobName, Lane, JobRegistryEntry, ModelTier } from './jobs/types';
export { JOB_REGISTRY, getRegistryEntry, ALL_JOB_NAMES } from './jobs/registry';

export {
  runJob,
  scrubPayload,
  ScrubError,
  contentHash,
  idempotencyKey,
  validateJobOutput,
  isGrounded,
  CircuitBreaker,
  configFromRegistry,
  DEFAULT_MODEL_IDS,
  buildCostLogEntry,
  estimateUsd
} from './gateway';
export type {
  RunJobInput,
  RunJobResult,
  GatewayDeps,
  GatewaySecrets,
  AiJobConfig,
  AiConfigStore,
  AiCostLogEntry
} from './gateway';

export { getPrompt } from './prompts';
export {
  daySummary,
  weekSummary,
  quizModerator,
  moduleNotes,
  personSummary,
  freshness,
  agentQuery,
  agentReasoning
} from './prompts';

export {
  normalizeAttribute,
  normalizePersonCorpus,
  type AttributeForEmbed
} from './rag/normalize';
export { scrubTextForEmbed } from './rag/scrub-text';
export {
  planPersonEmbedding,
  vectorToPgString,
  type EmbeddingUpsertPlan
} from './rag/upsert-embedding';
export { ZONE_C_TABLES } from './rag/delete-embeddings';

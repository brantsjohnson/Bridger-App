// ============================================
// WHAT THIS FILE DOES (plain English):
// The static defaults for every AI job: which lane, how hot the model runs,
// how many tokens, and whether it starts enabled. The live kill switch and
// model IDs live in the ai_config database table and override these.
// ============================================
import type { JobName, JobRegistryEntry } from './types';

export const JOB_REGISTRY: Record<JobName, JobRegistryEntry> = {
  transcription: {
    job: 'transcription',
    lane: 'deidentified',
    modelTier: 'stt',
    temperature: 0,
    maxTokens: 0,
    timeoutMs: 30_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 50,
    defaultEnabled: true
  },
  day_summary: {
    job: 'day_summary',
    lane: 'deidentified',
    modelTier: 'fast',
    temperature: 0.4,
    maxTokens: 150,
    timeoutMs: 10_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 40,
    defaultEnabled: true
  },
  week_summary: {
    job: 'week_summary',
    lane: 'deidentified',
    modelTier: 'standard',
    temperature: 0.4,
    maxTokens: 600,
    timeoutMs: 15_000,
    output: 'json',
    schemaId: 'week_summary',
    monthlyBudgetUsd: 80,
    defaultEnabled: true
  },
  quiz_moderator: {
    job: 'quiz_moderator',
    lane: 'deidentified',
    modelTier: 'standard',
    temperature: 0.2,
    maxTokens: 800,
    timeoutMs: 10_000,
    output: 'json',
    schemaId: 'quiz_moderator',
    monthlyBudgetUsd: 100,
    defaultEnabled: true
  },
  module_notes: {
    job: 'module_notes',
    lane: 'deidentified',
    modelTier: 'standard',
    temperature: 0.3,
    maxTokens: 300,
    timeoutMs: 10_000,
    output: 'json',
    schemaId: 'module_notes',
    monthlyBudgetUsd: 40,
    defaultEnabled: true
  },
  person_summary: {
    job: 'person_summary',
    lane: 'deidentified',
    modelTier: 'fast',
    temperature: 0.3,
    maxTokens: 250,
    timeoutMs: 10_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 40,
    defaultEnabled: true
  },
  embeddings: {
    job: 'embeddings',
    lane: 'deidentified',
    modelTier: 'embed',
    temperature: 0,
    maxTokens: 0,
    timeoutMs: 15_000,
    output: 'vector',
    schemaId: null,
    monthlyBudgetUsd: 30,
    defaultEnabled: true
  },
  freshness: {
    job: 'freshness',
    lane: 'deidentified',
    modelTier: 'fast',
    temperature: 0,
    maxTokens: 200,
    timeoutMs: 10_000,
    output: 'json',
    schemaId: 'freshness',
    monthlyBudgetUsd: 20,
    defaultEnabled: true
  },
  voice_captions: {
    job: 'voice_captions',
    lane: 'deidentified',
    modelTier: 'stt',
    temperature: 0,
    maxTokens: 0,
    timeoutMs: 30_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 30,
    defaultEnabled: true
  },
  // Job 10: audio stitch only. No foundation model.
  recap_podcast: {
    job: 'recap_podcast',
    lane: 'deidentified',
    modelTier: 'none',
    temperature: 0,
    maxTokens: 0,
    timeoutMs: 60_000,
    output: 'audio',
    schemaId: null,
    monthlyBudgetUsd: 0,
    defaultEnabled: true,
    noLlm: true
  },
  // Job 14: leftover weekly recap prompts. Never sees friend-submitted text.
  recap_week_fill: {
    job: 'recap_week_fill',
    lane: 'deidentified',
    modelTier: 'fast',
    temperature: 0.4,
    maxTokens: 250,
    timeoutMs: 8_000,
    output: 'json',
    schemaId: 'recap_week_fill',
    monthlyBudgetUsd: 10,
    defaultEnabled: true
  },
  // Jobs 11–13: personal_agent lane. Disabled until AGENT plan.
  agent_reasoning: {
    job: 'agent_reasoning',
    lane: 'personal_agent',
    modelTier: 'standard',
    temperature: 0.3,
    maxTokens: 2000,
    timeoutMs: 30_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 200,
    defaultEnabled: false
  },
  agent_query: {
    job: 'agent_query',
    lane: 'personal_agent',
    modelTier: 'fast',
    temperature: 0.2,
    maxTokens: 300,
    timeoutMs: 10_000,
    output: 'json',
    schemaId: 'agent_query',
    monthlyBudgetUsd: 40,
    defaultEnabled: false
  },
  agent_voice: {
    job: 'agent_voice',
    lane: 'personal_agent',
    modelTier: 'stt',
    temperature: 0.4,
    maxTokens: 400,
    timeoutMs: 30_000,
    output: 'text',
    schemaId: null,
    monthlyBudgetUsd: 80,
    defaultEnabled: false
  }
};

export function getRegistryEntry(job: JobName): JobRegistryEntry {
  return JOB_REGISTRY[job];
}

export const ALL_JOB_NAMES = Object.keys(JOB_REGISTRY) as JobName[];

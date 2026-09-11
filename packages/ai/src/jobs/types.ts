// ============================================
// WHAT THIS FILE DOES (plain English):
// Names every AI job Bridger can run, and which privacy lane it rides on.
// These names match guide-docs/AI-SYSTEM.md §2 (and AGENT.md §13 for 11–13).
// ============================================

/** Which scrub rules apply. A job cannot switch lanes at runtime. */
export type Lane = 'deidentified' | 'personal_agent';

/**
 * Canonical job names. Keep in lockstep with ai_config seeds and AI-SYSTEM.md.
 */
export type JobName =
  | 'transcription'
  | 'day_summary'
  | 'week_summary'
  | 'quiz_moderator'
  | 'module_notes'
  | 'person_summary'
  | 'embeddings'
  | 'freshness'
  | 'voice_captions'
  | 'recap_podcast'
  | 'recap_week_fill'
  | 'agent_reasoning'
  | 'agent_query'
  | 'agent_voice';

/** Model tier placeholders; real model_id lives in ai_config. */
export type ModelTier = 'standard' | 'fast' | 'embed' | 'stt' | 'none';

export type OutputKind = 'text' | 'json' | 'vector' | 'audio' | 'none';

export interface JobRegistryEntry {
  job: JobName;
  lane: Lane;
  /** Default model tier when ai_config is missing (dev only). */
  modelTier: ModelTier;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  output: OutputKind;
  /** JSON schema id used by the gateway validator (null = free text / non-LLM). */
  schemaId: string | null;
  /** Default monthly budget in USD before auto-disable. */
  monthlyBudgetUsd: number;
  /** Agent jobs ship disabled until the AGENT plan. */
  defaultEnabled: boolean;
  /** True when this job never calls an LLM (audio stitch, etc.). */
  noLlm?: boolean;
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The shape of one row from ai_config: which model to use, how hot, how many
// tokens, the budget, and whether the job is turned on. Live values come from
// the database; registry defaults fill gaps in tests.
// ============================================
import { getRegistryEntry } from '../jobs/registry';
import type { JobName, Lane } from '../jobs/types';

export interface AiJobConfig {
  job: JobName;
  lane: Lane;
  modelId: string;
  temperature: number;
  maxTokens: number;
  timeoutMs: number;
  schemaId: string | null;
  monthlyBudgetUsd: number;
  enabled: boolean;
}

/** Default model ids when the DB row is missing (dev / tests). */
export const DEFAULT_MODEL_IDS: Record<string, string> = {
  standard: 'claude-sonnet-4-20250514',
  fast: 'claude-haiku-4-5-20251001',
  embed: 'text-embedding-3-small',
  stt: 'whisper-1',
  none: 'none'
};

export function configFromRegistry(job: JobName): AiJobConfig {
  const entry = getRegistryEntry(job);
  return {
    job,
    lane: entry.lane,
    modelId: DEFAULT_MODEL_IDS[entry.modelTier] ?? 'none',
    temperature: entry.temperature,
    maxTokens: entry.maxTokens,
    timeoutMs: entry.timeoutMs,
    schemaId: entry.schemaId,
    monthlyBudgetUsd: entry.monthlyBudgetUsd,
    enabled: entry.defaultEnabled
  };
}

/** Something Nest (or tests) implements to load live ai_config rows. */
export interface AiConfigStore {
  getJobConfig(job: JobName): Promise<AiJobConfig | null>;
  /** Sum estimated_usd for this job in the current UTC month. */
  getMonthSpendUsd(job: JobName): Promise<number>;
  /** Kill-switch: set enabled=false when budget is blown. */
  disableJob(job: JobName, reason: string): Promise<void>;
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Shapes the tiny de-identified receipt we keep for each AI call: which job,
// how long, how many tokens, rough dollars. Never the prompt or the answer.
// ============================================
import type { JobName } from '../jobs/types';

export interface AiCostLogEntry {
  job: JobName;
  promptVersion: string | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  estimatedUsd: number;
  subjectRef: string;
  createdAt: string;
}

/** Rough USD estimate from token counts (config prices can refine later). */
export function estimateUsd(opts: {
  job: JobName;
  inputTokens: number;
  outputTokens: number;
  /** dollars per 1M input tokens */
  inputPerMillion?: number;
  /** dollars per 1M output tokens */
  outputPerMillion?: number;
}): number {
  const inRate = opts.inputPerMillion ?? 3;
  const outRate = opts.outputPerMillion ?? 15;
  return (
    (opts.inputTokens / 1_000_000) * inRate +
    (opts.outputTokens / 1_000_000) * outRate
  );
}

export function buildCostLogEntry(input: {
  job: JobName;
  promptVersion: string | null;
  latencyMs: number;
  inputTokens: number;
  outputTokens: number;
  subjectRef: string;
  estimatedUsd?: number;
}): AiCostLogEntry {
  return {
    job: input.job,
    promptVersion: input.promptVersion,
    latencyMs: input.latencyMs,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    estimatedUsd:
      input.estimatedUsd ??
      estimateUsd({
        job: input.job,
        inputTokens: input.inputTokens,
        outputTokens: input.outputTokens
      }),
    subjectRef: input.subjectRef,
    createdAt: new Date().toISOString()
  };
}

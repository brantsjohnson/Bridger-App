// ============================================
// WHAT THIS FILE DOES (plain English):
// The AI gateway: the one door every model call walks through. It loads the
// job config, scrubs the payload, calls the right provider, checks the answer,
// logs cost metadata (never content), and fails silent when anything is wrong.
//
// --- SECURITY / PRIVACY ---
// Keys stay server-side. Deidentified lane never sees PII or media.
// personal_agent lane requires a principal. Lanes cannot switch at runtime.
// ============================================
import { getRegistryEntry } from '../jobs/registry';
import type { JobName, Lane } from '../jobs/types';
import { getPrompt } from '../prompts';
import type { AiConfigStore, AiJobConfig } from './config';
import { configFromRegistry } from './config';
import { CircuitBreaker } from './circuit-breaker';
import { buildCostLogEntry, type AiCostLogEntry } from './cost-log';
import { contentHash } from './idempotency';
import { callAnthropic } from './providers/anthropic';
import { callOpenAiEmbed } from './providers/openai-embed';
import { classifyProviderError } from './provider-errors';
import { callSpeechToText } from './providers/stt';
import { ScrubError, scrubPayload } from './scrub';
import { validateJobOutput } from './validate-output';

export interface GatewaySecrets {
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

export interface RunJobInput {
  job: JobName;
  subjectRef: string;
  payload: Record<string, unknown>;
  /** Required for personal_agent. */
  principalId?: string;
  /** Optional grounding source for summary jobs. */
  groundingSource?: string;
  /** Already-computed idempotency: if seen, skip. */
  alreadyCompleted?: boolean;
}

export type RunJobResult =
  | {
      status: 'ok';
      value: unknown;
      promptVersion: string | null;
      contentHash: string;
      cost: AiCostLogEntry;
    }
  | { status: 'disabled' }
  | { status: 'skipped_idempotent' }
  | { status: 'fail_silent'; reason: string }
  | { status: 'no_llm' };

export interface GatewayDeps {
  configStore?: AiConfigStore;
  secrets: GatewaySecrets;
  onCostLog?: (entry: AiCostLogEntry) => Promise<void> | void;
  /** Optional override for tests. */
  callAnthropicFn?: typeof callAnthropic;
  callEmbedFn?: typeof callOpenAiEmbed;
  callSttFn?: typeof callSpeechToText;
}

const anthropicBreaker = new CircuitBreaker('anthropic');
const openaiBreaker = new CircuitBreaker('openai');

/**
 * Run one AI job through the firewall. Never throws for model quality issues;
 * returns fail_silent / disabled instead. ScrubError propagates as fail_silent
 * with reason scrub_rejected (and never calls the provider).
 */
export async function runJob(
  input: RunJobInput,
  deps: GatewayDeps
): Promise<RunJobResult> {
  const entry = getRegistryEntry(input.job);
  const hash = contentHash(input.payload);

  if (input.alreadyCompleted) {
    return { status: 'skipped_idempotent' };
  }

  // Recap podcast is audio-only; Nest handles stitch outside the LLM path.
  if (entry.noLlm) {
    return { status: 'no_llm' };
  }

  const config = await loadConfig(input.job, deps.configStore);
  if (!config.enabled) {
    return { status: 'disabled' };
  }

  // SECURITY: lane is fixed per job; payload cannot change it.
  if (config.lane !== entry.lane) {
    return {
      status: 'fail_silent',
      reason: 'lane_mismatch_config'
    };
  }

  let scrubbed: Record<string, unknown>;
  let lane: Lane;
  try {
    const scrub = scrubPayload(input.job, input.payload, {
      principalId: input.principalId
    });
    scrubbed = scrub.payload;
    lane = scrub.lane;
  } catch (err) {
    const reason = err instanceof ScrubError ? err.message : 'scrub_rejected';
    return { status: 'fail_silent', reason: `scrub_rejected:${reason}` };
  }

  if (lane !== entry.lane) {
    return { status: 'fail_silent', reason: 'lane_mismatch' };
  }

  // Budget gate before spend.
  if (deps.configStore) {
    const spent = await deps.configStore.getMonthSpendUsd(input.job);
    if (spent >= config.monthlyBudgetUsd && config.monthlyBudgetUsd > 0) {
      await deps.configStore.disableJob(input.job, 'monthly_budget_exceeded');
      return { status: 'disabled' };
    }
  }

  const started = Date.now();

  try {
    if (entry.modelTier === 'embed') {
      return await runEmbed(input, config, scrubbed, hash, deps, started);
    }
    if (entry.modelTier === 'stt') {
      return await runStt(input, config, scrubbed, hash, deps, started);
    }
    return await runLlm(input, config, scrubbed, hash, deps, started);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'provider_error';
    return { status: 'fail_silent', reason: message };
  }
}

async function loadConfig(
  job: JobName,
  store?: AiConfigStore
): Promise<AiJobConfig> {
  if (!store) return configFromRegistry(job);
  const row = await store.getJobConfig(job);
  return row ?? configFromRegistry(job);
}

async function runLlm(
  input: RunJobInput,
  config: AiJobConfig,
  scrubbed: Record<string, unknown>,
  hash: string,
  deps: GatewayDeps,
  started: number
): Promise<RunJobResult> {
  const key = deps.secrets.anthropicApiKey;
  if (!key) {
    return { status: 'fail_silent', reason: 'missing_anthropic_key' };
  }
  if (!anthropicBreaker.canRequest()) {
    return { status: 'fail_silent', reason: 'circuit_open_anthropic' };
  }

  const prompt = getPrompt(input.job);
  if (!prompt) {
    return { status: 'fail_silent', reason: 'missing_prompt' };
  }

  const user =
    typeof scrubbed.user_prompt === 'string'
      ? scrubbed.user_prompt
      : JSON.stringify(scrubbed);

  const call = deps.callAnthropicFn ?? callAnthropic;

  let lastRaw = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const result = await call({
        apiKey: key,
        modelId: config.modelId,
        system: prompt.system,
        user,
        temperature: config.temperature,
        maxTokens: config.maxTokens,
        timeoutMs: config.timeoutMs
      });
      anthropicBreaker.recordSuccess();
      lastRaw = result.text;

      if (lastRaw.trim() === 'null') {
        return { status: 'fail_silent', reason: 'model_returned_null' };
      }

      const validated = validateJobOutput(
        input.job,
        config.schemaId,
        lastRaw,
        input.groundingSource
      );
      if (!validated.ok) {
        if (attempt === 0) continue;
        return { status: 'fail_silent', reason: validated.reason };
      }

      const cost = buildCostLogEntry({
        job: input.job,
        promptVersion: prompt.version,
        latencyMs: Date.now() - started,
        inputTokens: result.inputTokens,
        outputTokens: result.outputTokens,
        subjectRef: input.subjectRef
      });
      await deps.onCostLog?.(cost);

      return {
        status: 'ok',
        value: validated.value,
        promptVersion: prompt.version,
        contentHash: hash,
        cost
      };
    } catch (err) {
      anthropicBreaker.recordFailure();
      const classified = classifyProviderError(err);
      if (attempt === 0 && classified.kind === 'other') continue;
      if (classified.kind === 'rate_limit' || classified.kind === 'billing') {
        return {
          status: 'fail_silent',
          reason: `provider_failed:${classified.kind}`
        };
      }
      if (attempt === 0) continue;
      return { status: 'fail_silent', reason: 'provider_failed:other' };
    }
  }

  return { status: 'fail_silent', reason: 'invalid_json_twice' };
}

async function runEmbed(
  input: RunJobInput,
  config: AiJobConfig,
  scrubbed: Record<string, unknown>,
  hash: string,
  deps: GatewayDeps,
  started: number
): Promise<RunJobResult> {
  const key = deps.secrets.openaiApiKey;
  if (!key) {
    return { status: 'fail_silent', reason: 'missing_openai_key' };
  }
  if (!openaiBreaker.canRequest()) {
    return { status: 'fail_silent', reason: 'circuit_open_openai' };
  }

  const text =
    typeof scrubbed.corpus_text === 'string'
      ? scrubbed.corpus_text
      : typeof scrubbed.text === 'string'
        ? scrubbed.text
        : '';
  if (!text.trim()) {
    return { status: 'fail_silent', reason: 'empty_corpus' };
  }

  const call = deps.callEmbedFn ?? callOpenAiEmbed;
  try {
    const result = await call({
      apiKey: key,
      modelId: config.modelId,
      texts: [text],
      timeoutMs: config.timeoutMs
    });
    openaiBreaker.recordSuccess();
    const vector = result.vectors[0];
    if (!vector) {
      return { status: 'fail_silent', reason: 'empty_vector' };
    }
    const cost = buildCostLogEntry({
      job: input.job,
      promptVersion: null,
      latencyMs: Date.now() - started,
      inputTokens: result.inputTokens,
      outputTokens: 0,
      subjectRef: input.subjectRef
    });
    await deps.onCostLog?.(cost);
    return {
      status: 'ok',
      value: { vector, modelId: config.modelId },
      promptVersion: null,
      contentHash: hash,
      cost
    };
  } catch {
    openaiBreaker.recordFailure();
    return { status: 'fail_silent', reason: 'embed_failed' };
  }
}

async function runStt(
  input: RunJobInput,
  config: AiJobConfig,
  scrubbed: Record<string, unknown>,
  hash: string,
  deps: GatewayDeps,
  started: number
): Promise<RunJobResult> {
  const key = deps.secrets.openaiApiKey;
  if (!key) {
    return { status: 'fail_silent', reason: 'missing_openai_key' };
  }
  if (!openaiBreaker.canRequest()) {
    return { status: 'fail_silent', reason: 'circuit_open_openai' };
  }

  const audio = scrubbed.audio_base64;
  const filename =
    typeof scrubbed.filename === 'string' ? scrubbed.filename : 'audio.m4a';
  if (typeof audio !== 'string' || !audio) {
    return { status: 'fail_silent', reason: 'missing_audio' };
  }

  // STT needs bytes; media URLs are rejected by scrub. Base64 is the allowed shape.
  const buffer = Buffer.from(audio, 'base64');
  const call = deps.callSttFn ?? callSpeechToText;
  try {
    const result = await call({
      apiKey: key,
      modelId: config.modelId,
      audio: buffer,
      filename,
      mimeType:
        typeof scrubbed.mime_type === 'string' ? scrubbed.mime_type : undefined,
      timeoutMs: config.timeoutMs
    });
    openaiBreaker.recordSuccess();
    const cost = buildCostLogEntry({
      job: input.job,
      promptVersion: null,
      latencyMs: Date.now() - started,
      inputTokens: 0,
      outputTokens: 0,
      subjectRef: input.subjectRef,
      estimatedUsd: 0.006
    });
    await deps.onCostLog?.(cost);
    return {
      status: 'ok',
      value: { text: result.text },
      promptVersion: null,
      contentHash: hash,
      cost
    };
  } catch {
    openaiBreaker.recordFailure();
    return { status: 'fail_silent', reason: 'stt_failed' };
  }
}

export { scrubPayload, ScrubError } from './scrub';
export { contentHash, idempotencyKey } from './idempotency';
export { validateJobOutput, isGrounded } from './validate-output';
export { CircuitBreaker } from './circuit-breaker';
export {
  configFromRegistry,
  DEFAULT_MODEL_IDS,
  type AiJobConfig,
  type AiConfigStore
} from './config';
export { buildCostLogEntry, estimateUsd, type AiCostLogEntry } from './cost-log';

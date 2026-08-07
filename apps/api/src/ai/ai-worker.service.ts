// ============================================
// WHAT THIS FILE DOES (plain English):
// Pulls pending AI jobs off the shelf, runs them through the gateway, and
// writes the results (day summary, embeddings, etc.). Retries twice, then
// moves the job to the dead-letter pile for admin review.
// ============================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  runJob,
  type JobName,
  type AiCostLogEntry,
  vectorToPgString
} from '@bridger/ai';
import type { Json } from '@bridger/shared';
import { NestAiConfigStore } from './ai-config.store';
import { SupabaseService } from '../supabase/supabase.service';

const MAX_ATTEMPTS = 2;

@Injectable()
export class AiWorkerService {
  private readonly logger = new Logger(AiWorkerService.name);

  constructor(
    private readonly supabase: SupabaseService,
    private readonly config: ConfigService,
    private readonly configStore: NestAiConfigStore
  ) {}

  /** Process up to `limit` due jobs. Returns how many were attempted. */
  async processBatch(limit = 10): Promise<number> {
    const now = new Date().toISOString();
    const { data: jobs, error } = await this.supabase.admin
      .from('ai_jobs')
      .select('*')
      .in('status', ['pending', 'failed'])
      .lte('run_after', now)
      .order('created_at', { ascending: true })
      .limit(limit);
    if (error) throw error;
    if (!jobs?.length) return 0;

    for (const job of jobs) {
      await this.processOne(job);
    }
    return jobs.length;
  }

  private async processOne(job: {
    id: string;
    job: string;
    subject_ref: string;
    content_hash: string;
    payload_json: Json;
    attempts: number;
  }): Promise<void> {
    await this.supabase.admin
      .from('ai_jobs')
      .update({
        status: 'running',
        attempts: job.attempts + 1
      })
      .eq('id', job.id);

    const payload =
      job.payload_json && typeof job.payload_json === 'object'
        ? (job.payload_json as Record<string, unknown>)
        : {};

    const grounding =
      typeof payload.grounding_source === 'string'
        ? payload.grounding_source
        : undefined;

    const result = await runJob(
      {
        job: job.job as JobName,
        subjectRef: job.subject_ref,
        payload: {
          ...payload,
          subject_ref: job.subject_ref
        },
        groundingSource: grounding
      },
      {
        configStore: this.configStore,
        secrets: {
          anthropicApiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
          openaiApiKey: this.config.get<string>('OPENAI_API_KEY')
        },
        onCostLog: (entry) => this.writeCostLog(entry)
      }
    );

    if (result.status === 'ok') {
      await this.applyResult(job.job as JobName, job.subject_ref, payload, result.value);
      await this.supabase.admin
        .from('ai_jobs')
        .update({
          status: 'done',
          finished_at: new Date().toISOString(),
          result_json: (result.value as Json) ?? null,
          last_error: null
        })
        .eq('id', job.id);
      return;
    }

    if (result.status === 'no_llm') {
      // Recap podcast: Nest recap module owns stitch; mark done no-op.
      await this.supabase.admin
        .from('ai_jobs')
        .update({
          status: 'done',
          finished_at: new Date().toISOString(),
          last_error: null
        })
        .eq('id', job.id);
      return;
    }

    if (result.status === 'disabled' || result.status === 'skipped_idempotent') {
      await this.supabase.admin
        .from('ai_jobs')
        .update({
          status: 'done',
          finished_at: new Date().toISOString(),
          last_error: result.status
        })
        .eq('id', job.id);
      return;
    }

    // fail_silent → retry or dead-letter
    const reason =
      result.status === 'fail_silent' ? result.reason : 'unknown_failure';
    const attempts = job.attempts + 1;
    if (attempts >= MAX_ATTEMPTS) {
      await this.supabase.admin
        .from('ai_jobs')
        .update({
          status: 'dead',
          finished_at: new Date().toISOString(),
          last_error: reason
        })
        .eq('id', job.id);
      this.logger.warn(`AI job dead-lettered id=${job.id} reason=${reason}`);
      return;
    }

    const backoffMs = 5_000 * attempts;
    await this.supabase.admin
      .from('ai_jobs')
      .update({
        status: 'failed',
        last_error: reason,
        run_after: new Date(Date.now() + backoffMs).toISOString()
      })
      .eq('id', job.id);
  }

  private async writeCostLog(entry: AiCostLogEntry): Promise<void> {
    await this.supabase.admin.from('ai_job_cost_log').insert({
      job: entry.job,
      prompt_version: entry.promptVersion,
      latency_ms: entry.latencyMs,
      input_tokens: entry.inputTokens,
      output_tokens: entry.outputTokens,
      estimated_usd: entry.estimatedUsd,
      subject_ref: entry.subjectRef,
      created_at: entry.createdAt
    });
  }

  /**
   * Persist gateway output into the right domain table. Fail silent means we
   * simply do not write (no filler prose about someone's life).
   */
  private async applyResult(
    job: JobName,
    subjectRef: string,
    payload: Record<string, unknown>,
    value: unknown
  ): Promise<void> {
    switch (job) {
      case 'day_summary': {
        if (typeof value !== 'string' || !value.trim()) return;
        const date =
          typeof payload.date === 'string'
            ? payload.date
            : new Date().toISOString().slice(0, 10);
        const { data: existing } = await this.supabase.admin
          .from('day_summaries')
          .select('id')
          .eq('author_id', subjectRef)
          .eq('date', date)
          .maybeSingle();
        if (existing) {
          await this.supabase.admin
            .from('day_summaries')
            .update({ text: value, built_at: new Date().toISOString() })
            .eq('id', existing.id);
        } else {
          await this.supabase.admin.from('day_summaries').insert({
            author_id: subjectRef,
            date,
            text: value,
            visible_to_tier: 'friend'
          });
        }
        // Kick week summary rebuild from accumulated day texts.
        await this.enqueueWeekFromDays(subjectRef);
        return;
      }
      case 'week_summary': {
        if (value == null || typeof value !== 'object') return;
        const weekStart =
          typeof payload.week_start === 'string'
            ? payload.week_start
            : mondayOf(new Date());
        await this.supabase.admin.from('week_summaries').upsert({
          author_id: subjectRef,
          week_start: weekStart,
          days_json: value as Json,
          built_at: new Date().toISOString()
        });
        return;
      }
      case 'embeddings': {
        const vec = (value as { vector?: number[]; modelId?: string })?.vector;
        const modelId = (value as { modelId?: string })?.modelId;
        if (!vec?.length) return;
        await this.supabase.admin.from('person_embeddings').upsert({
          user_id: subjectRef,
          embedding: vectorToPgString(vec),
          model: modelId ?? 'text-embedding-3-small',
          updated_at: new Date().toISOString()
        });
        return;
      }
      case 'person_summary': {
        if (typeof value !== 'string') return;
        const text = value.trim() === 'null' ? null : value.trim();
        await this.supabase.admin.from('person_summaries').upsert({
          user_id: subjectRef,
          summary_text: text,
          maybe_stale: false,
          updated_at: new Date().toISOString()
        });
        return;
      }
      case 'module_notes': {
        const notes = (value as { notes?: unknown })?.notes;
        const moduleKey =
          typeof payload.module_key === 'string' ? payload.module_key : 'unknown';
        await this.supabase.admin.from('module_moderator_notes').upsert({
          user_id: subjectRef,
          module_key: moduleKey,
          notes: (notes as Json) ?? [],
          updated_at: new Date().toISOString()
        });
        return;
      }
      case 'freshness': {
        const obj = value as { attribute_id?: string; question?: string };
        if (!obj?.attribute_id || !obj?.question) return;
        await this.supabase.admin.from('freshness_prompts').upsert({
          user_id: subjectRef,
          attribute_id: obj.attribute_id,
          question: obj.question,
          created_at: new Date().toISOString(),
          answered_at: null
        });
        return;
      }
      case 'transcription':
      case 'voice_captions': {
        const text = (value as { text?: string })?.text;
        if (!text) return;
        const storyId =
          typeof payload.story_id === 'string' ? payload.story_id : null;
        if (storyId) {
          await this.supabase.admin
            .from('stories')
            .update({ transcript: text })
            .eq('id', storyId)
            .eq('author_id', subjectRef);
        }
        return;
      }
      case 'quiz_moderator': {
        // Confidence is applied by QuizService when it reads the done job /
        // or stored on the response row if present. Persist on ai_jobs.result.
        return;
      }
      default:
        return;
    }
  }

  private async enqueueWeekFromDays(authorId: string): Promise<void> {
    const weekStart = mondayOf(new Date());
    const { data: days } = await this.supabase.admin
      .from('day_summaries')
      .select('date, text')
      .eq('author_id', authorId)
      .gte('date', weekStart);
    const map: Record<string, string> = {};
    for (const row of days ?? []) {
      if (row.text) map[row.date] = row.text;
    }
    if (!Object.keys(map).length) return;

    // Insert the week job directly (avoid circular DI with AiJobsService).
    const { contentHash, weekSummary } = await import('@bridger/ai');
    const payload = {
      subject_ref: authorId,
      week_start: weekStart,
      user_prompt: weekSummary.buildUser({ days: map }),
      grounding_source: Object.values(map).join('\n')
    };
    await this.supabase.admin.from('ai_jobs').insert({
      job: 'week_summary',
      subject_ref: authorId,
      content_hash: contentHash(payload),
      payload_json: payload as Json,
      status: 'pending'
    });
  }
}

function mondayOf(d: Date): string {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = x.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  x.setUTCDate(x.getUTCDate() + diff);
  return x.toISOString().slice(0, 10);
}

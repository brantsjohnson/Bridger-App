// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny admin helpers for the AI layer: list job configs, flip kill switches,
// see cost totals, and list dead-letter queue rows. Full admin UI comes later.
// ============================================
import { Injectable } from '@nestjs/common';
import type { JobName } from '@bridger/ai';
import { NestAiConfigStore } from './ai-config.store';
import { AiJobsService } from './ai-jobs.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class AiOpsService {
  constructor(
    private readonly configStore: NestAiConfigStore,
    private readonly supabase: SupabaseService,
    private readonly aiJobs: AiJobsService
  ) {}

  listConfigs() {
    return this.configStore.listConfigs();
  }

  setEnabled(job: JobName, enabled: boolean) {
    return this.configStore.setEnabled(job, enabled);
  }

  async costSummary() {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { data, error } = await this.supabase.admin
      .from('ai_job_cost_log')
      .select('job, estimated_usd')
      .gte('created_at', start.toISOString());
    if (error) throw error;
    const byJob: Record<string, number> = {};
    for (const row of data ?? []) {
      byJob[row.job] = (byJob[row.job] ?? 0) + (row.estimated_usd ?? 0);
    }
    return {
      monthStart: start.toISOString(),
      byJob,
      totalUsd: Object.values(byJob).reduce((a, b) => a + b, 0)
    };
  }

  async listDeadLetters(limit = 50) {
    const { data, error } = await this.supabase.admin
      .from('ai_jobs')
      .select('id, job, subject_ref, attempts, last_error, created_at, finished_at')
      .eq('status', 'dead')
      .order('finished_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data ?? [];
  }

  /**
   * Weekly freshness batch: for each discoverable user with maybe_stale
   * summaries, enqueue one freshness job. Surfaces hide if the job fails.
   */
  async enqueueFreshnessBatch(limit = 100): Promise<{ enqueued: number }> {
    const { data: stale } = await this.supabase.admin
      .from('person_summaries')
      .select('user_id')
      .eq('maybe_stale', true)
      .limit(limit);

    let enqueued = 0;
    for (const row of stale ?? []) {
      const { data: attrs } = await this.supabase.admin
        .from('attributes')
        .select('id, key, value')
        .eq('owner_id', row.user_id)
        .eq('matchable', true)
        .limit(20);
      if (!attrs?.length) continue;
      await this.aiJobs.enqueueFreshness({
        userId: row.user_id,
        staleCandidates: attrs.map((a) => ({
          attribute_id: a.id,
          key: a.key,
          value_text: JSON.stringify(a.value)
        }))
      });
      enqueued += 1;
    }
    return { enqueued };
  }
}

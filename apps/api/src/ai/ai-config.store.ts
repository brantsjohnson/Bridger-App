// ============================================
// WHAT THIS FILE DOES (plain English):
// Loads and updates ai_config rows from Supabase, and sums this month's spend
// from the cost log so the gateway can kill-switch a job when the budget is up.
// ============================================
import { Injectable } from '@nestjs/common';
import {
  type AiConfigStore,
  type AiJobConfig,
  type JobName,
  configFromRegistry
} from '@bridger/ai';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class NestAiConfigStore implements AiConfigStore {
  constructor(private readonly supabase: SupabaseService) {}

  async getJobConfig(job: JobName): Promise<AiJobConfig | null> {
    const { data, error } = await this.supabase.admin
      .from('ai_config')
      .select('*')
      .eq('job', job)
      .maybeSingle();
    if (error) throw error;
    if (!data) return configFromRegistry(job);
    return {
      job,
      lane: data.lane as AiJobConfig['lane'],
      modelId: data.model_id,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      timeoutMs: data.timeout_ms,
      schemaId: data.schema_id,
      monthlyBudgetUsd: data.monthly_budget_usd,
      enabled: data.enabled
    };
  }

  async getMonthSpendUsd(job: JobName): Promise<number> {
    const start = new Date();
    start.setUTCDate(1);
    start.setUTCHours(0, 0, 0, 0);
    const { data, error } = await this.supabase.admin
      .from('ai_job_cost_log')
      .select('estimated_usd')
      .eq('job', job)
      .gte('created_at', start.toISOString());
    if (error) throw error;
    return (data ?? []).reduce(
      (sum, row) => sum + (row.estimated_usd ?? 0),
      0
    );
  }

  async disableJob(job: JobName, reason: string): Promise<void> {
    // Kill switch: row update, not a deploy.
    await this.supabase.admin
      .from('ai_config')
      .update({ enabled: false })
      .eq('job', job);
    // eslint-disable-next-line no-console
    console.warn(`[ai] disabled job=${job} reason=${reason}`);
  }

  async listConfigs(): Promise<AiJobConfig[]> {
    const { data, error } = await this.supabase.admin
      .from('ai_config')
      .select('*')
      .order('job');
    if (error) throw error;
    return (data ?? []).map((row) => ({
      job: row.job as JobName,
      lane: row.lane as AiJobConfig['lane'],
      modelId: row.model_id,
      temperature: row.temperature,
      maxTokens: row.max_tokens,
      timeoutMs: row.timeout_ms,
      schemaId: row.schema_id,
      monthlyBudgetUsd: row.monthly_budget_usd,
      enabled: row.enabled
    }));
  }

  async setEnabled(job: JobName, enabled: boolean): Promise<AiJobConfig> {
    const { data, error } = await this.supabase.admin
      .from('ai_config')
      .update({ enabled })
      .eq('job', job)
      .select('*')
      .single();
    if (error) throw error;
    return {
      job: data.job as JobName,
      lane: data.lane as AiJobConfig['lane'],
      modelId: data.model_id,
      temperature: data.temperature,
      maxTokens: data.max_tokens,
      timeoutMs: data.timeout_ms,
      schemaId: data.schema_id,
      monthlyBudgetUsd: data.monthly_budget_usd,
      enabled: data.enabled
    };
  }
}

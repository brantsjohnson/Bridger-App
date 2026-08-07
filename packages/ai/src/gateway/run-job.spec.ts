// ============================================
// WHAT THIS FILE DOES (plain English):
// Proves the gateway fails silent when a job is disabled, and never calls the
// provider when the scrubber rejects the payload.
// ============================================
import { describe, expect, it, vi } from 'vitest';
import { runJob, type AiConfigStore, type AiJobConfig } from './index';
import { configFromRegistry } from './config';

function storeWith(overrides: Partial<AiJobConfig>): AiConfigStore {
  return {
    async getJobConfig(job) {
      return { ...configFromRegistry(job), ...overrides, job };
    },
    async getMonthSpendUsd() {
      return 0;
    },
    async disableJob() {}
  };
}

describe('runJob', () => {
  it('returns disabled without calling the provider', async () => {
    const callAnthropicFn = vi.fn();
    const result = await runJob(
      {
        job: 'day_summary',
        subjectRef: '00000000-0000-4000-8000-000000000001',
        payload: {
          subject_ref: '00000000-0000-4000-8000-000000000001',
          user_prompt: 'Went climbing.'
        }
      },
      {
        configStore: storeWith({ enabled: false }),
        secrets: { anthropicApiKey: 'test-key' },
        callAnthropicFn
      }
    );
    expect(result.status).toBe('disabled');
    expect(callAnthropicFn).not.toHaveBeenCalled();
  });

  it('fails silent on scrub reject without calling provider', async () => {
    const callAnthropicFn = vi.fn();
    const result = await runJob(
      {
        job: 'day_summary',
        subjectRef: '00000000-0000-4000-8000-000000000001',
        payload: {
          subject_ref: '00000000-0000-4000-8000-000000000001',
          email: 'leak@example.com'
        }
      },
      {
        configStore: storeWith({ enabled: true }),
        secrets: { anthropicApiKey: 'test-key' },
        callAnthropicFn
      }
    );
    expect(result.status).toBe('fail_silent');
    if (result.status === 'fail_silent') {
      expect(result.reason).toMatch(/scrub_rejected/);
    }
    expect(callAnthropicFn).not.toHaveBeenCalled();
  });

  it('returns no_llm for recap_podcast', async () => {
    const result = await runJob(
      {
        job: 'recap_podcast',
        subjectRef: '00000000-0000-4000-8000-000000000001',
        payload: { subject_ref: '00000000-0000-4000-8000-000000000001' }
      },
      { secrets: {} }
    );
    expect(result.status).toBe('no_llm');
  });
});

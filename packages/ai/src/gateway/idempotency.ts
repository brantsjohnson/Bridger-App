// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds a stable fingerprint for a job so a retried queue message cannot
// spend twice or write twice. Key = (job, subject, content-hash).
// ============================================
import { createHash } from 'node:crypto';
import type { JobName } from '../jobs/types';

export function contentHash(payload: unknown): string {
  const json = stableStringify(payload);
  return createHash('sha256').update(json).digest('hex').slice(0, 32);
}

export function idempotencyKey(
  job: JobName,
  subjectRef: string,
  payload: unknown
): string {
  return `${job}:${subjectRef}:${contentHash(payload)}`;
}

/** Sort object keys so the same content always hashes the same way. */
function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stableStringify(v)).join(',')}]`;
  }
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return `{${keys.map((k) => `${JSON.stringify(k)}:${stableStringify(obj[k])}`).join(',')}}`;
}

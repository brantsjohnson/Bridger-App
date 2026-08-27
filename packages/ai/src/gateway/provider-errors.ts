// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns messy Anthropic/OpenAI errors into short kinds we can act on:
// rate limit, billing hard limit, or other. Never stores prompt content.
// ============================================

export type ProviderErrorKind = 'rate_limit' | 'billing' | 'other';

export interface ClassifiedProviderError {
  kind: ProviderErrorKind;
  status?: number;
  /** Short safe detail for ops alerts (no secrets, no prompts). */
  detail: string;
}

/** Guess whether a thrown SDK/HTTP error is a 429 or a billing wall. */
export function classifyProviderError(err: unknown): ClassifiedProviderError {
  const status = extractStatus(err);
  const message = err instanceof Error ? err.message : String(err ?? '');
  const lower = message.toLowerCase();

  if (
    status === 429 ||
    lower.includes('rate_limit') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests')
  ) {
    return {
      kind: 'rate_limit',
      status: status ?? 429,
      detail: 'Vendor rate limit (429).'
    };
  }

  if (
    status === 402 ||
    lower.includes('insufficient') ||
    lower.includes('credit') ||
    lower.includes('billing') ||
    lower.includes('payment required') ||
    lower.includes('spend limit') ||
    lower.includes('hard limit')
  ) {
    return {
      kind: 'billing',
      status: status ?? undefined,
      detail: 'Vendor billing or hard-limit error.'
    };
  }

  return {
    kind: 'other',
    status: status ?? undefined,
    detail: 'Vendor provider error.'
  };
}

function extractStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const o = err as { status?: number; statusCode?: number; error?: { status?: number } };
  if (typeof o.status === 'number') return o.status;
  if (typeof o.statusCode === 'number') return o.statusCode;
  if (typeof o.error?.status === 'number') return o.error.status;
  return undefined;
}

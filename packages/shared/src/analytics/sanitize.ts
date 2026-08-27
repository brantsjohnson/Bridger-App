// ============================================
// WHAT THIS FILE DOES (plain English):
// Last-chance filter before an analytics event leaves the device. It drops
// keys that look like names, emails, phones, or free text, so a slip in a
// screen cannot leak private content into PostHog.
// ============================================
import type { AnalyticsBaseProps } from './types';

/** Keys we never send, even if a screen passes them by accident. */
const BLOCKED_KEY =
  /^(email|name|full_name|display_name|phone|phone_number|message|caption|body|text|title|note|query|transcript|password|token|secret|address)$/i;

/** Keys that contain these words are also dropped (e.g. user_email). */
const BLOCKED_SUBSTRING =
  /email|phone|message|caption|transcript|password|token|secret|display_name/;

const EMAIL_LIKE = /[^@\s]+@[^@\s]+\.[^@\s]+/;

function looksLikeEmail(value: string): boolean {
  return EMAIL_LIKE.test(value);
}

/**
 * Keep only safe snake_case properties. Unknown objects are dropped.
 * Strings that look like emails are dropped. Long strings are clipped.
 */
export function sanitizeAnalyticsProps(
  props: AnalyticsBaseProps
): AnalyticsBaseProps {
  const out: AnalyticsBaseProps = {};
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null) continue;
    if (BLOCKED_KEY.test(key) || BLOCKED_SUBSTRING.test(key)) continue;
    if (typeof value === 'boolean' || typeof value === 'number') {
      out[key] = value;
      continue;
    }
    if (typeof value === 'string') {
      if (looksLikeEmail(value)) continue;
      out[key] = value.length > 120 ? value.slice(0, 120) : value;
    }
  }
  return out;
}

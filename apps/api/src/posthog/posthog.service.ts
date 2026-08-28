// ============================================
// WHAT THIS FILE DOES (plain English):
// Server-side PostHog helper. The app captures most events itself. This file
// (1) checks that person-delete credentials work, (2) erases a person's
// PostHog record when they opt out or we delete their account, and (3) can
// capture a few confirmed product events from webhooks (e.g. coop_renewed).
// Never logs API keys, emails, receipts, or card data.
// ============================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AnalyticsProductEvent } from '@bridger/shared';

const DEFAULT_INGEST = 'https://us.i.posthog.com';

/** Fetch with a time limit. Avoids AbortSignal.timeout type clashes in this repo. */
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  ms: number
): Promise<Response> {
  return Promise.race([
    fetch(url, init),
    new Promise<Response>((_, reject) => {
      setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    })
  ]);
}

/** Map the public ingest host to the private REST API host. */
export function apiHostFromIngestHost(host: string): string {
  const trimmed = host.replace(/\/$/, '');
  try {
    const url = trimmed.includes('://') ? trimmed : `https://${trimmed}`;
    const hostname = new URL(url).hostname;
    if (hostname.endsWith('eu.posthog.com') || hostname.includes('eu.i.posthog')) {
      return 'https://eu.posthog.com';
    }
    if (hostname.endsWith('posthog.com')) {
      return 'https://us.posthog.com';
    }
  } catch {
    // Self-hosted or odd URL: use the same host for REST.
  }
  return trimmed;
}

@Injectable()
export class PosthogService {
  private readonly log = new Logger(PosthogService.name);

  constructor(private readonly config: ConfigService) {}

  // THIS SECTION DOES: read env without ever echoing secrets.
  ingestHost(): string {
    const host = this.config.get<string>('POSTHOG_HOST')?.trim();
    return (host || DEFAULT_INGEST).replace(/\/$/, '');
  }

  apiHost(): string {
    const explicit = this.config.get<string>('POSTHOG_API_HOST')?.trim();
    if (explicit) return explicit.replace(/\/$/, '');
    return apiHostFromIngestHost(this.ingestHost());
  }

  projectId(): string {
    return (this.config.get<string>('POSTHOG_PROJECT_ID') ?? '').trim();
  }

  private personalKey(): string {
    return (this.config.get<string>('POSTHOG_PERSONAL_API_KEY') ?? '').trim();
  }

  /** Public project key (phc_…) used for server-side capture. Never a personal key. */
  private projectApiKey(): string {
    return (this.config.get<string>('POSTHOG_PROJECT_API_KEY') ?? '').trim();
  }

  isConfigured(): boolean {
    return Boolean(this.projectId() && this.personalKey());
  }

  /** True when we can send product events from webhooks. */
  canCapture(): boolean {
    return Boolean(this.projectApiKey());
  }

  // THIS SECTION DOES: a short live probe for the admin health page.
  async healthCheck(): Promise<{
    status: 'ok' | 'warn' | 'error' | 'skip';
    detail: string;
    kind: 'config' | 'live';
  }> {
    if (!this.isConfigured()) {
      return {
        status: 'warn',
        kind: 'config',
        detail:
          'POSTHOG_PERSONAL_API_KEY or POSTHOG_PROJECT_ID is missing. The app can still capture if it has a project key; person purge is off.'
      };
    }
    try {
      const res = await fetchWithTimeout(
        `${this.apiHost()}/api/projects/${this.projectId()}/`,
        { headers: { Authorization: `Bearer ${this.personalKey()}` } },
        4000
      );
      if (!res.ok) {
        return {
          status: 'error',
          kind: 'live',
          detail: `Project probe failed (HTTP ${res.status}).`
        };
      }
      return {
        status: 'ok',
        kind: 'live',
        detail: 'Configured; project API probe succeeded.'
      };
    } catch (e) {
      this.log.warn(`PostHog health failed: ${String(e)}`);
      return {
        status: 'error',
        kind: 'live',
        detail: 'Could not reach the PostHog API host.'
      };
    }
  }

  /**
   * Capture a named product event for an opaque Bridger user id.
   * Used by payment webhooks (renew / expire). Missing project key is a quiet
   * no-op so webhooks still succeed when analytics is not wired on the server.
   * PRIVACY: distinct_id is the opaque user uuid only. Never pass email, name,
   * receipt, or card data in properties.
   */
  async captureProduct(
    distinctId: string,
    event: AnalyticsProductEvent,
    properties: Record<string, string | number | boolean | null | undefined> = {}
  ): Promise<void> {
    const apiKey = this.projectApiKey();
    const id = distinctId.trim();
    if (!apiKey || !id) return;

    // Strip undefined and anything that looks like content / PII keys.
    const safe: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(properties)) {
      if (v === undefined) continue;
      const key = k.toLowerCase();
      if (
        key.includes('email') ||
        key.includes('name') ||
        key.includes('receipt') ||
        key.includes('token') ||
        key.includes('card') ||
        key.includes('phone')
      ) {
        continue;
      }
      safe[k] = v;
    }

    try {
      const res = await fetchWithTimeout(
        `${this.ingestHost()}/capture/`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: apiKey,
            event,
            distinct_id: id,
            properties: {
              ...safe,
              $lib: 'bridger-api',
              platform: 'server'
            }
          })
        },
        4000
      );
      if (!res.ok) {
        this.log.warn(`PostHog capture HTTP ${res.status} for ${event}`);
      }
    } catch (e) {
      this.log.warn(`PostHog capture failed for ${event}: ${String(e)}`);
    }
  }

  /**
   * Erase this opaque user id from PostHog (person + events).
   * Missing config is a no-op so opt-out still works locally.
   */
  async purgePerson(distinctId: string): Promise<{ purged: boolean; detail: string }> {
    if (!this.isConfigured()) {
      return { purged: false, detail: 'not_configured' };
    }
    const id = distinctId.trim();
    if (!id) return { purged: false, detail: 'missing_id' };

    try {
      const res = await fetchWithTimeout(
        `${this.apiHost()}/api/projects/${this.projectId()}/persons/bulk_delete/`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.personalKey()}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ distinct_ids: [id], delete_events: true })
        },
        8000
      );
      if (res.ok || res.status === 204 || res.status === 404) {
        return { purged: true, detail: 'ok' };
      }
      this.log.warn(`PostHog purge HTTP ${res.status}`);
      return { purged: false, detail: `http_${res.status}` };
    } catch (e) {
      this.log.warn(`PostHog purge failed: ${String(e)}`);
      return { purged: false, detail: 'network' };
    }
  }
}

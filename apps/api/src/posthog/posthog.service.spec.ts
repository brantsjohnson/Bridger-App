// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that we pick the right PostHog REST host from the public ingest URL.
// ============================================
import { apiHostFromIngestHost } from './posthog.service';

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(msg);
}

assert(
  apiHostFromIngestHost('https://us.i.posthog.com') === 'https://us.posthog.com',
  'US ingest maps to US API'
);
assert(
  apiHostFromIngestHost('https://eu.i.posthog.com/') === 'https://eu.posthog.com',
  'EU ingest maps to EU API'
);
assert(
  apiHostFromIngestHost('https://analytics.example.com') ===
    'https://analytics.example.com',
  'self-host keeps the same host'
);

console.log('posthog.service.spec.ts: ok');

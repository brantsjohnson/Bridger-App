// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that vault JSON fields land in env the way we want: empty App Runner
// slots get filled, real laptop values are never overwritten, and we never
// treat a blank string as "already set."
// ============================================
import assert from 'node:assert/strict';
import { mergeVaultIntoEnv } from './load-server-secret';

// THIS SECTION DOES: a blank env var must lose to a real vault value.
{
  const env: NodeJS.ProcessEnv = { APPLE_MUSIC_PRIVATE_KEY: '' };
  const out = mergeVaultIntoEnv(
    { APPLE_MUSIC_PRIVATE_KEY: '-----BEGIN PRIVATE KEY-----\\nABC\\n-----END PRIVATE KEY-----' },
    env
  );
  assert.equal(out.filled.includes('APPLE_MUSIC_PRIVATE_KEY'), true);
  assert.match(env.APPLE_MUSIC_PRIVATE_KEY ?? '', /BEGIN PRIVATE KEY/);
  assert.match(env.APPLE_MUSIC_PRIVATE_KEY ?? '', /\nABC\n/);
}

// THIS SECTION DOES: a real env value must win over the vault (local .env).
{
  const env: NodeJS.ProcessEnv = { STRIPE_SECRET_KEY: 'sk_test_local' };
  const out = mergeVaultIntoEnv({ STRIPE_SECRET_KEY: 'sk_live_vault' }, env);
  assert.equal(env.STRIPE_SECRET_KEY, 'sk_test_local');
  assert.equal(out.skippedExisting.includes('STRIPE_SECRET_KEY'), true);
}

// THIS SECTION DOES: missing keys in the vault are listed as empty, not filled.
{
  const env: NodeJS.ProcessEnv = {};
  const out = mergeVaultIntoEnv({ RESEND_API_KEY: '   ', _unused: 'x' }, env);
  assert.equal(out.empty.includes('RESEND_API_KEY'), true);
  assert.equal(out.filled.includes('_unused'), false);
}

console.log('load-server-secret.spec.ts passed');

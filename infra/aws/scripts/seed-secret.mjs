// ============================================
// WHAT THIS FILE DOES (plain English):
// Fills the AWS secret vault with the real server keys, reading them from your
// local apps/api/.env. It only WRITES to AWS (it never reads or prints secret
// values), and it hands the values to the AWS CLI through a temporary file so
// they never show up in the command line or logs.
//
// Run this AFTER deploying the foundation stack and BEFORE deploying the API:
//   node infra/aws/scripts/seed-secret.mjs
// ============================================
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SECRET_ID = 'bridger/api/server';
const REGION = 'us-east-1';

// The exact set of fields the API expects (matches the CDK secret template).
const KEYS = [
  'SUPABASE_URL',
  'SUPABASE_SECRET_KEY',
  'DATABASE_URL',
  'ANTHROPIC_API_KEY',
  'OPENAI_API_KEY',
  'RESEND_API_KEY',
  'COOP_IDEA_REVIEW_EMAIL',
  'COOP_ADMIN_USERNAMES',
  'COOP_ADMIN_EMAILS',
  'ADMIN_API_KEY',
  'ADMIN_PASSWORD',
  'ADMIN_JWT_SECRET',
  'EMAIL_HMAC_KEY',
  'EMAIL_ENCRYPTION_KEY'
];

// --- Read apps/api/.env into a simple key -> value map (no printing) ---
const envPath = join(process.cwd(), 'apps', 'api', '.env');
const raw = readFileSync(envPath, 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

// --- Build the JSON the secret should hold (missing keys become empty) ---
const payload = {};
for (const k of KEYS) payload[k] = env[k] ?? '';

// --- Write to a temp file, push to AWS, then delete the temp file ---
const tmp = join(tmpdir(), `bridger-secret-${Date.now()}.json`);
writeFileSync(tmp, JSON.stringify(payload), { mode: 0o600 });
try {
  execFileSync(
    'aws',
    ['secretsmanager', 'put-secret-value', '--secret-id', SECRET_ID, '--secret-string', `file://${tmp}`, '--region', REGION],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  );
  const filled = KEYS.filter((k) => (env[k] ?? '') !== '').length;
  console.log(`OK: updated ${SECRET_ID} in ${REGION}. ${filled}/${KEYS.length} fields have values.`);
} finally {
  rmSync(tmp, { force: true });
}

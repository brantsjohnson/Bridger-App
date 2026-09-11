// ============================================
// WHAT THIS FILE DOES (plain English):
// Updates the AWS secret vault from apps/api/.env WITHOUT wiping keys that
// already live only in AWS (live Stripe, the MusicKit .p8, etc.).
//
// Rules:
//   - Never print secret values.
//   - Never replace a non-empty AWS field with a blank or a different local value.
//   - If APPLE_MUSIC_PRIVATE_KEY is empty in AWS, fill it from the local .p8 path.
//   - Add any new field names so App Runner / Nest can see them.
//
// Run from the repo root:
//   node infra/aws/scripts/seed-secret.mjs
// ============================================
import { existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(HERE, '..', '..', '..');
const KEYS_FILE = join(HERE, '..', 'server-secret-keys.json');
const SECRET_ID = 'bridger/api/server';
const REGION = 'us-east-1';

const catalog = JSON.parse(readFileSync(KEYS_FILE, 'utf8'));
const KEYS = catalog.keys;

// --- Read apps/api/.env into a map (no printing) ---
const envPath = join(REPO_ROOT, 'apps', 'api', '.env');
const raw = readFileSync(envPath, 'utf8');
const env = {};
for (const line of raw.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eq = trimmed.indexOf('=');
  if (eq === -1) continue;
  env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
}

// THIS SECTION DOES: turn the local MusicKit file into PEM text if needed.
function localAppleMusicPem() {
  const inline = env.APPLE_MUSIC_PRIVATE_KEY ?? '';
  if (inline.includes('BEGIN PRIVATE KEY')) {
    return inline.includes('\\n') ? inline.replace(/\\n/g, '\n') : inline;
  }
  const path = env.APPLE_MUSIC_PRIVATE_KEY_PATH ?? '';
  if (path && existsSync(path)) {
    return readFileSync(path, 'utf8');
  }
  return '';
}

// THIS SECTION DOES: read the current vault. Values stay in this process only.
function currentVault() {
  try {
    const out = execFileSync(
      'aws',
      [
        'secretsmanager',
        'get-secret-value',
        '--secret-id',
        SECRET_ID,
        '--region',
        REGION,
        '--query',
        'SecretString',
        '--output',
        'text'
      ],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }
    );
    return JSON.parse(out);
  } catch {
    return {};
  }
}

function isFilled(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

const existing = currentVault();
const payload = { ...existing };
const added = [];
const filledFromLocal = [];
const keptAws = [];

for (const key of KEYS) {
  if (!Object.prototype.hasOwnProperty.call(payload, key)) {
    payload[key] = '';
    added.push(key);
  }
  if (isFilled(payload[key])) {
    keptAws.push(key);
    continue;
  }
  let next = env[key] ?? '';
  if (key === 'APPLE_MUSIC_PRIVATE_KEY' && !isFilled(next)) {
    next = localAppleMusicPem();
  }
  if (isFilled(next)) {
    payload[key] = next;
    filledFromLocal.push(key);
  }
}

const tmp = join(tmpdir(), `bridger-secret-${Date.now()}.json`);
writeFileSync(tmp, JSON.stringify(payload), { mode: 0o600 });
try {
  execFileSync(
    'aws',
    [
      'secretsmanager',
      'put-secret-value',
      '--secret-id',
      SECRET_ID,
      '--secret-string',
      `file://${tmp}`,
      '--region',
      REGION
    ],
    { stdio: ['ignore', 'ignore', 'inherit'] }
  );
  const filled = KEYS.filter((k) => isFilled(payload[k])).length;
  console.log(
    `OK: merged ${SECRET_ID} in ${REGION}. ${filled}/${KEYS.length} fields have values.`
  );
  console.log(`kept_aws=${keptAws.length} filled_from_local=${filledFromLocal.length} new_fields=${added.length}`);
  if (added.length) console.log(`new_fields: ${added.join(', ')}`);
  if (filledFromLocal.length) console.log(`filled_from_local: ${filledFromLocal.join(', ')}`);
} finally {
  rmSync(tmp, { force: true });
}

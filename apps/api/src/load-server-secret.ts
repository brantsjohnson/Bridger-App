// ============================================
// WHAT THIS FILE DOES (plain English):
// Before Nest starts, copy every field from the AWS secret vault
// (bridger/api/server) into process.env. App Runner only injects a short
// allow-list. Keys you add in the vault (Stripe, the MusicKit .p8, RevenueCat)
// were sitting there unused. This reads the whole JSON so they actually get used.
//
// SECURITY: never logs secret values. Key names only.
// Local laptop: skip this if BRIDGER_SERVER_SECRET_NAME is unset (use .env).
// ============================================
import {
  GetSecretValueCommand,
  SecretsManagerClient
} from '@aws-sdk/client-secrets-manager';

export type VaultLoadStatus = {
  attempted: boolean;
  loaded: boolean;
  /** JSON field names that were copied into empty env slots. Never values. */
  filled: string[];
  /** JSON field names that were present but empty. Never values. */
  empty: string[];
  /** Env vars that already had a value, so the vault did not overwrite them. */
  skippedExisting: string[];
  error?: string;
};

const STATUS_ENV = 'BRIDGER_VAULT_STATUS_JSON';

/** Read the last vault-load summary (key names only). */
export function readVaultLoadStatus(): VaultLoadStatus | null {
  const raw = process.env[STATUS_ENV];
  if (!raw) return null;
  try {
    return JSON.parse(raw) as VaultLoadStatus;
  } catch {
    return null;
  }
}

/**
 * THIS SECTION DOES: copy vault fields into env. A blank App Runner inject
 * (empty string) does not count as "already set," so a real value in the
 * JSON can still win. A non-empty env var always wins (local .env / explicit).
 */
export function mergeVaultIntoEnv(
  vault: Record<string, unknown>,
  env: NodeJS.ProcessEnv
): Omit<VaultLoadStatus, 'attempted' | 'loaded' | 'error'> {
  const filled: string[] = [];
  const empty: string[] = [];
  const skippedExisting: string[] = [];

  for (const [key, raw] of Object.entries(vault)) {
    if (key === '_unused') continue;
    if (typeof raw !== 'string') {
      if (raw == null || raw === '') empty.push(key);
      continue;
    }
    const value = raw.trim();
    if (!value) {
      empty.push(key);
      continue;
    }
    const already = env[key]?.trim();
    if (already) {
      skippedExisting.push(key);
      continue;
    }
    // Keep literal \n in PEMs. apple-music-jwt turns those into real newlines.
    env[key] = raw.includes('\\n') && raw.includes('BEGIN')
      ? raw.replace(/\\n/g, '\n')
      : raw;
    filled.push(key);
  }

  return { filled, empty, skippedExisting };
}

/** THIS SECTION DOES: pull the vault from AWS and merge it, or no-op on a laptop. */
export async function loadServerSecretIntoEnv(): Promise<VaultLoadStatus> {
  const secretId = (
    process.env.BRIDGER_SERVER_SECRET_NAME ??
    process.env.AWS_SECRET_NAME ??
    ''
  ).trim();

  if (!secretId || process.env.BRIDGER_SKIP_SECRET_LOAD === '1') {
    const status: VaultLoadStatus = {
      attempted: false,
      loaded: false,
      filled: [],
      empty: [],
      skippedExisting: []
    };
    process.env[STATUS_ENV] = JSON.stringify(status);
    return status;
  }

  const region = (process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1').trim();

  try {
    const client = new SecretsManagerClient({ region });
    const res = await client.send(
      new GetSecretValueCommand({ SecretId: secretId })
    );
    const text = res.SecretString ?? '';
    if (!text) {
      const status: VaultLoadStatus = {
        attempted: true,
        loaded: false,
        filled: [],
        empty: [],
        skippedExisting: [],
        error: 'vault_empty'
      };
      process.env[STATUS_ENV] = JSON.stringify(status);
      // eslint-disable-next-line no-console
      console.warn('Server vault was empty. Using process env only.');
      return status;
    }

    const parsed = JSON.parse(text) as Record<string, unknown>;
    const merged = mergeVaultIntoEnv(parsed, process.env);
    const status: VaultLoadStatus = {
      attempted: true,
      loaded: true,
      ...merged
    };
    process.env[STATUS_ENV] = JSON.stringify(status);
    // eslint-disable-next-line no-console
    console.log(
      `Server vault loaded. filled=${merged.filled.length} empty=${merged.empty.length} kept=${merged.skippedExisting.length}`
    );
    return status;
  } catch (err) {
    const status: VaultLoadStatus = {
      attempted: true,
      loaded: false,
      filled: [],
      empty: [],
      skippedExisting: [],
      error: 'vault_fetch_failed'
    };
    process.env[STATUS_ENV] = JSON.stringify(status);
    // eslint-disable-next-line no-console
    console.warn(`Server vault load failed (${String(err)}). Using process env only.`);
    return status;
  }
}

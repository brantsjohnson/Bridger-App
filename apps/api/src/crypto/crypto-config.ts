// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that phone HMAC keys and DEK keys are not loaded from the same
// Secrets Manager secret. If both are configured but colocated, Nest must
// fail closed (throw) so we never run with a single-vault breach layout.
// ============================================
import {
  DEK_LOCKBOX_ENV_KEYS,
  ENV_CRYPTO_DEK_SECRET_NAME,
  ENV_PHONE_LOOKUP_HMAC_KEY,
  ENV_PHONE_LOOKUP_SECRET_NAME,
  ENV_SERVER_SECRET_NAME
} from './crypto.constants';

export type CryptoConfigSnapshot = {
  hasDekMaterial: boolean;
  hasPhoneHmacKey: boolean;
  dekSecretName?: string;
  phoneLookupSecretName?: string;
  serverSecretName?: string;
};

/** THIS SECTION DOES: read which crypto-related env slots are filled (never log values). */
export function readCryptoConfigSnapshot(env: NodeJS.ProcessEnv): CryptoConfigSnapshot {
  const hasDekMaterial = DEK_LOCKBOX_ENV_KEYS.some((k) => Boolean(env[k]?.trim()));
  const hasPhoneHmacKey = Boolean(env[ENV_PHONE_LOOKUP_HMAC_KEY]?.trim());
  return {
    hasDekMaterial,
    hasPhoneHmacKey,
    dekSecretName: env[ENV_CRYPTO_DEK_SECRET_NAME]?.trim() || undefined,
    phoneLookupSecretName: env[ENV_PHONE_LOOKUP_SECRET_NAME]?.trim() || undefined,
    serverSecretName: env[ENV_SERVER_SECRET_NAME]?.trim() || undefined
  };
}

/**
 * SECURITY: refuse to boot when DEK material and phone HMAC are both present
 * but would share one lockbox (same secret name, or HMAC only on server vault
 * while DEKs are also on server vault).
 */
export function validateCryptoSecretSeparation(env: NodeJS.ProcessEnv): void {
  const snap = readCryptoConfigSnapshot(env);
  if (!snap.hasDekMaterial || !snap.hasPhoneHmacKey) {
    return;
  }

  const dekSecret =
    snap.dekSecretName || snap.serverSecretName || 'bridger/api/server';
  const phoneSecret = snap.phoneLookupSecretName;

  if (!phoneSecret) {
    throw new Error(
      'Crypto config: PHONE_LOOKUP_HMAC_KEY is set with DEK material but BRIDGER_PHONE_LOOKUP_SECRET_NAME is missing. Use a second lockbox.'
    );
  }

  if (phoneSecret === dekSecret) {
    throw new Error(
      'Crypto config: phone lookup HMAC and DEK material must use different Secrets Manager secrets (fail closed).'
    );
  }

  const server = snap.serverSecretName || 'bridger/api/server';
  if (
    phoneSecret === server &&
    dekSecret === server &&
    snap.hasDekMaterial &&
    snap.hasPhoneHmacKey
  ) {
    throw new Error(
      'Crypto config: PHONE_LOOKUP_HMAC_KEY and DEK keys cannot both load from bridger/api/server. Split lockboxes.'
    );
  }
}

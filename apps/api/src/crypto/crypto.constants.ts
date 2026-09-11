// ============================================
// WHAT THIS FILE DOES (plain English):
// Names the AWS Secrets Manager lockboxes and env vars for Phase 1 crypto.
// DEKs live in one vault; phone HMAC lives in a second vault (never the same JSON).
// ============================================

/** Default Secrets Manager id for KMS-wrapped DEK material (override per env). */
export const DEFAULT_CRYPTO_DEK_SECRET_NAME = 'bridger/api/crypto-dek';

/** Default Secrets Manager id for phone lookup HMAC only (override per env). */
export const DEFAULT_PHONE_LOOKUP_SECRET_NAME = 'bridger/api/phone-lookup';

/** Env var: which Secrets Manager secret holds DEK / KMS config (not the phone HMAC). */
export const ENV_CRYPTO_DEK_SECRET_NAME = 'BRIDGER_CRYPTO_DEK_SECRET_NAME';

/** Env var: which Secrets Manager secret holds PHONE_LOOKUP_HMAC_KEY only. */
export const ENV_PHONE_LOOKUP_SECRET_NAME = 'BRIDGER_PHONE_LOOKUP_SECRET_NAME';

/** Env var: main server vault (must not also hold PHONE_LOOKUP_HMAC_KEY when DEKs are enabled). */
export const ENV_SERVER_SECRET_NAME = 'BRIDGER_SERVER_SECRET_NAME';

/** Inside the DEK lockbox: KMS CMK id for platform PII envelope keys. */
export const ENV_PLATFORM_PII_KMS_KEY_ID = 'PLATFORM_PII_KMS_KEY_ID';

/** Inside the DEK lockbox: optional pre-wrapped platform PII DEK (stub until KMS wiring). */
export const ENV_PLATFORM_PII_DEK_WRAPPED = 'PLATFORM_PII_DEK_WRAPPED';

/** Inside the phone lookup lockbox only: HMAC key for normalized E.164 equality search. */
export const ENV_PHONE_LOOKUP_HMAC_KEY = 'PHONE_LOOKUP_HMAC_KEY';

/** Env keys that count as DEK lockbox material for colocation checks. */
export const DEK_LOCKBOX_ENV_KEYS = [
  ENV_PLATFORM_PII_KMS_KEY_ID,
  ENV_PLATFORM_PII_DEK_WRAPPED
] as const;

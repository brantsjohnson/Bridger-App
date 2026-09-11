// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks split-lockbox validation: same secret name for DEK and HMAC must fail,
// and missing phone lockbox name when both key types are set must fail.
// ============================================
import assert from 'node:assert/strict';
import { validateCryptoSecretSeparation } from '../crypto-config';
import {
  ENV_CRYPTO_DEK_SECRET_NAME,
  ENV_PHONE_LOOKUP_HMAC_KEY,
  ENV_PHONE_LOOKUP_SECRET_NAME,
  ENV_PLATFORM_PII_KMS_KEY_ID
} from '../crypto.constants';

// THIS SECTION DOES: empty crypto env should not throw.
validateCryptoSecretSeparation({});

// THIS SECTION DOES: only DEK material without HMAC should not throw.
validateCryptoSecretSeparation({
  [ENV_PLATFORM_PII_KMS_KEY_ID]: 'arn:aws:kms:us-east-1:123:key/abc'
});

// THIS SECTION DOES: colocated secret names must throw.
assert.throws(() =>
  validateCryptoSecretSeparation({
    [ENV_PLATFORM_PII_KMS_KEY_ID]: 'arn:aws:kms:us-east-1:123:key/abc',
    [ENV_PHONE_LOOKUP_HMAC_KEY]: 'lookup-key-material',
    [ENV_CRYPTO_DEK_SECRET_NAME]: 'bridger/api/crypto-dek',
    [ENV_PHONE_LOOKUP_SECRET_NAME]: 'bridger/api/crypto-dek'
  })
);

// THIS SECTION DOES: both keys without a phone lockbox name must throw.
assert.throws(() =>
  validateCryptoSecretSeparation({
    [ENV_PLATFORM_PII_KMS_KEY_ID]: 'arn:aws:kms:us-east-1:123:key/abc',
    [ENV_PHONE_LOOKUP_HMAC_KEY]: 'lookup-key-material'
  })
);

// THIS SECTION DOES: split lockbox names with both keys should pass.
validateCryptoSecretSeparation({
  [ENV_PLATFORM_PII_KMS_KEY_ID]: 'arn:aws:kms:us-east-1:123:key/abc',
  [ENV_PHONE_LOOKUP_HMAC_KEY]: 'lookup-key-material',
  [ENV_CRYPTO_DEK_SECRET_NAME]: 'bridger/api/crypto-dek',
  [ENV_PHONE_LOOKUP_SECRET_NAME]: 'bridger/api/phone-lookup'
});

console.log('crypto-config.spec.ts: all assertions passed');

// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks that our stub envelope encryptor can lock a string and unlock the same
// string using the fake KMS client (no AWS).
// ============================================
import assert from 'node:assert/strict';
import { EnvelopeEncryptorService } from '../envelope-encryptor.service';
import { FakeKmsClient } from '../fake-kms.client';

async function main(): Promise<void> {
  const kms = new FakeKmsClient('envelope-encryptor-spec-seed');
  const enc = EnvelopeEncryptorService.fromKms(kms, 'alias/bridger-platform-pii', 1);

  const plain = '+15551234567';
  const blob = await enc.encrypt(plain, 'platform_pii');
  assert.equal(blob.keyId, 'platform_pii_dek');
  assert.equal(blob.keyVersion, 1);
  assert.ok(blob.ciphertextB64.length > 10);

  const round = await enc.decrypt(blob, 'platform_pii');
  assert.equal(round, plain);

  await assert.rejects(() => enc.decrypt(blob, 'messages'));

  console.log('envelope-encryptor.spec.ts: all assertions passed');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

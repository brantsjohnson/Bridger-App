// ============================================
// WHAT THIS FILE DOES (plain English):
// Pretends to be AWS KMS for unit tests. Uses a local master key to wrap DEKs
// so encrypt/decrypt roundtrips work without network calls.
// ============================================
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';
import type { KmsClient, KmsGenerateDataKeyResult } from './kms-client.interface';

const WRAP_VERSION = 'fkms1';

function masterKeyFromSeed(seed: string): Buffer {
  return createHash('sha256').update(seed, 'utf8').digest();
}

function wrapKey(dek: Buffer, master: Buffer): Buffer {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', master, iv);
  const enc = Buffer.concat([cipher.update(dek), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([Buffer.from(WRAP_VERSION), iv, tag, enc]);
}

function unwrapKey(blob: Buffer, master: Buffer): Buffer {
  const version = blob.subarray(0, WRAP_VERSION.length).toString('utf8');
  if (version !== WRAP_VERSION) {
    throw new Error('FakeKms: bad wrap version');
  }
  let off = WRAP_VERSION.length;
  const iv = blob.subarray(off, off + 12);
  off += 12;
  const tag = blob.subarray(off, off + 16);
  off += 16;
  const data = blob.subarray(off);
  const decipher = createDecipheriv('aes-256-gcm', master, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

/** Test double for KmsClient. Pass a stable seed per test file. */
export class FakeKmsClient implements KmsClient {
  constructor(private readonly seed: string) {}

  async generateDataKey(keyId: string): Promise<KmsGenerateDataKeyResult> {
    const plaintextKey = randomBytes(32);
    const master = masterKeyFromSeed(this.seed);
    const ciphertextBlob = wrapKey(plaintextKey, master);
    return { plaintextKey, ciphertextBlob, keyId };
  }

  async decrypt(ciphertextBlob: Buffer): Promise<Buffer> {
    const master = masterKeyFromSeed(this.seed);
    return unwrapKey(ciphertextBlob, master);
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Phase 1 stub that encrypts small strings with a DEK from KMS (fake KMS in
// tests). Production cutover will wire real AWS KMS; nothing here writes to DB yet.
// ============================================
import { Injectable } from '@nestjs/common';
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import type { DekPurpose, EnvelopeCiphertext } from './crypto.types';
import type { EnvelopeEncryptor } from './envelope-encryptor.interface';
import type { KmsClient } from './kms-client.interface';

const BLOB_VERSION = 'env1';

function purposeKeyId(purpose: DekPurpose): string {
  switch (purpose) {
    case 'platform_pii':
      return 'platform_pii_dek';
    case 'pending_people':
      return 'pending_people_dek';
    case 'messages':
      return 'messages_dek';
    default:
      return 'unknown_dek';
  }
}

function aesGcmEncrypt(plain: Buffer, dek: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', dek, iv);
  const enc = Buffer.concat([cipher.update(plain), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, tag, enc]);
  return `${BLOB_VERSION}.${packed.toString('base64url')}`;
}

function aesGcmDecrypt(blob: string, dek: Buffer): Buffer {
  const [ver, body] = blob.split('.', 2);
  if (ver !== BLOB_VERSION || !body) {
    throw new Error('Bad envelope ciphertext shape');
  }
  const packed = Buffer.from(body, 'base64url');
  const iv = packed.subarray(0, 12);
  const tag = packed.subarray(12, 28);
  const data = packed.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', dek, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]);
}

export type EnvelopeEncryptorOptions = {
  kms: KmsClient;
  kmsKeyId: string;
  keyVersion: number;
};

/** Stub envelope encryptor; inject KmsClient (FakeKmsClient in tests). */
@Injectable()
export class EnvelopeEncryptorService implements EnvelopeEncryptor {
  private readonly dekCache = new Map<DekPurpose, Buffer>();

  constructor(private readonly options: EnvelopeEncryptorOptions) {}

  static fromKms(kms: KmsClient, kmsKeyId: string, keyVersion = 1): EnvelopeEncryptorService {
    return new EnvelopeEncryptorService({ kms, kmsKeyId, keyVersion });
  }

  private async dekFor(purpose: DekPurpose): Promise<Buffer> {
    const cached = this.dekCache.get(purpose);
    if (cached) return cached;
    const { plaintextKey } = await this.options.kms.generateDataKey(this.options.kmsKeyId);
    this.dekCache.set(purpose, plaintextKey);
    return plaintextKey;
  }

  async encrypt(plaintextUtf8: string, purpose: DekPurpose): Promise<EnvelopeCiphertext> {
    const dek = await this.dekFor(purpose);
    const ciphertextB64 = aesGcmEncrypt(Buffer.from(plaintextUtf8, 'utf8'), dek);
    return {
      ciphertextB64,
      keyId: purposeKeyId(purpose),
      keyVersion: this.options.keyVersion
    };
  }

  async decrypt(envelope: EnvelopeCiphertext, purpose: DekPurpose): Promise<string> {
    const dek = await this.dekFor(purpose);
    if (envelope.keyId !== purposeKeyId(purpose)) {
      throw new Error('Envelope keyId does not match purpose');
    }
    const plain = aesGcmDecrypt(envelope.ciphertextB64, dek);
    return plain.toString('utf8');
  }
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The small contract our real AWS KMS client will implement later. Tests use
// FakeKmsClient instead so we never need AWS in unit tests.
// ============================================

export type KmsGenerateDataKeyResult = {
  plaintextKey: Buffer;
  ciphertextBlob: Buffer;
  keyId: string;
};

/** Wraps and unwraps data encryption keys (envelope encryption at the KMS layer). */
export interface KmsClient {
  generateDataKey(keyId: string): Promise<KmsGenerateDataKeyResult>;
  decrypt(ciphertextBlob: Buffer): Promise<Buffer>;
}

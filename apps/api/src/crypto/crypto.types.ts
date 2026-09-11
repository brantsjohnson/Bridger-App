// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared shapes for Phase 1 envelope encryption (ciphertext blobs and which
// DEK family they belong to). No secrets live here, only types.
// ============================================

/** Which data-encryption-key family protects a field (see ENCRYPTION-AND-ACCESS.md). */
export type DekPurpose = 'platform_pii' | 'pending_people' | 'messages';

/** One encrypted value ready to store in Postgres (parallel to plaintext during cutover). */
export type EnvelopeCiphertext = {
  /** Base64url AES-GCM payload (includes IV + tag in the blob format). */
  ciphertextB64: string;
  /** KMS key id or logical dek id (not a secret). */
  keyId: string;
  /** Rotation version for re-encrypt jobs later. */
  keyVersion: number;
};

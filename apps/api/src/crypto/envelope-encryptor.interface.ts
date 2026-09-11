// ============================================
// WHAT THIS FILE DOES (plain English):
// The contract for locking and unlocking Zone A strings (phones, emails) with
// envelope encryption before they go into Postgres. Implementations use KMS DEKs.
// ============================================
import type { DekPurpose, EnvelopeCiphertext } from './crypto.types';

export interface EnvelopeEncryptor {
  encrypt(plaintextUtf8: string, purpose: DekPurpose): Promise<EnvelopeCiphertext>;
  decrypt(envelope: EnvelopeCiphertext, purpose: DekPurpose): Promise<string>;
}

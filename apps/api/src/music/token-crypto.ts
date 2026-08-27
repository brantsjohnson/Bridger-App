// ============================================
// WHAT THIS FILE DOES (plain English):
// Locks and unlocks music account tokens before they sit in the database.
// Uses AES-256-GCM so a stolen DB row is not a usable Spotify or Apple Music
// credential. SECURITY: key stays in env / Secrets Manager — never in the mobile app.
// ============================================
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

/** Turn any secret string into a 32-byte key (AES-256). */
function keyFromSecret(secret: string): Buffer {
  return createHash('sha256').update(secret, 'utf8').digest();
}

/**
 * Encrypt a token. Stored shape: `v1.<iv_b64>.<tag_b64>.<cipher_b64>`.
 */
export function encryptToken(plain: string, secret: string): string {
  const key = keyFromSecret(secret);
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString('base64url')}.${tag.toString('base64url')}.${enc.toString('base64url')}`;
}

/** Decrypt a token written by encryptToken. */
export function decryptToken(blob: string, secret: string): string {
  const parts = blob.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Bad encrypted token shape');
  }
  const [, ivB64, tagB64, dataB64] = parts;
  const key = keyFromSecret(secret);
  const iv = Buffer.from(ivB64!, 'base64url');
  const tag = Buffer.from(tagB64!, 'base64url');
  const data = Buffer.from(dataB64!, 'base64url');
  const decipher = createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

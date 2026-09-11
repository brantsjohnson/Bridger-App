// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds the short-lived "developer token" Apple Music needs before anyone can
// link their library. Nest signs a JWT with Bridger's MusicKit .p8 key.
// SECURITY: the private key never leaves the server.
// ============================================
import { readFileSync } from 'fs';
import { SignJWT, importPKCS8 } from 'jose';

export type AppleMusicJwtConfig = {
  teamId: string;
  keyId: string;
  /** PKCS#8 PEM string (-----BEGIN PRIVATE KEY----- …). */
  privateKeyPem: string;
  /** Optional MusicKit JS origin allow-list (e.g. https://api.bridger.social). */
  origin?: string;
  /** Token lifetime in seconds (Apple max is ~6 months; we keep it short). */
  ttlSeconds?: number;
};

// THIS SECTION DOES: load the .p8 from a path or an inline env string.
export function loadAppleMusicPrivateKey(opts: {
  path?: string | null;
  inlinePem?: string | null;
}): string {
  const inline = normalizePem(opts.inlinePem);
  if (inline) {
    return inline;
  }
  const path = opts.path?.trim();
  if (!path) {
    throw new Error(
      'Set APPLE_MUSIC_PRIVATE_KEY_PATH or APPLE_MUSIC_PRIVATE_KEY for MusicKit'
    );
  }
  return normalizePem(readFileSync(path, 'utf8'));
}

// THIS SECTION DOES: clean a MusicKit .p8 so extra quotes or \n text still work.
function normalizePem(raw?: string | null): string {
  if (!raw) return '';
  let text = raw.trim();
  if (
    (text.startsWith('"') && text.endsWith('"')) ||
    (text.startsWith("'") && text.endsWith("'"))
  ) {
    text = text.slice(1, -1);
  }
  if (text.includes('\\n')) {
    text = text.replace(/\\n/g, '\n');
  }
  return text.trim();
}

// THIS SECTION DOES: mint a developer JWT Apple's MusicKit will accept.
export async function mintAppleMusicDeveloperToken(
  cfg: AppleMusicJwtConfig
): Promise<{ token: string; expiresAt: Date }> {
  const ttl = cfg.ttlSeconds ?? 12 * 60 * 60; // 12 hours
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = new Date((now + ttl) * 1000);
  const key = await importPKCS8(cfg.privateKeyPem, 'ES256');

  const jwt = new SignJWT(
    cfg.origin
      ? {
          origin: [cfg.origin]
        }
      : {}
  )
    .setProtectedHeader({ alg: 'ES256', kid: cfg.keyId })
    .setIssuer(cfg.teamId)
    .setIssuedAt(now)
    .setExpirationTime(now + ttl);

  const token = await jwt.sign(key);
  return { token, expiresAt };
}

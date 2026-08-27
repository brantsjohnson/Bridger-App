// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny checks that we can lock a Spotify token and unlock the same string.
// Run with: npm test (from apps/api).
// ============================================
import assert from 'node:assert/strict';
import { decryptToken, encryptToken } from './token-crypto';

const secret = 'test-music-token-key';
const plain = 'spotify-refresh-token-example';
const blob = encryptToken(plain, secret);
assert.equal(blob.startsWith('v1.'), true);
assert.equal(decryptToken(blob, secret), plain);

assert.throws(() => decryptToken(blob, 'other-key'));

console.log('token-crypto.spec.ts: all assertions passed');

// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks phone normalization and that the same number always gets the same HMAC
// with the same lookup key (stable for DB equality search later).
// ============================================
import assert from 'node:assert/strict';
import { PhoneHmacLookupService } from '../phone-hmac-lookup.service';

const svc = new PhoneHmacLookupService('test-phone-hmac-key-32-chars-min');

assert.equal(svc.normalizeE164('  +1 (555) 123-4567 '), '+15551234567');

const a = svc.hmacPhone('+15551234567');
const b = svc.hmacPhone('15551234567');
assert.equal(a, b);

const c = svc.hmacPhone('+15559876543');
assert.notEqual(a, c);

console.log('phone-hmac-lookup.spec.ts: all assertions passed');

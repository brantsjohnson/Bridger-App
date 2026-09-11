// ============================================
// WHAT THIS FILE DOES (plain English):
// Builds stable HMAC digests for phone numbers using the separate lookup secret
// (PHONE_LOOKUP_HMAC_KEY). Friend find will query phone_hmac columns later.
// ============================================
import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import type { PhoneHmacLookup } from './phone-hmac-lookup.interface';

@Injectable()
export class PhoneHmacLookupService implements PhoneHmacLookup {
  constructor(private readonly hmacKeyUtf8: string) {
    if (!hmacKeyUtf8.trim()) {
      throw new Error('PhoneHmacLookupService requires PHONE_LOOKUP_HMAC_KEY');
    }
  }

  normalizeE164(phone: string): string {
    const trimmed = phone.trim();
    const digits = trimmed.replace(/[^\d+]/g, '');
    if (digits.startsWith('+')) {
      return `+${digits.slice(1).replace(/\D/g, '')}`;
    }
    const only = digits.replace(/\D/g, '');
    if (!only) {
      throw new Error('Invalid phone: empty after normalization');
    }
    return `+${only}`;
  }

  hmacPhone(normalizedE164: string): string {
    const norm = this.normalizeE164(normalizedE164);
    return createHmac('sha256', this.hmacKeyUtf8).update(norm, 'utf8').digest('base64url');
  }
}

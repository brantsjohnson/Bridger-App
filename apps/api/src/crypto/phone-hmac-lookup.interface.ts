// ============================================
// WHAT THIS FILE DOES (plain English):
// The contract for turning a normalized phone number into a stable HMAC digest
// used for friend find and pending_people merge without storing reversible phones
// in lookup indexes (once cutover ships).
// ============================================

export interface PhoneHmacLookup {
  /** Normalize to E.164-ish form (+ and digits only after normalization rules). */
  normalizeE164(phone: string): string;
  /** Deterministic HMAC for equality search (not reversible to the phone). */
  hmacPhone(normalizedE164: string): string;
}

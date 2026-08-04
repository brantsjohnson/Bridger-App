// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes for Bridger's capped Messages: conversations, text bubbles,
// contact cards, and the 5-per-day limit. Messaging is a bridge to real life,
// not another inbox.
//
// SECURITY / PRIVACY (encryption invariant):
// Message bodies MUST be end-to-end encrypted before they leave the device.
// The server and database store only ciphertext. Bridger staff, admins, and
// support tools must never be able to read plaintext message content. Only the
// two participants hold the keys that can decrypt. Analytics never includes
// message text, phone numbers, or contact-card values.
// ============================================

/** Hard daily send limit per recipient (MESSAGES.md). Tunable later. */
export const DAILY_CAP = 5;

export type ContactFieldKind = 'phone' | 'instagram' | 'email' | 'other';

export type ContactField = {
  id: string;
  kind: ContactFieldKind;
  label: string;
  value: string;
  /** PRIVACY: only enabled fields go out when you tap Share contact */
  enabled: boolean;
};

/** Set up once per user; Share contact posts this into a thread. */
export interface ContactCard {
  userId: string;
  displayName: string;
  emoji: string;
  fields: ContactField[];
}

export type MessageKind = 'text' | 'contactCard' | 'planNudge';

/**
 * One message in a conversation.
 *
 * SECURITY: On the live API, `text` is only present after client-side decrypt.
 * At rest the row holds `ciphertext` (and never plaintext). Demo fixtures keep
 * plaintext for local preview only — never a production pattern.
 */
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: MessageKind;
  /** Plaintext after decrypt on-device — NEVER log, NEVER send to analytics/AI */
  text?: string;
  /**
   * SECURITY: opaque encrypted payload stored server-side. Staff cannot read it.
   * Demo mode leaves this undefined and uses `text` only in memory.
   */
  ciphertext?: string;
  contactCardId?: string;
  /** Optional phone lifted for a tappable affordance after decrypt */
  phone?: string;
  createdAt: string;
  /** false for Share contact and Make a plan — they do not burn a slot */
  countsAgainstCap: boolean;
}

/** Inbox row + open thread state for one friend. */
export interface Conversation {
  id: string;
  /** The other person (you are always the local user) */
  personId: string;
  participantIds: string[];
  lastMessage: string;
  updatedAt: string;
  unread: boolean;
  /** How many of your 5 to them you still have today */
  myLeft: number;
  /** How many of their 5 to you they still have today */
  theirLeft: number;
}

/** Cap ledger: one row per sender → recipient per calendar day. */
export interface DailyCap {
  fromUserId: string;
  toUserId: string;
  date: string;
  used: number;
  limit: number;
}

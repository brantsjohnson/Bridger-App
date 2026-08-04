// ============================================
// WHAT THIS FILE DOES (plain English):
// Everything the Messages tab needs: list conversations, open a thread, send
// a capped text, share your contact card, and nudge Make a plan. Demo mode
// keeps threads and your card in memory for the session. Live mode will call
// the messages API — same function names either way.
//
// SECURITY / PRIVACY (encryption invariant — load-bearing):
// Message bodies are end-to-end encrypted. The live API and database store
// ONLY ciphertext. Bridger staff, admins, support, and logs must never be able
// to read what people write. Decrypt happens only on the two participants'
// devices. Demo mode keeps plaintext in memory for local preview — that is
// NEVER the production pattern. Analytics never includes message text, phone
// numbers, or contact-card values.
// ============================================
import {
  DAILY_CAP,
  trackProduct,
  type ContactCard,
  type Message,
  type Tier
} from '@bridger/shared';
import { isDemoMode } from '../lib/demo';
import { getMe, personById } from './people';
import {
  CONTACT_CARD as FIXTURE_CARD,
  THREADS as FIXTURE_THREADS,
  type DemoThread
} from './fixtures/messages';

export type ThreadBubble = {
  id: string;
  from: 'me' | 'them';
  text: string;
  phone?: string;
  kind: Message['kind'];
  countsAgainstCap: boolean;
};

export type ThreadDetail = {
  id: string;
  personId: string;
  name: string;
  emoji: string;
  accent: DemoThread['accent'];
  myLeft: number;
  theirLeft: number;
  bubbles: ThreadBubble[];
};

export type ThreadRow = {
  id: string;
  personId: string;
  name: string;
  emoji: string;
  accent: DemoThread['accent'];
  preview: string;
  time: string;
  unread: boolean;
  /** Friendship tier — drives the Close / Friends / Acquaintances grouping. */
  tier: Tier;
  /** How many of your 5 daily messages are left with this friend (0 = maxed). */
  myLeft: number;
  /** Who sent the last message — 'them' means the ball is in your court. */
  lastFrom: 'me' | 'them';
};

// --- DEMO STATE: mutates so sending / sharing feels real this session ---
let demoThreads: DemoThread[] = FIXTURE_THREADS.map((t) => ({
  ...t,
  bubbles: t.bubbles.map((b) => ({ ...b }))
}));
let demoCard: ContactCard = {
  ...FIXTURE_CARD,
  fields: FIXTURE_CARD.fields.map((f) => ({ ...f }))
};

function toRow(t: DemoThread): ThreadRow {
  // Look up the friend so the inbox can group by tier. Falls back to 'friend'.
  const person = personById(t.personId);
  // Who spoke last: an empty thread counts as "you" (nothing to answer yet).
  const last = t.bubbles[t.bubbles.length - 1];
  const lastFrom: 'me' | 'them' = last ? last.from : 'me';
  return {
    id: t.id,
    personId: t.personId,
    name: t.name,
    emoji: t.emoji,
    accent: t.accent,
    preview: t.preview,
    time: t.time,
    unread: !!t.unread,
    tier: person.tier ?? 'friend',
    myLeft: t.myLeft,
    lastFrom
  };
}

function toDetail(t: DemoThread): ThreadDetail {
  return {
    id: t.id,
    personId: t.personId,
    name: t.name,
    emoji: t.emoji,
    accent: t.accent,
    myLeft: t.myLeft,
    theirLeft: t.theirLeft,
    bubbles: t.bubbles.map((b) => ({
      id: b.id,
      from: b.from,
      text: b.text,
      phone: b.phone,
      kind: b.kind ?? 'text',
      countsAgainstCap: b.countsAgainstCap !== false && b.kind !== 'contactCard' && b.kind !== 'planNudge'
    }))
  };
}

/** Inbox list (newest feel first — fixture order is fine for demo). */
export async function listThreads(): Promise<ThreadRow[]> {
  if (isDemoMode()) {
    return demoThreads.map(toRow);
  }
  // TODO: GET /messages — responses are ciphertext; decrypt on-device
  return [];
}

/** Open one conversation. */
export async function getThread(threadId: string): Promise<ThreadDetail | null> {
  if (isDemoMode()) {
    const t = demoThreads.find((x) => x.id === threadId);
    return t ? toDetail(t) : null;
  }
  // TODO: GET /messages/:id — decrypt bubbles on-device before returning
  return null;
}

/**
 * Find or create a thread with a connected friend.
 * Used by person/[id] Message and the New-message sheet.
 */
export async function startThreadWith(personId: string): Promise<string> {
  if (isDemoMode()) {
    const existing = demoThreads.find((t) => t.personId === personId);
    if (existing) {
      existing.unread = false;
      return existing.id;
    }
    const person = personById(personId);
    const id = `t-${personId}-${Date.now()}`;
    demoThreads = [
      {
        id,
        personId,
        name: person.name,
        emoji: person.emoji,
        accent: person.accent,
        preview: 'Say hey',
        time: 'now',
        unread: false,
        theirLeft: DAILY_CAP,
        myLeft: DAILY_CAP,
        bubbles: []
      },
      ...demoThreads
    ];
    return id;
  }
  // TODO: POST /messages/start { personId }
  throw new Error('startThreadWith requires the live API outside demo mode');
}

/**
 * Send a text message. Burns one of your 5 for today toward this person.
 * SECURITY: live path encrypts before upload; demo keeps plaintext in memory.
 */
export async function sendMessage(input: {
  threadId: string;
  text: string;
}): Promise<ThreadDetail | null> {
  const text = input.text.trim();
  if (!text) return null;

  if (isDemoMode()) {
    const t = demoThreads.find((x) => x.id === input.threadId);
    if (!t || t.myLeft <= 0) return t ? toDetail(t) : null;

    t.bubbles = [
      ...t.bubbles,
      {
        id: `b-${Date.now()}`,
        from: 'me',
        text,
        kind: 'text',
        countsAgainstCap: true
      }
    ];
    t.myLeft = Math.max(0, t.myLeft - 1);
    t.preview = text;
    t.time = 'now';
    t.unread = false;

    // Product outcome only — never include the message text
    trackProduct('message_sent', { counts_against_cap: true });
    return toDetail(t);
  }

  // TODO: encrypt(text) on-device → POST /messages/:id/send { ciphertext }
  // Server stores ciphertext only. Staff cannot decrypt.
  throw new Error('sendMessage requires the live API outside demo mode');
}

/**
 * Share your contact card into the thread. Does NOT count against the cap.
 * PRIVACY: only enabled fields leave the device.
 */
export async function shareContact(threadId: string): Promise<ThreadDetail | null> {
  if (isDemoMode()) {
    const t = demoThreads.find((x) => x.id === threadId);
    if (!t) return null;
    const enabled = demoCard.fields.filter((f) => f.enabled);
    const summary =
      enabled.length > 0
        ? enabled.map((f) => f.value).join(' · ')
        : 'Shared contact card';
    const phone = enabled.find((f) => f.kind === 'phone')?.value;

    t.bubbles = [
      ...t.bubbles,
      {
        id: `b-card-${Date.now()}`,
        from: 'me',
        text: summary,
        phone,
        kind: 'contactCard',
        countsAgainstCap: false
      }
    ];
    t.preview = 'You shared your contact card';
    t.time = 'now';

    trackProduct('contact_shared', { counts_against_cap: false });
    return toDetail(t);
  }

  // TODO: POST /messages/:id/share-contact — card fields encrypted like messages
  throw new Error('shareContact requires the live API outside demo mode');
}

/**
 * Drop a "let's make a plan" nudge into the thread. Does NOT count against the cap.
 * The UI then opens Touch Grass / Events — this only records the uncounted bubble.
 */
export async function makePlan(threadId: string): Promise<ThreadDetail | null> {
  if (isDemoMode()) {
    const t = demoThreads.find((x) => x.id === threadId);
    if (!t) return null;
    t.bubbles = [
      ...t.bubbles,
      {
        id: `b-plan-${Date.now()}`,
        from: 'me',
        text: "Let's make a plan",
        kind: 'planNudge',
        countsAgainstCap: false
      }
    ];
    t.preview = "Let's make a plan";
    t.time = 'now';
    trackProduct('message_sent', { counts_against_cap: false, method: 'plan' });
    return toDetail(t);
  }
  // TODO: POST /messages/:id/make-plan
  throw new Error('makePlan requires the live API outside demo mode');
}

/** Your once-set contact card. */
export async function getContactCard(): Promise<ContactCard> {
  if (isDemoMode()) {
    const me = getMe();
    return {
      ...demoCard,
      userId: me.id,
      displayName: me.name,
      emoji: me.emoji
    };
  }
  // TODO: GET /messages/contact-card
  const me = getMe();
  return {
    userId: me.id,
    displayName: me.name,
    emoji: me.emoji,
    fields: []
  };
}

/** Save contact-card field toggles / values. */
export async function setContactCard(next: ContactCard): Promise<ContactCard> {
  if (isDemoMode()) {
    demoCard = {
      ...next,
      fields: next.fields.map((f) => ({ ...f }))
    };
    return getContactCard();
  }
  // TODO: PUT /messages/contact-card
  throw new Error('setContactCard requires the live API outside demo mode');
}

export { DAILY_CAP };

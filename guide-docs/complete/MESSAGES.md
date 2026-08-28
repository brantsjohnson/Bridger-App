# Bridger — Messages (spec)

Self-contained. Bridger's messaging is **intentionally limited** — it exists to *start* a connection and then push it into real life, not to be another inbox. Keep UI copy minimal.

Maps to the (now active) `messages` module + `app/(tabs)/messages` tab; entered from the **Messages tab in the floating nav** and from a **friend's profile**.

---

## The philosophy (why it's capped)

You **don't need another inbox.** Messaging is a bridge: enough to say "hey, want to hang?" and swap a **contact card**, not enough to live in DMs. So it's capped, and the first-class action in any thread is **Share contact**.

**Cap: you can send 5 messages to each person per day** (per recipient; tunable). When you're out with someone, the composer locks until tomorrow with a nudge to share your contact card.

There is **no Make a plan** in a thread. Plans live on Events / Touch Grass.

**Double-tap a friend's bubble to heart it.** A heart is a reaction, not a sent message, and never counts against the cap.

Everyone sets up a **contact card** on the Messages list (dropdown below) so sharing it from a thread is one tap.

---

## Screens

### Messages list (Messages tab)
- Title + **Find a friend** (search your friends to start a conversation).
- Conversation rows: avatar, name, last-message snippet, time, unread dot.
- A small standing note: *"5 messages a day — Bridger isn't another inbox."*

### Conversation
- Header: back · avatar · name · **"{n} left today"** chip.
- Text message bubbles (them left, you right). **Text only** — no media inbox (that's what stories are for).
- **Quick action:** **Share contact** (shares your contact card into the thread, not a raw phone-number shortcut).
- **Double-tap** a friend's bubble to heart it. A small heart stays on the bubble. Double-tap again to unheart. This is **not** a sent message.
- Composer with a live **"{n} of 5 left today"** counter + "share your contact card to keep going."
- **At the cap (your side):** composer locks — *"Out of messages today — share your contact card"* — Share contact still works (it does not count against the cap).

### Contact card (set up on Messages)
- On the Messages list, **Your contact card** expands as a dropdown (not a separate screen). Type each value and toggle which fields are on the card (Phone, Instagram, Email, Website, Substack, or Other).
- **Share contact** lives only inside a thread (and the maxed-out prompt). It posts the enabled fields in one tap. Setup never shows a Share contact button.
- A shared contact card bubble shows a green **Contact card** chip with a message icon (not a phone call). Tap expands the fields; a phone field opens Messages (`sms:`), never the dialer.
- This is the whole point of messaging — a fast way to hand someone your real contact info and take it off the app.

### When the other person is maxed out
- The cap is on **sending**, so the two sides are independent. If **you've maxed your 5 to someone**, you can't send more today — but **they can still message you** (their own allotment).
- When you're messaging someone who **can't reply today** (they've used their 5 to you), the thread shows a clear notice — *"{Name}'s used their 5 for today — they can't reply until tomorrow"* — and prompts **"Share your contact instead"** so you two can connect for real rather than hitting a silent wall.

### From a profile
- A friend's profile (`person/[id]`) has a **Message** button that opens/starts the conversation with them.

---

## Rules

- You can message **people you're connected with** (friends). Find-a-friend searches your roster.
- The cap is **per recipient per day** — 5 messages to *each* person; the two directions of a thread are independent (being maxed toward someone doesn't stop them messaging you).
- **Share contact**, **hearts**, and **story-reply mirrors** (`kind: 'storyReply'`) are **not** counted against the 5/day cap. Story replies already "spent" their attention on the story surface (`NOTIFICATIONS.md`). Hearts are reactions only (no new bubble, no vanity count).
- No read receipts, no typing indicators, no "online now," no message counts shown to others — nothing that manufactures inbox pressure.
- The daily count **resets each day**.

### Story replies in the thread

When a friend replies on your story, that reply also appears in your Messages thread with them (same copy as the reply). It looks like a DM so you can keep talking after the story tray, but:

- It does **not** use one of their 5 messages to you.
- Engaging (opening the thread, opening the Home replies row, or replying on the story) clears the matching `story_reply` notification.
- After the story expires, further conversation stays in DMs; the expired story is not reopened.

### SECURITY — end-to-end encryption (non-negotiable)

- Message bodies are **end-to-end encrypted**. Encrypt on the sender's device before upload; decrypt only on the two participants' devices.
- The server and database store **ciphertext only**. Bridger staff, admins, support tools, and logs must never be able to read plaintext message content or contact-card field values.
- Analytics never includes message text, phone numbers, or contact-card values — only opaque outcomes (`message_sent`, `contact_shared`, `message_hearted`, `counts_against_cap`).
- Demo mode may keep plaintext in memory for local UI preview. That pattern must never ship to production storage.

---

## Data (shapes)

```ts
interface Conversation {
  id: string;
  participantIds: string[];        // you + one friend
  lastMessage: string;
  updatedAt: string;
  unread: boolean;
}

interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  kind: 'text' | 'contactCard' | 'planNudge' | 'storyReply';  // planNudge is legacy only
  text?: string;
  contactCardId?: string;
  createdAt: string;
  countsAgainstCap: boolean;       // false for share-contact / hearts / storyReply
  heartedByMe?: boolean;           // you hearted their bubble (not a send)
  heartedByThem?: boolean;         // they hearted yours
}

interface ContactCard {            // set up once per user
  userId: string;
  displayName: string;
  fields: { kind: 'phone' | 'instagram' | 'email' | 'other'; value: string; enabled: boolean }[];
}

interface DailyCap {               // per sender → recipient, per day
  fromUserId: string;
  toUserId: string;
  date: string;
  used: number;
  limit: number;                   // default 5
}
```

---

## Module mapping

| Piece | Backend |
|---|---|
| Conversations, messages, per-recipient daily cap | `messages` |
| Contact card (set up once, share) | `messages` (or `profiles`) |
| Find a friend | `tiers` / `connections` (your roster) |
| Message from profile | `person/[id]` → `messages` |
| Double-tap heart | `messages` (reaction; not a send) |

---

## Acceptance criteria

- [ ] Messages tab opens the Messages list; a friend's profile has a Message button that opens the conversation.
- [ ] You can only message people you're connected with; Find-a-friend searches your roster.
- [ ] You can send **5 messages to each person per day**; the composer shows a live "{n} left today" counter.
- [ ] The cap is per recipient and per direction — being maxed toward someone does not stop them from messaging you.
- [ ] At your cap the composer locks with a "share your contact card" nudge; Share contact still works.
- [ ] When you message someone who has used their 5 to you, the thread shows "{Name} can't reply until tomorrow" and prompts "Share your contact instead."
- [ ] **Your contact card** on the Messages list opens as a dropdown (edit values + toggles). **Share contact** only appears in a thread and posts enabled fields.
- [ ] "Share contact", hearts, and story-reply mirrors do NOT count against the cap.
- [ ] There is no Make a plan action in a thread.
- [ ] Double-tap a friend's bubble hearts it (toggle). No heart counts. Does not send a message.
- [ ] A story reply also appears in the thread as `storyReply`; opening the thread clears the matching notification (`NOTIFICATIONS.md`).
- [ ] Text only — no media inbox. No read receipts, typing indicators, or presence.
- [ ] The daily count resets each day.

---

## Changelog

| Date | Change |
|---|---|
| 2026-08-28 | Shared-card bubble chip says Contact card + message icon; tap expands fields; phone uses sms not tel. Setup is Messages list dropdown. |
| 2026-08-21 | Removed Make a plan from threads (plans live on Events / Touch Grass). Share contact is the contact card. Double-tap a friend's bubble to heart it; hearts never count as a send. |

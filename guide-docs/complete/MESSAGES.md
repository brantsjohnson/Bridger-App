# Bridger — Messages (spec)

Self-contained. Bridger's messaging is **intentionally limited** — it exists to *start* a connection and then push it into real life, not to be another inbox. Keep UI copy minimal.

Maps to the (now active) `messages` module + `app/(tabs)/messages` tab; entered from the **Messages tab in the floating nav** and from a **friend's profile**.

---

## The philosophy (why it's capped)

You **don't need another inbox.** Messaging is a bridge: enough to say "hey, want to hang?" and swap contacts, not enough to live in DMs. So it's capped, and the two easiest actions in any thread are **Share contact** and **Make a plan**.

**Cap: you can send 5 messages to each person per day** (per recipient; tunable). When you're out with someone, the composer locks until tomorrow with a nudge to share contact or make a plan.

Everyone sets up a **contact card** once (below) so sharing it is one tap.

---

## Screens

### Messages list (Messages tab)
- Title + **Find a friend** (search your friends to start a conversation).
- Conversation rows: avatar, name, last-message snippet, time, unread dot.
- A small standing note: *"5 messages a day — Bridger isn't another inbox."*

### Conversation
- Header: back · avatar · name · **"{n} left today"** chip.
- Text message bubbles (them left, you right). **Text only** — no media inbox (that's what stories are for).
- **Quick actions** row, first-class: **Share contact** (shares your contact card into the thread) · **Make a plan** (→ touch grass / create an event).
- Composer with a live **"{n} of 5 left today"** counter + "swap contacts to keep going."
- **At the cap (your side):** composer locks — *"Out of messages today — share contact or make a plan"* — with the two quick actions still available (they don't count against the cap).

### Contact card (set up once in Messages)
- In the Messages app, everyone sets up a **contact card**: name + whatever they choose to include (phone, Instagram, email…). They **pick what's on it** and can edit anytime.
- **Share contact** (the quick action, and the maxed-out prompt) shares this card in one tap.
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
- **Share contact**, **Make a plan**, and **story-reply mirrors** (`kind: 'storyReply'`) are **not** counted against the 5/day cap — the app *wants* you to use the first two, and story replies already "spent" their attention on the story surface (`NOTIFICATIONS.md`).
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
- Analytics never includes message text, phone numbers, or contact-card values — only opaque outcomes (`message_sent`, `contact_shared`, `counts_against_cap`).
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
  kind: 'text' | 'contactCard' | 'planNudge' | 'storyReply';  // storyReply = mirrored story reply
  text?: string;
  contactCardId?: string;
  createdAt: string;
  countsAgainstCap: boolean;       // false for share-contact / make-a-plan / storyReply
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
| Make a plan | `touchgrass` / `events` |

---

## Acceptance criteria

- [ ] Messages tab opens the Messages list; a friend's profile has a Message button that opens the conversation.
- [ ] You can only message people you're connected with; Find-a-friend searches your roster.
- [ ] You can send **5 messages to each person per day**; the composer shows a live "{n} left today" counter.
- [ ] The cap is per recipient and per direction — being maxed toward someone does not stop them from messaging you.
- [ ] At your cap the composer locks with a "share contact or make a plan" nudge; quick actions still work.
- [ ] When you message someone who has used their 5 to you, the thread shows "{Name} can't reply until tomorrow" and prompts "Share your contact instead."
- [ ] Everyone can set up a **contact card** once (choose which fields — phone / Instagram / email); **Share contact** shares it in one tap.
- [ ] "Share contact", "Make a plan", and story-reply mirrors do NOT count against the cap.
- [ ] A story reply also appears in the thread as `storyReply`; opening the thread clears the matching notification (`NOTIFICATIONS.md`).
- [ ] Text only — no media inbox. No read receipts, typing indicators, or presence.
- [ ] The daily count resets each day.

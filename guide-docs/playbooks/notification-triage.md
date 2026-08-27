# playbook: notification-triage

**Goal:** go through notifications and play/answer replies one item at a time. Feature doc that owns the screens: `../NOTIFICATIONS.md` / `../STORIES.md`. Blast radius: **read → per-item act**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants Billy to walk their inbox. Triggers: "go through my notifications", "play me the replies", "what's new?"

## 2 · Slots

**Required:** `item` (current notification or reply) · `action` (`reply` / `react` / `skip` / `save_for_later` / `dismiss`).
**Optional:** reply draft text when action is reply.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Present one item (newest-first by default): read the notification, or play the reply video / read the text reply.
2. Wait for the user's action by voice or tap.
3. Advance; wrap up with a short count when done or when they stop.

## 4 · Disambiguation

If "reply to Sam" matches multiple threads, ask which. Never assume the wrong person.

## 5 · Preview

Per-item: when drafting a reply, show the full draft (style-aware if enabled) before send. React/skip/save/dismiss need no write preview beyond naming the action.

## 6 · Confirm

Each write (reply/react that posts) confirms per item. Never auto-reply. Save for later keeps it unread.

## 7 · Voice read-back

Before sending a reply, read back who it goes to and the draft gist (full draft still visible on screen).

## 8 · Failure & edge cases

- Empty inbox: say so briefly.
- Model/voice down: stop triage; Notifications page still works.
- Send fails: say so, offer retry; never claim it sent.
- Abandon: "stop" / "that's enough" ends immediately.

## 9 · Refusals

Won't auto-play everything or auto-reply. Won't read phone texts. Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../NOTIFICATIONS.md` and `../STORIES.md` (replies). Flow details also in `../AGENT-SCOPE.md` §6. This playbook owns the conversational state machine.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.

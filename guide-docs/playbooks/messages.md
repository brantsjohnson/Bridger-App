# playbook: messages

**Goal:** reply to or schedule Bridger messages, optionally in the user's style. Feature doc that owns the screens: `../MESSAGES.md`. Blast radius: **write-shared**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants to send or schedule an in-Bridger message. Triggers: "text {friend} that…", "reply to {friend}", "schedule a birthday message for Saturday."

## 2 · Slots

**Required:** `recipient` · `body` (full draft) · for schedule: `send_at` (exact send time).
**Optional:** style-aware drafting (on by default; Settings toggle).

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Harvest recipient, intent, and any draft wording from the opening utterance.
2. Ask for missing required slots one at a time; for schedule, collect exact send time.
3. Show full draft (+ send time if scheduled) → confirm → send or queue.

## 4 · Disambiguation

Resolve recipient against friends. Two matches → ask which. Never use phone contacts for send.

## 5 · Preview

Inline draft bubble; scheduled messages also show the exact send time (`../AGENT-SCOPE.md` §4).

## 6 · Confirm

Write-shared: approve the **full draft**, and if scheduled the **exact send time**, before anything queues or sends. In-Bridger only (no share sheet, no phone/iMessage).

## 7 · Voice read-back

Say back recipient, send-now vs schedule time, and a short confirmation of the draft before commit.

## 8 · Failure & edge cases

- Missing draft or time: ask; don't invent.
- Queue/send fails: say so, offer retry.
- Abandon: discard draft; cancel scheduled from activity log until it fires.
- Interrupt: update draft/time and continue.

## 9 · Refusals

No bulk "happy holidays to everyone" mass-send (per-person drafts only, a few at a time). No phone/iMessage. No impersonation autopilot. Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../MESSAGES.md` owns threads, composer, and scheduler. Style rules: `../AGENT.md` §7b / `../AGENT-SCOPE.md` §7. This playbook owns conversational fill-logic.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.
- **2026-08-21** - no Make a plan from Messages; draft Events / Touch Grass instead. Hearts are not sends.

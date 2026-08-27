# playbook: notes-and-dates

**Goal:** save a note, date, or check-in reminder about a friend. Feature doc that owns the screens: `../FRIENDS.md`. Blast radius: **write-private**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants to remember something about a friend. Triggers: "note that {friend}'s sister is named…", "remind me about {friend}'s birthday", "check in with {friend} every month."

## 2 · Slots

**Required:** `friend` · `kind` (`text` / `date` / `check_in`) · `content` (note text, date value, or cadence).
**Optional:** none forced.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Harvest friend, kind, and content from the opening utterance.
2. Ask only for missing required slots, one at a time.
3. Preview + quick confirm.

## 4 · Disambiguation

Resolve friend against the user's connections. Two matches → ask which. Group references are unusual here; prefer a single person.

## 5 · Preview

Inline note / date / reminder card (lighter card language per `../AGENT-SCOPE.md` §4): who it's about, the text or date, when it would fire.

## 6 · Confirm

Write-private quick confirm. Nothing is written until the user taps confirm (or voice yes after read-back).

## 7 · Voice read-back

Say back friend name + the note/date/cadence before saving.

## 8 · Failure & edge cases

- User won't give a required slot: explain what's missing; don't invent.
- Model/voice down: discard half-built save; Notes UI still works.
- Save fails: say so, offer retry; never claim success.
- Abandon / interrupt: discard or update and continue.

## 9 · Refusals

Won't save notes about people the user isn't connected to as surveillance. Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../FRIENDS.md` owns Notes & Reminders. This playbook owns only the conversational fill-logic.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.

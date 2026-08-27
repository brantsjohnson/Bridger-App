# playbook: friend-questions

**Goal:** answer questions about a friend from the user's saved notes and that friend's tier-visible profile. Feature doc that owns the screens: `../PROFILE.md` / notes in `../FRIENDS.md`. Blast radius: **read**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user asks something about a friend they already know in Bridger. Triggers: "what does {friend} like?", "what was their sibling's name?", "ideas for a gift for {friend}."

## 2 · Slots

**Required:** `friend` (resolved person).
**Optional:** `topic` (gift ideas, hobbies, dates, notes) when the ask is vague.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Harvest the opening utterance (which friend, what topic).
2. If friend is ambiguous, disambiguate before searching.
3. Answer from notes + tier-visible profile; never invent.

## 4 · Disambiguation

Two matches → "Sam Park or Sam Diaz?" Zero matches → say so and offer to save a note. Wrong-person is worse than missing-info.

## 5 · Preview

Read answers do not need a write preview. If the agent offers a follow-on act (save note, draft message), that act uses its own playbook preview.

## 6 · Confirm

None for pure reads. Any offered write uses that act's confirm gate.

## 7 · Voice read-back

Read back the resolved friend's name before answering when voice might have mis-heard it.

## 8 · Failure & edge cases

- Missing data: "I don't have that" + offer to save a note. Never fabricate (sev-1, `../AGENT.md`).
- Model/voice down: say it can't right now; app stays usable.
- Abandon: stop immediately; nothing written.

## 9 · Refusals

Standard `../AGENT.md` §18 refusals: no friend surveillance, no inference beyond shared facts, no private-world questions.

## 10 · Feature doc

`../PROFILE.md` (tier-visible fields) and `../FRIENDS.md` (notes). This playbook owns only the conversational answer flow.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.

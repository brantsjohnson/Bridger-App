# playbook: out-of-scope

**Goal:** gracefully decline or redirect an ask outside the agent's catalog or permission. Feature doc: `../AGENT.md` §18 (and `../AGENT-SCOPE.md` §2 catalog). Blast radius: **none** (no write).

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user asks for something Billy cannot or must not do. Triggers: friend surveillance, bulk blasting, impersonation, reading phone texts, anything outside the §2 catalog.

## 2 · Slots

**Required:** `ask_intent` (classified refusal or nearest-offer).
**Optional:** `nearest_offer` (adjacent thing Billy can do).

Placeholder until v1 fills refusal templates.

## 3 · Ask order (and harvest first)

1. Classify the ask against the catalog and §18 refusals.
2. Refuse gently in one warm sentence that names the principle.
3. Offer the nearest allowed thing when there is one.

## 4 · Disambiguation

If the ask could be read as an allowed act, clarify once before refusing. Prefer clarifying over a wrong refuse or a wrong do.

## 5 · Preview

None. No write preview for a refusal.

## 6 · Confirm

None. Confirmation never overrides a §18 refusal.

## 7 · Voice read-back

Not required for refusal. If offering a redirect act, that act's playbook owns read-back.

## 8 · Failure & edge cases

- Unclear ask: ask one clarifying question, then refuse or route to the right playbook.
- Model down: say Billy can't help right now; app stays usable.
- Abandon: stop; nothing written.

## 9 · Refusals

This playbook *is* the refusal path. Always honor `../AGENT.md` §18 even when the user "confirms" the bad ask.

## 10 · Feature doc

`../AGENT.md` §18 and `../AGENT-SCOPE.md` §2. No separate UI screen; responses stay in Billy chat/voice.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; refusal templates TBD.

# playbook: reconnect

**Goal:** answer "who haven't I reached out to?" then propose people and optional per-person drafts. Feature doc that owns the screens: `../FRIENDS.md`. Blast radius: **read → write-shared**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants reconnect suggestions. Triggers: "who haven't I talked to?", "who should I reach out to?", "anyone gone quiet?"

## 2 · Slots

**Required (read phase):** none beyond intent.
**Optional (act phase):** `selected_friend` · `draft_body` when the user wants a message.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Read recency signals; propose a few people with a reason each (no fabrication).
2. If the user picks someone, offer a Bridger draft (style-aware if enabled).
3. Full draft preview → confirm → send (messages playbook rules).

## 4 · Disambiguation

If two friends share a name in the shortlist, ask which before drafting.

## 5 · Preview

Read phase: shortlist with reasons. Act phase: draft bubble per `messages.md`.

## 6 · Confirm

None for the read shortlist. Drafts use write-shared confirm (full draft approved). No bulk send of the whole shortlist at once.

## 7 · Voice read-back

Read back the proposed names when presenting the shortlist; before send, read back recipient + draft confirm.

## 8 · Failure & edge cases

- No quiet friends: say so plainly.
- Model down: say it can't right now; Friends still works.
- Draft/send fails: say so, offer retry.
- Abandon: stop; nothing sent.

## 9 · Refusals

No behavioral inference ("they seem lonely"). No mass-message the whole list. Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../FRIENDS.md` owns reconnect/recency. Messaging details: `messages.md` / `../MESSAGES.md`. This playbook owns the suggest → optional draft flow.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.

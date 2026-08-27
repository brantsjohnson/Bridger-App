# playbooks/ — The agent's per-task operating manuals

Each file here is a **playbook**: the canonical description of how the assistant handles one kind of ask — the slots it fills, the order it asks, how it disambiguates, when it confirms, and how it fails. Playbooks are the agent's per-task "system prompts," pulled out of code into reviewable docs. Read with `../AGENT.md` (privacy lane, gating, invariants — **wins on any safety conflict**), `../AGENT-SCOPE.md` (the capability catalog these implement), and each playbook's feature doc.

---

## The two rules that make this safe

1. **The agent READS playbooks; only a human WRITES them.** The agent never edits its own operating instructions at runtime — that would make its behavior unreviewable, unrollbackable, and a prompt-injection target (a malicious note could try to write itself into permanent behavior). Playbooks change only through a normal commit.
2. **Playbooks contain ZERO PII.** They describe *method*, not people — "ask for the date," never a real date; "confirm the invitee list," never a real name. They are global and identical for every user. (Per-user *memory* is the app's own data — notes, dates, style profile — governed by `../AGENT.md`, and lives nowhere near here.)

## How playbooks stay accurate

- **Each playbook owns its flow's fill-logic; the feature doc owns the screens.** The `event-creation` playbook owns "how the agent walks you through making an event"; `../EVENTS.md` owns the event UI. One place to change per flow.
- **Same-commit rule (`../CURSOR-RULES.md`):** when you change a flow's steps, slots, or validation, update its playbook in the same commit — the discipline the analytics renames-log runs on. A flow change without a playbook change is an incomplete change.
- **Versioned like prompts:** each playbook has a version + changelog; the agent logs which version ran. Improving a playbook is a diff you can review and roll back — never a silent drift.

## How playbooks improve (human-in-the-loop, not self-editing)

The agent gets better at a task because its playbook gets better — and the playbook gets better because **de-identified quality signals tell a human where it's weak**, the same eval loop as `../AI-SYSTEM.md`:
- Signals (from product events, never content): abandon rate per slot, adaptation/re-ask frequency, confirm-cancel rate, task success → real outcome (event created, message sent, reconnect happened).
- A high abandon at one slot ("what time?") is a signal to **you** to fix that playbook's ask — you edit the doc, eval it, ship it. Self-improving in outcome, human-reviewed in mechanism.

## How the agent relates to the other AI systems (so nothing gets miswired)

- **The matcher (`../MACHINE-LEARNING.md`):** the agent does **not** read its weights or learn from it — different lane (cross-user, opaque IDs) vs. the agent's single-user lane. The agent may *consume its outputs as data* (reconnect suggestions) but shares its **values** (connection outcomes, never engagement), not its brain.
- **The invisible background AI (`../AI-SYSTEM.md`):** same gateway + firewall, same versioned-prompt/eval discipline; the agent is the one *visible*, opt-in surface.
- **The agent's only per-user learned thing** is the **style profile** (how you write), narrow and bounded (`../AGENT-SCOPE.md` §7). Everything else it "knows" is the app's data, read live.

---

## The standard shape (every playbook has these sections)

1. **Goal & trigger** — what ask this handles; example phrasings.
2. **Slots** — required vs. optional fields, each with its type and how it's asked.
3. **Ask order** — the sequence for missing slots; what to harvest from the opening utterance.
4. **Disambiguation** — people, groups, times; wrong-person handling.
5. **Preview** — which inline widget/card renders and when (`../AGENT-SCOPE.md` §4).
6. **Confirm** — the blast-radius-appropriate gate (`../AGENT-SCOPE.md` §5).
7. **Voice read-back** — what must be said back before commit.
8. **Failure & edge cases** — missing data, model down, action failed, abandon.
9. **Refusals** — what this playbook must decline (ties to `../AGENT.md` §18).
10. **Feature doc** — the doc that owns the screens.
11. **Version + changelog.**

## The catalog

| Playbook | Handles | Feature doc | Blast radius |
|---|---|---|---|
| `event-creation.md` | Make an event, by voice/text | `../EVENTS.md` | write-shared |
| `friend-questions.md` | Answer questions about a friend | `../PROFILE.md` / notes | read |
| `notes-and-dates.md` | Save a note / date / reminder about a friend | `../FRIENDS.md` | write-private |
| `profile-update.md` | Walk the user through editing their own profile | `../PROFILE.md` / `../PROFILE-MODULES.md` | write-private (own data) |
| `notification-triage.md` | Go through notifications + play/answer replies | `../NOTIFICATIONS.md` / `../STORIES.md` | read → per-item act |
| `messages.md` | Reply to + schedule Bridger messages, in the user's style | `../MESSAGES.md` | write-shared |
| `touch-grass.md` | Send a touch-grass signal | `../TOUCHGRASS-AND-QUIZ.md` | write-shared |
| `reconnect.md` | "Who haven't I reached out to?" → propose + draft | `../FRIENDS.md` | read → write-shared |
| `quiz-voice.md` | Take a quiz by voice (answers read back, moderator runs) | `../QUIZ-ENGINE.md` | write-private |
| `out-of-scope.md` | Gracefully decline/redirect an ask outside scope or permission | `../AGENT.md` §18 | — |

`event-creation.md` is written as the reference implementation of the standard shape; the rest follow it.

## Acceptance criteria

- [ ] Every playbook follows the standard 11-section shape and names its feature doc.
- [ ] Playbooks contain no PII and are read-only to the agent; only humans commit changes.
- [ ] Each flow's fill-logic lives in exactly one playbook; the same-commit rule is in `../CURSOR-RULES.md`.
- [ ] Playbooks are versioned; the agent logs the version it ran.
- [ ] Improvement runs through de-identified signals → human edit → eval → ship; the agent never self-edits.
- [ ] The agent reads playbooks as procedure, the app's data as memory, and never wires the matcher's model into itself.

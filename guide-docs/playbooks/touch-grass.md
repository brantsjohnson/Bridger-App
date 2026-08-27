# playbook: touch-grass

**Goal:** send a touch-grass signal to a chosen audience. Feature doc that owns the screens: `../TOUCHGRASS-AND-QUIZ.md`. Blast radius: **write-shared**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants to send a touch-grass signal. Triggers: "send touch grass", "see who's free tonight", "touch grass to Close." Audience is Close or Friends only. Never Everyone / acquaintances.

## 2 · Slots

**Required:** `audience` (who) · `when` (timing window).
**Optional:** light reason/context if the product supports it.

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Harvest audience and when from the opening utterance.
2. Ask only for missing required slots, one at a time.
3. Preview audience + when → confirm → send.

## 4 · Disambiguation

Vague groups ("the usual") → propose inferred members and confirm the list before use. Wrong-person is worse than missing-info.

## 5 · Preview

Touch-grass card showing the signal and its audience (`../AGENT-SCOPE.md` §4).

## 6 · Confirm

Write-shared: confirm names who/how many it reaches. Bulk ceiling asks first; never fan out silently.

## 7 · Voice read-back

Say back audience size/names and when before sending.

## 8 · Failure & edge cases

- Missing audience or when: ask; don't invent.
- Audience "everyone" / acquaintances: refuse that circle and ask Close or Friends.
- Send fails: say so, offer retry.
- Abandon: discard; nothing sent.
- Interrupt: update slots + preview and continue.

## 9 · Refusals

Won't mass-blast beyond the ceiling as a silent fan-out. Standard `../AGENT.md` §18 refusals apply.

## 10 · Feature doc

`../TOUCHGRASS-AND-QUIZ.md` owns the Touch Grass UI and rules. This playbook owns conversational fill-logic.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.
- **2026-08-21** - audience is Close / Friends only; never Everyone.

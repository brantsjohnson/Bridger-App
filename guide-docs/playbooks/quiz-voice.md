# playbook: quiz-voice

**Goal:** take a quiz by voice with per-answer read-back; moderator still runs. Feature doc that owns the screens: `../QUIZ-ENGINE.md`. Blast radius: **write-private**.

> Read-only to the agent · contains no PII · versioned (bottom). Placeholder names below illustrate flow only.

---

## 1 · Goal & trigger

The user wants to take a quiz by voice. Triggers: "take the quiz by voice", "quiz me", "start {quiz} with voice."

## 2 · Slots

**Required:** `quiz` · per question: `spoken_answer` mapped to a real option.
**Optional:** spoken explanation (content; used in-request only).

Placeholder until v1 fills types and ask copy.

## 3 · Ask order (and harvest first)

1. Resolve which quiz if unclear.
2. For each question: read question + options → capture spoken answer → map to an option → read back → count only after confirm.
3. Run the moderator on those answers; result feeds matching like a tapped quiz.

## 4 · Disambiguation

Rambly answers ("the second one, no wait the first") resolve via read-back to one option. Ambiguous quiz title → ask which.

## 5 · Preview

Show the mapped option on screen while reading it back. Result uses the normal quiz result UI.

## 6 · Confirm

Read-back per answer before it counts. No silent commits.

## 7 · Voice read-back

Mandatory every answer: "so that's '{option}' - right?" before counting.

## 8 · Failure & edge cases

- Can't map speech to an option: ask again; don't guess.
- Model/voice down: say so; tap quiz still works.
- Moderator flags: handle per `../QUIZ-ENGINE.md` (low confidence / contradiction).
- Abandon: stop; don't leave a broken half-submission.

## 9 · Refusals

Won't bypass the moderator. Won't invent answers. Standard `../AGENT.md` §18 refusals apply where relevant.

## 10 · Feature doc

`../QUIZ-ENGINE.md` owns scoring, moderator, and result. Voice details: `../AGENT-SCOPE.md` §8. This playbook owns conversational fill-logic.

## 11 · Version

- **v0 stub** (2026-08-07) - shape only; slots and ask copy TBD.

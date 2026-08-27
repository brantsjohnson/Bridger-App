# Discover matching quizzes (Connect Over)

These are the **only Discover modules live right now**. They are AI-guided
(quiz moderator from `QUIZ-ENGINE.md`): the authored rubric scores answers;
the moderator may reword, reorder, or insert clarifiers when confidence is
**strictly below** that quiz's `adaptBelowConfidence` floor.

Well-authored quizzes start with a floor around 0.4 so AI stays mostly out.
**Behind the Scenes has adaptation fully off** (`adaptBelowConfidence: 1`,
all may* flags false). ML may tune floors later from `quiz_adapted` outcomes.

## Naming (never mix these up)

| Internal id (code, matching, analytics) | Bridger module title (user-facing) | Role |
| --- | --- | --- |
| `disclosure` | **Behind the Scenes** | Pre-quiz. Optional. Softest name. Shapes how the other quizzes read the person. Shown once (first quiz run), not a medical-style form. **Live.** |
| `humor` | **Your Funny Bone** | Humor **taste** (5 axes + breadth) · similarity (**live**) |
| `values` | **What Gets You Going** | Values measurement (**live** — Schwartz forced-choice → similarity dials) |
| `personality` | **Your Vibe** | Personality measurement (**live** — Big Five + assertiveness) |
| `attachment` | **The Friend Zone** | Attachment measurement (**live** — anxiety + avoidance + style matrix) |

Matching and analytics always use the **internal id**. Titles can change in
the manifest without touching scoring.

## Folder per quiz

```
discover/
  disclosure/     → Behind the Scenes (LIVE)
  humor/          → Your Funny Bone (LIVE)
  values/         → What Gets You Going (LIVE)
  personality/    → Your Vibe (LIVE)
  attachment/     → The Friend Zone (LIVE)
```

### Humor (Your Funny Bone) files

- `dimensions.ts` — absurdity / edge / register / craft / irony + breadth band
- `media.ts` — TV / movie / comedian / character fingerprints + clusters
- `questions.ts` — 20 concrete items (3 phases); multi-select + optional explain
- `score.ts` — deterministic tag sum → 5-axis vector + breadth; styleHints stored
- `moderator.ts` — disclosure-aware; adaptBelowConfidence 0.4
- `HumorFlow.tsx` — multi-select + chat-bubble explain UI

### Attachment (The Friend Zone) files

- `dimensions.ts` — anxiety / avoidance + style copy + match matrix
- `questions.ts` — 20 friendship scenes with weights + pair tags
- `score.ts` — dimensional scores, Q13/Q14 pair logic, SES helper
- `moderator.ts` — disclosure-aware; adaptBelowConfidence 0.4
- `AttachmentFlow.tsx` — multi-select + chat-bubble explain UI

### Disclosure files

- `manifest.ts` — title, status live, AI off
- `content.ts` — intro cards, conditions, impact, match-weight copy
- `moderator.ts` — adaptation policy (off) + measurement default floor
- `matching.ts` — additive-only matching rules
- `DisclosureFlow.tsx` — the take UI (own surface `behind_the_scenes`)

### Personality (Your Vibe) files

- `dimensions.ts` — sociability, assertiveness, agreeableness, conscientiousness,
  openness, neuroticism (+ match modes)
- `questions.ts` — 50 core + 5 follow-ups with option→dimension weights
- `score.ts` — pattern scoring, ranges, symptom/disclosure confidence dampening
- `moderator.ts` — disclosure-aware AI; adaptBelowConfidence 0.4
- `PersonalityFlow.tsx` — multi-select + chat-bubble explain UI

### Values (What Gets You Going) files

- `dimensions.ts` — adventure↔stability, giving↔striving, hedonism (+ pending loyalty/honesty)
- `questions.ts` — 30 forced-choice scenes; each option → one Schwartz value
- `score.ts` — raw counts → levels 1–10 → matching dials
- `moderator.ts` — disclosure-aware; adaptBelowConfidence 0.4
- `ValuesFlow.tsx` — single-select, skip×3, shuffled options, chat explain

### Shared

- `_shared/thresholds.ts` — AI/ML adapt floors per quiz
- `_shared/disclosure-context.ts` — safe slice for every measurement quiz
- `_shared/QuizTakeShell.tsx` (+ OptionTile, EmojiBurst) — flair UI: accent,
  fun shapes, emoji burst, paged options (no scroll), note chip

## Anchoring (what each question measures)

- **Disclosure** — not a scored rubric quiz. Stores condition + impact (1–4) +
  optional note + account-level match weight. See `matching.ts`.
- **Personality** — each option weighted on the dials above; follow-ups flag
  preference vs execution. See `questions.ts` `measures` + `weights`.
- **Attachment** — each option weighted on anxiety / avoidance / SES; Q13+Q14
  paired; style derived after scoring. See `questions.ts` + `score.ts`.
- **Values** — each option awards one Schwartz value (equal coverage). Dials
  derived in `score.ts`. Loyalty/honesty pending friendship add-on.
- **Humor** — concrete moments + media fingerprints → five taste axes + breadth.
  Phase 2/3 also collect style hints (not matched yet). Backend axis names
  never appear in UI.

## Matching picture

| Quiz | Vector | Match mode |
| --- | --- | --- |
| Humor | 5 taste axes + breadth | similarity (breadth widens/narrows band) |
| Values | adventure↔stability, giving↔striving, hedonism | similarity |
| Personality | Big Five (assertiveness split) | mixed: warmth similar, dominance complementary |
| Attachment | anxiety + avoidance → 4 styles | matrix |

## Wire-up notes

- Connect Over lists all five; all five have custom live flows.
- Tables: `disclosure_profiles`, `disclosure_items` (migration `0040`).
- `DISCOVER_QUIZ_IDS` includes personality / values / humor / attachment.
- Disclosure stays intake / additive-affinity, never reveal evidence.
- Privacy: never on a profile; never to matches; skippable everywhere.

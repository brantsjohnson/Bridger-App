# Bridger — Quiz Engine (AI-moderated modules)

How Bridger's quizzes — values, personality, communication style, and any future module — produce **accurate, consistent scores** that feed matching, with an **AI moderator** ensuring the signal is clean and adapting the quiz when it isn't. Generalizes to **every module** (each carries its own moderator goal).

The core principle: **the rubric sets the score; the AI moderates and adapts.** The LLM is *not* trusted to invent numbers — it's trusted to judge whether we have enough clear signal to score well, and to gather better signal when we don't.

---

## 1. A quiz definition (authored in admin, versioned)

```ts
interface Quiz {
  id: string;
  version: number;
  goal: string;                       // human-readable purpose
  dimensions: Dimension[];            // e.g. the 7 values it measures
  questions: Question[];
  moderatorInstructions: string;      // the AI's goal + latitude for THIS quiz (below)
  adaptationPolicy: {                 // what the AI is allowed to do
    mayReword: boolean;
    mayInsertClarifiers: boolean;
    maxInsertedQuestions: number;     // hard cap so it can't run forever
    mayReorder: boolean;
  };
}

interface Dimension { key: string; label: string; }   // e.g. "spontaneity", "loyalty"

interface Question {
  id: string;
  prompt: string;
  type: 'single' | 'multi';           // multi = select multiple
  options: Option[];
  allowExplain: boolean;              // free-text "why" per question
}

interface Option {
  id: string;
  label: string;
  weights: Record<string, number>;    // option → dimension weights (THE RUBRIC)
}
```

- Questions are **multiple choice**, **multi-select allowed**, each with an optional **free-text explanation**.
- Every option carries **rubric weights** onto one or more dimensions. This mapping is what makes scoring deterministic.

---

## 2. Deterministic scoring (the rubric sets the score)

- As the user selects options, the engine sums the selected options' **weights** per dimension → provisional **dimension scores** (normalized).
- This is **pure, reproducible arithmetic** — same answers always yield the same scores. **No LLM in this path.** That's what keeps scores accurate, explainable, and auditable — exactly the requirement ("I don't want the LLM to make the score, but I want the score to be accurate").

---

## 3. The AI moderator (Claude, server-side)

Runs *alongside* the quiz, per response. Its jobs:

- **Judge confidence per dimension.** After each answer, does the accumulated signal clearly locate the person on each dimension, or is it muddy?
- **Detect low-quality answering.** Flags patterns that make a score meaningless: **selecting every option**, **contradictory** picks, **low-information** answers, or explanations that undercut the selection ("I picked spontaneous but I plan everything").
- **Read the explanations.** The free-text "why" is the richest signal — the moderator uses it to disambiguate ("selected both, but the why makes clear they lean planner").
- **Adapt the quiz** (within `adaptationPolicy`): when a target dimension is unclear, it can **reword the next question**, **insert one clarifying question**, or **reorder** to pin down what's fuzzy — up to `maxInsertedQuestions`. Example: *"Spontaneity unclear → ask a concrete either/or: 'Trip next weekend — book tonight, or research for a week?'"*
- **What it does NOT do:** assign or override the numeric scores. It sets a **confidence** per dimension and gathers better inputs; the rubric still computes the number.

Every quiz's moderator gets **its own instructions** at authoring time — the goal and how much latitude it has. Same pattern for any module (a "Places" or "Favs" module could have a lighter moderator, or none).

```ts
interface ModeratorState {
  quizId: string;
  userId: string;
  confidence: Record<string, number>;  // per dimension, 0–1
  flags: ('selected_all' | 'contradiction' | 'low_info')[];
  insertedQuestionIds: string[];       // capped by adaptationPolicy
  transcriptForAI: string;             // answers + explanations (de-identified)
}
```

---

## 4. Output & how it feeds matching

```ts
interface QuizResult {
  quizId: string; userId: string;
  dimensionScores: Record<string, number>;   // deterministic
  confidence: Record<string, number>;        // from the moderator
  completedAt: string;
}
```

- Dimension scores become **matchable attributes** (`DATA.md`, Zone B — de-identified, opaque IDs) and contribute to the person's **embedding + summary** (Zone C).
- **Low-confidence dimensions are down-weighted** in matching (or trigger a later freshness re-check) rather than polluting suggestions with a bad read.
- Personality/values dimensions are **`visible_to_tier: none` + `matchable`** — used for matching, never displayed (per `DISCOVER.md`).

---

## 5. Privacy & safety

- Scoring inputs, scores, and embeddings are **de-identified** (Zone B/C) — opaque IDs, never PII, never trained on.
- **Free-text explanations** are the user's own content: author-owned, used by the moderator server-side, shown to no one unless the user chooses, deletable, and never used to train a model.
- The moderator runs in the **API server** with the Anthropic key (see `INFRASTRUCTURE.md`); nothing AI-related touches the client.
- Adaptation is **bounded** (`maxInsertedQuestions`) so a quiz can't loop forever, and every inserted/reworded question is **logged** for auditability.

---

## 6. Authoring flow (admin)

In the admin console (`ADMIN.md`), creating a quiz = define goal + dimensions + questions (with option→dimension weights) + write the **moderator instructions** and set the **adaptation policy**. Quizzes are **versioned** (results record the version). New quiz = new folder/registry entry, isolated (matches the existing quiz-plugin isolation in `ADMIN.md`).

---

## 7. Acceptance criteria

- [ ] Quizzes support multiple-choice, **multi-select**, and an optional free-text explanation per question.
- [ ] Scores are computed **deterministically** from option→dimension rubric weights — no LLM in the scoring path; same answers → same scores.
- [ ] An AI moderator runs per response: sets **per-dimension confidence**, flags low-quality answering (select-all, contradictions, low-info), and reads explanations.
- [ ] The moderator can **reword / insert clarifying questions / reorder** within a per-quiz `adaptationPolicy` and a hard `maxInsertedQuestions` cap — and **never** sets the score.
- [ ] Each quiz carries its **own moderator instructions** authored in admin; the pattern generalizes to any module.
- [ ] Results store deterministic dimension scores + confidence; low-confidence dimensions are down-weighted in matching.
- [ ] Scores/embeddings are de-identified (Zone B/C); explanations are author-owned, private by default, deletable, never trained on; all AI runs server-side.
- [ ] Quizzes are versioned; inserted/reworded questions are logged.

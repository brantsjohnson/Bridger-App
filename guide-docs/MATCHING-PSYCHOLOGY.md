# MATCHING-PSYCHOLOGY.md: How Bridger learns who should meet

Plain-English map of the matcher. Read with `MACHINE-LEARNING.md` (the learning rules) and `complete/MATCHING-ALGORITHMS.md` (the Nest code).

**Where this runs:** Nest (`apps/api/src/matching/`) plus Postgres/pgvector in Supabase. **Not Edge Functions.** The stack decision is already written in `ARCHITECTURE.md` and INDEX §6: all matching math lives in Nest so we keep one scorer, one privacy firewall, and one place to roll back weights.

---

## 1 · The picture in one page

1. People fill **hobbies / profile facts** (Everyone + matchable) and take **Personality quizzes**.
2. Nest writes **quiz dials** (numbers only) and rebuilds a **person embedding** from those matchable facts.
3. Discover scores friends-of-friends with six named ingredients (quiz fit, embedding closeness, shared hobbies, and so on).
4. When you place someone in **Friends** or **Close friends**, that placement is a label: "this pair worked." Skip / demote / block is "this pair did not."
5. A nightly Nest job reads those labels and **proposes new weights**. It only flips the live knobs once there are enough Close labels, so you do not have to hand-tune Discover every week.

You never have to go in and "fix" the psychology of a quiz. That part is authored once. What the machine updates is **how much to trust each ingredient** for this community.

---

## 2 · What each quiz looks for

| Quiz (what people see) | Internal id | What "a good pair" means |
|---|---|---|
| Your Funny Bone | `humor` | **Same taste.** If you both laugh at the same kind of joke, surface it. Opposite humor is a weak pair. |
| What Gets You Going | `values` | **Same priorities.** Shared adventure / giving / pleasure dials are glue. |
| Your Vibe | `personality` | **Mixed.** Warmth (agreeableness) wants the same. Who takes charge (assertiveness) wants **opposites** (one leads, one follows; two bosses clash). Sociability, planning, and curiosity want a mild same-ness. Emotional sensitivity is **never** a gate. |
| The Friend Zone | `attachment` | **A style chart, not same-score.** Two steady people fit. Anxious + distance-keeping is the classic trap (low score on purpose). |

Hobbies and other Everyone-visible facts are **same is good, and rare is better.** Two people who both do aerial silks beat two people who both "like music."

Private quiz dials can help the score quietly. They never appear as the "why" line on a suggestion card. The card can only cite Everyone-visible facts (a shared hobby, a shared place).

---

## 3 · Friend circles are training data

Each circle you put someone in is a vote about the relationship, not a vanity count.

| What you did | What the matcher learns | Strength |
|---|---|---|
| Placed them in **Close friends** | Gold. Something about this pair is the kind of bond we want more of. | +1.0 |
| Placed them in **Friends** | A real bond, a bit quieter than Close. | +0.55 |
| Added / approved a Discover suggestion | Weak yes (they were curious). | +0.3 |
| Message or plan after reveal | They used the connection. | +0.4 |
| Demoted (Close → lower, or Friends → Acquaintances) | This pair cooled. | −0.5 |
| Don't suggest again / removed / blocked | Hard no. Block also marks older rows for that pair as stale. | −0.5 to −1.0 |
| We just met → Acquaintances | Default landing. **Not** a style label. Too noisy. | (no extra label) |

The software looks at **what you two already shared** when that label landed (shared hobbies, quiz fit, embedding closeness). If Close pairs in this community keep sharing niche hobbies more than they share a humor score, hobby weight goes up and you do not have to move a slider.

Privacy stays one-way for what people *see*. Learning only stores six numbers plus the outcome, on opaque ids. No names, no quiz answers, no messages.

---

## 4 · Embeddings (the "feel similar" layer)

When someone finishes a Personality quiz or edits a matchable profile fact, Nest queues an **embeddings** job. That job turns de-identified facts (hobby labels, quiz dial numbers, not photos or names) into a vector in `person_embeddings` (pgvector).

Discover uses cosine closeness of those vectors as one of the six ingredients. It is the broad "you two have a similar shape" signal. Specific hobbies and quiz psychology still sit on top so we do not suggest someone only because the vector is vaguely near.

Turning Discover off, or deleting the account, drops that vector.

---

## 5 · How weights update without you

- **v1 (now):** hand-set weights in `matching_config`. Every outcome is logged.
- **Preview:** `GET /admin/matching/learn` shows what the data would do to those weights.
- **Nightly:** Nest refreshes Discover, then runs the learner. It **only activates** a new config when there are enough labeled pairs (about 3,000) and enough Close labels (about 40), and the new weights separate "worked" from "did not" better than the current ones.
- **Rollback:** `POST /admin/matching/config/activate/:version` flips back. No redeploy.

Until that floor, you still get better suggestions from better profiles and quizzes. The machine is collecting labels, not yanking knobs.

---

## 6 · What this never does

- Edge Functions for matching (Nest only).
- Learning from taps, scroll, or time in app.
- Using Close-only profile facts to suggest strangers.
- Fine-tuning a foundation model on user text.
- Inferring mood, loneliness, or "they need friends."

---

## Acceptance

- [x] Quiz psychology is one shared dictionary (`packages/shared/src/model/quiz-match.ts`) used by Nest scoring.
- [x] Humor / values = similarity; assertiveness = opposites; attachment = style chart; neuroticism = never a gate.
- [x] Close and Friends placements write `matching_feedback` with a real feature snapshot (Discover freeze, or a score-now snapshot if they already knew each other).
- [x] Nightly Nest job proposes weights; live flip is gated on Close-label volume.
- [ ] Admin dashboard shows add→Close plus the learn preview (metrics endpoint exists; console UI may still be catching up).

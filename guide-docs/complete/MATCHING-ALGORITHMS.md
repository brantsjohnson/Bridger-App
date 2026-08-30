# MATCHING-ALGORITHMS.md — Paste this into Cursor

*(Spec + build prompt for Bridger's matching system. Extends `DISCOVER.md`, `REVEAL.md`, `QUIZ-ENGINE.md`, `DATA.md` — read those first. Target: **the Nest API (`apps/api/src/matching/`)** + Postgres/pgvector. **Matching runs in Nest, not Supabase Edge Functions** — `ARCHITECTURE.md` is authoritative. The names below (`discover-refresh`, `bridge-suggest`, `event-suggest`, `pair-overlap`) are **module functions**: HTTP endpoints for the on-demand ones, a Nest cron/worker for nightly `discover-refresh`. One shared scorer core, wrapped for each surface.)*

---

You are building Bridger's matching system. It has **two modes sharing one core**:

- **Mode 1 — Suggestion scoring (pre-connection, backend):** who should meet whom. Powers three surfaces: Discover, post-reveal bridge suggestions, and event guest suggestions. Operates on **opaque IDs**, de-identified Zone B/C data only.
- **Mode 2 — Overlap engine (post-connection, user-facing):** what two *connected* people share. Powers the **connection reveal** (the visual moment) and the lasting **In common** tab. Tier-gated, richer (can show paired answers), computed only after a connection exists.

Same underlying comparison logic (find + rank shared things); different privacy contexts and output shapes. Build the comparison core once; wrap it twice. Read `DATA.md` zones before writing anything.

---

# PART 1 · Suggestion scoring (Mode 1)

## The three suggestion surfaces

1. **`discover-refresh`** (Nest cron/worker + on-demand endpoint) — nightly batch + on-demand: ranked "people you should meet" per user, from the friends-of-friends graph.
2. **`bridge-suggest`** (Nest endpoint) — triggered when A↔B connect. Look across the new bridge: A's friend for B, B's friend for A. **Prefer reciprocal pairs** (A's friend X fits B AND B's friend Y fits A — a budding group of four). Surfaced only AFTER the reveal completes, never during it; max one bridge suggestion per new connection; cooldown before repeats.
   - **`reveal-bridges`** (Nest `GET /matching/reveal-bridges/:personId`) — powers **reveal Screen 3**: same FoF scoring, up to 3 suggestions that pass the threshold, prefer friends of the newly connected person. Returns `{ discoverable, suggestions }`. When Discover matching is off, returns `discoverable:false` and an empty list (client shows an opt-in nudge). No cooldown (fresh each open). Add from a card posts a normal connect request (`madeVia: suggestion`).
3. **`event-suggest`** (Nest endpoint) — for an event: score friends-of-invitees (+ host's eligible graph) against the event's activity/theme attributes and the confirmed attendee set. Powers host guest suggestions and each guest's "{N} to meet" count (`EVENTS.md`).

## Hard eligibility gates (before any scoring)

- Candidates from the **friends-of-friends graph only** (today's scope). Exclude: existing connections; blocked users in either direction (blocks also invalidate the *bridge* — a mutual who blocked either party is not a path); `suggestion_skips`; `discoverable=false`; below minimum profile completeness.
- **Quiz gating is PER SHARED QUIZ.** `quiz_alignment` computes over the **intersection** of quizzes BOTH users completed at compatible versions; each shared quiz is its own evidence item, and **one** shared completed quiz satisfies the quiz arm of the evidence gate. Someone who finished only `humor` matches anyone else who finished `humor`. One-sided quiz data never enters a pair's score.
- **Discover quiz internal ids:** `personality`, `values`, `humor` (more may be added; one more planned — target four). **User-facing quiz titles are marketing names** set in the quiz definition; matching and analytics reference the **internal ids only**. "Fun"/BuzzFeed-style quizzes are ordinary `QUIZ-ENGINE.md` quizzes (playful surface, authored rubric dimensions + moderator underneath) and match exactly like the rest — there is no separate quiz path. A quiz enters matching only when its dimensions are `matchable`.
- **Suggestion pool (Mode 1, pre-connection):** compare **only attributes with `visibility = Everyone` (acquaintance tier) AND `matchable = true`** (the module-end consent). Friends-tier and Close-tier fields **never** feed stranger suggestions — suggestion evidence is shown to someone who isn't a friend yet, so scoring on tighter-than-Everyone data would either leak it or produce evidence that can't be shown. Friends-tier data participates only in Mode 2 (post-connection overlap), under beat-0 tier gating. Sensitive fields (identity/beliefs) stay never-bulk-matchable (`PROFILE-MODULES.md`).
- Explanations may only *surface* what the viewer could already see at their access level.
- **Evidence gate ("never desperate"):** a pair needs ≥1 shared matchable quiz OR ≥ `MIN_SHARED_SIGNALS` (start: 3) meaningful matchable overlaps, else it is not a candidate. Below `SUGGEST_THRESHOLD` → not suggested. **Fewer or zero suggestions is the correct output when the bar isn't met.** Spotlight requires `SPOTLIGHT_THRESHOLD`. Cap per refresh (start: 5).

## Score components (transparent v1 — every weight in a `matching_config` table)

| Component | What it measures |
|---|---|
| `quiz_alignment` | Per shared matchable quiz: per-dimension similarity (or per-quiz-config complementarity), **weighted by both users' per-dimension confidence** from the AI moderator (`QUIZ-ENGINE.md`). Low-confidence dimensions are discounted; dimensions below `CONFIDENCE_FLOOR` (start: 0.4) are ignored. |
| `embedding_similarity` | Cosine similarity of precomputed person-embeddings (pgvector). Broad, cheap. |
| `shared_attributes` | Matchable attribute overlap, **specificity-weighted by inverse frequency** — "both do aerial silks" ≫ "both like music". Everyone+matchable only for Mode 1 evidence. |
| `moderator_notes_affinity` | Similarity of Discover-module moderator notes (Zone C; features only, never displayed). |
| `mutual_warmth` | Path strength: shared **Close** friend > Friend > Acquaintance; 2+ independent mutual paths > 1. |
| `context_fit` | Bridges: reciprocity bonus. Events: similarity to event attributes + attendee-set centroid. Discover → 0. |

**v1 scores with all six components live from day one** (`MACHINE-LEARNING.md` §8). A component contributes **0 for a given pair when that pair lacks its data** (zero-by-absence), not a config phase. No "embeddings optional / no-op" stage.

## Learning signals (log ALL from day one)

`matching_feedback(pair_features_snapshot, outcome, weight, created_at)` on opaque IDs.
**Positive:** suggestion→added · approval · placed/promoted to **Close** (strongest) · post-reveal message/plan · event-suggestion→invited/attended.
**Negative:** dismissed · "don't suggest again" (strong) · declined · demoted tiers · removed · **blocked (strongest; retroactively mark the pair's features as a hard negative)**.
v1 = hand-tuned config weights; v2 = simple logistic fit over the SAME named components once volume justifies. No opaque models.

---

# PART 2 · The overlap engine (Mode 2) — what powers the reveal

This is the user-visible payoff. When two people connect, the client runs the reveal (`REVEAL.md` / the beats below); **this engine supplies its content.** Same engine, re-queried later, renders the **In common** tab forever after.

## Critical sequencing (matches the built UI)

**Beat 0 of the reveal ("How did you two meet?") sets the friendship tier — and tier gates visibility. Therefore: compute/return NOTHING overlap-related until beat 0 is submitted.** The flow is:

1. Connection created → client shows beat 0 (met-context + circle choice; "just met" → Acquaintances; "already know" → optional Close/Friends/Acquaintances, soft-default Friends; coarse place or short note captured per `REVEAL.md`).
2. Client submits beat 0 → tier now exists on the connection → client calls the **`pair-overlap`** Nest endpoint.
3. `pair-overlap` computes the overlap **at the granted tiers** (each side's items filtered by what THAT person shares at the tier they granted) and returns the `RevealPayload` below.
4. Reveal beats 1–3 render from the payload. The **In common** tab calls the same function (fuller variant) any time later.

## What the engine compares (both must allow it at current tier)

- **Shared hobbies** — and where both have follow-up answers (`value.followUp.answer`), return BOTH answers as a pair (the instant conversation starter; suggestion cards only ever show titles, the reveal/In-common may show paired answers).
- **Matching this-or-that picks** (including both-both).
- **Places both have been** (+ co-op shared-place photos for In common).
- **Matchable quiz compatibility** — per shared Discover quiz (`personality` / `values` / `humor` / `attachment`), one confidence-weighted % labeled with the quiz's **in-app title** from `quiz_registry.title` (e.g. "Your Funny Bone"). Never answers, never explanations, never backend slugs in the UI. Quizzes persist via `POST /discover/quizzes/:slug/complete` (client-scored dimensions → `quiz_results` + `quiz.{slug}.*` attributes, `visible_to_tier: none`, `matchable: true`).
- **Favorites at item level** — expand `fav:` group rows into individual items so "Thai" matches "Thai".
- **Music** — shared artists (`music.artist.*`, name-normalized across Spotify/Apple) and shared music picks (`music_picks`: fav track/album/artist, song of week).
- **Other shared matchable attributes**, tier-permitting.
- **Meeting memory** (beat 0's coarse place / note / via-mutual / event) — stored on the connection, editable/removable by either, visible only to the two.
- **Mutual friends** (for the In-common mutuals strip; respects blocks — a blocked mutual never appears).

## Selection rules

- **Strongest thing** = highest specificity-weighted overlap (same inverse-frequency ranking as Mode 1), preferring concrete/surprising (shared event, shared niche hobby, shared place) over generic. Exactly ONE gets the star/headline (beat 1).
- **"You've also got…"** = up to `REVEAL_EXTRAS_MAX` (3) next-strongest, excluding the headline. **If none remain, skip beat 2 entirely** (the built UI supports this).
- Quiz-% lines render above the extras when present.
- **In common tab** = the FULL ranked list (no 3-cap), + mutuals strip, + how-you-met card, + shared-place photos.
- **Thin-overlap degradation (must return well-formed shapes):** rich → all beats; some → beat 1 + partial extras; minimal → beat 1 only; none (rare — connection may predate profile fill) → `strongest: null`, client shows the neutral close ("You two should click." still works) and In common shows its empty state. Never invent filler.

## Output contract

```ts
interface RevealPayload {
  viaMutual?: { firstName: string };                 // display-safe
  strongest: OverlapItem | null;                      // beat 1 headline
  quizCompat: { quizId: string; dimension: string; percent: number }[];  // labels+numbers only
  extras: OverlapItem[];                              // ≤3, beat 2; empty → skip beat
}

interface OverlapItem {
  kind: 'hobby' | 'this_or_that' | 'place' | 'event' | 'attribute';
  title: string;                                      // "You both run"
  pairedAnswers?: { yours: string; theirs: string };  // hobby follow-ups, both sides
  icon?: string; accent?: string;
}

interface InCommonPayload extends RevealPayload {
  fullList: OverlapItem[];                            // uncapped, strongest starred
  mutuals: { id: string; firstName: string; photoRef: string }[];
  howYouMet: MeetingMemory[];                          // coarse place/note/via/event + date
  sharedPlacePhotos: { place: string; yours: MediaRef; theirs: MediaRef }[]; // co-op
}
```

Names/photos here are allowed — this is Mode 2, both users are connected and the payload is scoped per-viewer by RLS. The comparison itself still runs on attribute rows; nothing is ever pulled from fields the other person didn't share at the granted tier.

## Privacy invariants (repeat in code comments)

- No overlap data crosses before beat 0 sets the tier. Recompute on tier change (promote → more may appear; demote → items disappear) — cache invalidates on tier/attribute/quiz change.
- Quiz **answers and explanations never cross** the connection — only dimension label + %.
- Meeting place is coarse (neighborhood), only-the-two, editable/removable.
- Mode 1 stays opaque-ID de-identified end-to-end; Mode 2 is per-viewer RLS-scoped.
- Blocks: hard-stop everywhere (candidacy, bridges, mutuals strips).

---

# Cost & performance

- No LLM calls in any hot path. Embeddings + moderator notes embedded at write time. Request-time = pgvector ANN + arithmetic.
- `discover-refresh` nightly batch; `bridge-suggest`/`event-suggest` on-demand over small sets; `pair-overlap` on-demand (reveal + In common) with per-pair cache keyed to (tierA, tierB, attr/quiz versions).
- Candidate cap per run (~500 via ANN pre-filter); log timing/cost per run.

# Deliverables

1. Migrations: `matching_config`, `matching_suggestions` (+evidence), `matching_feedback`, connection `meeting_memory`, pgvector indexes.
2. Shared comparison core in `apps/api/src/matching/` + **four module functions** (NOT Edge Functions): `discover-refresh` (cron/worker + on-demand endpoint), `bridge-suggest`, `event-suggest`, `pair-overlap` (reveal + In common variants) as HTTP endpoints.
3. Config seeded (weights, `SUGGEST_THRESHOLD`, `SPOTLIGHT_THRESHOLD`, `MIN_SHARED_SIGNALS`, `CONFIDENCE_FLOOR`, `REVEAL_EXTRAS_MAX`) with plain-English comments per knob.
4. Tests: both-sided quiz gate · block/skip exclusion (incl. bridge + mutuals) · threshold → empty-not-weak · specificity ranking · confidence discounting · reciprocity preference · **beat-0-before-overlap sequencing** · tier-change recompute · thin-overlap degradation shapes.
5. `PLAIN-ENGLISH.md` in the module: how a suggestion is born + how a reveal gets its content.

Start by restating this spec in your own words + proposed file layout; wait for approval before implementing.

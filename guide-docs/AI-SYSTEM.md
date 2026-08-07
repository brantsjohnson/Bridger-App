# AI-SYSTEM.md — How AI works inside Bridger

The complete contract for AI in Bridger: where it runs, which models with which settings, how prompts are engineered and evaluated, how the RAG engine is built, and the privacy firewall that guarantees **no PII ever reaches a model**. Read with `DATA.md` (zones), `QUIZ-ENGINE.md`, `MATCHING-ALGORITHMS.md`, `MACHINE-LEARNING.md`, `INFRASTRUCTURE.md`.

---

## 1 · The doctrine: invisible AI

AI is **ambient infrastructure, not a feature**. The user should never *see* "AI" — no sparkle icons, no "AI-generated" chrome, no chatbot. They see the *results*: a weekly summary that reads like a thoughtful friend wrote it, a suggestion that feels uncannily right, a quiz that seems to understand them. Rules:

- **Never label output as AI** in UI copy; never use AI-isms ("As an AI…", "Based on your data…"). Output sounds like Bridger: warm, brief, human.
- **Never expose mechanism** ("our model noticed…"). Explanations reference only things the person shared.
- **Fail silent, not weird.** If AI can't produce good output, the surface hides (a missing summary shows nothing, not filler). The app must be fully usable with every AI feature down.
- The only semi-visible surfaces are the **weekly/day summaries** and the **quick-check** card — and both read as Bridger being attentive, not as a model talking.

## 2 · Every AI touchpoint (the registry)

All calls run **server-side** through one gateway (§5). Model IDs live in config (swappable without deploys); "standard" = a top-tier reasoning model (Anthropic Claude), "fast" = the cheap/fast tier, "embed" = OpenAI text-embedding (small).

| # | Job | Module | Model | Temp | Max tokens | Output | Trigger |
|---|---|---|---|---|---|---|---|
| 1 | Video/voice transcription | `stories` | speech-to-text | — | — | text | at post time |
| 2 | **Day summary** (1–2 sentences) | `stories` | fast | 0.4 | 150 | text | at post time |
| 3 | **Week summary** (day-by-day recap) | `stories` | standard | 0.4 | 600 | JSON {day→text} | at post time (rolling) |
| 4 | **Quiz moderator** (confidence, flags, adaptation) | `quizzes` | standard | 0.2 | 800 | strict JSON | per response |
| 5 | **Discover-module moderator notes** (short structured notes) | `quizzes` | standard | 0.3 | 300 | strict JSON | module completion |
| 6 | **Person summary** (Zone C matching context) | `matching` | fast | 0.3 | 250 | text | attribute/quiz change |
| 7 | **Embeddings** (attributes, notes, person summaries) | `matching` | embed | — | — | vector | on write |
| 8 | **Freshness detector** ("still into X?") | `profiles` | fast | 0 | 200 | strict JSON {attribute_id, question} | weekly batch |
| 9 | Voice-to-text captions | `stories` | speech-to-text | — | — | text | on use |
| 10 | Recap podcast stitching | `recap` | audio pipeline (no LLM) | — | — | audio | weekly |
| 11 | **Agent reasoning + tools** (`personal_agent` lane) | `assistant` | standard | 0.3 | 2000 | text + tool calls | per user request |
| 12 | Agent query understanding | `assistant` | fast | 0.2 | 300 | strict JSON | per request |
| 13 | Agent speech-to-text / reply phrasing | `assistant` | STT / fast | — / 0.4 | — / 400 | text | voice sessions |

*Jobs 11–13 run on the separate `personal_agent` lane (see §5a and `AGENT.md`) — single-user, may see the requester's own names/notes, confirmation-gated tools.*

**Temperature logic:** judgment/extraction tasks (4, 5, 8) run near-0 for consistency; user-visible prose (2, 3, 6) runs ~0.3–0.4 — enough warmth to not sound robotic, low enough to never get creative with facts. Nothing runs above 0.5: creativity is a liability when the source of truth is someone's life.

**No LLM in any hot path.** Matching, feeds, and reveals are pgvector + arithmetic at request time (`MATCHING-ALGORITHMS.md`); LLM work happens at write time or in batches, async via a job queue with retries.

## 3 · Prompt engineering standards

- **Versioned prompt registry.** Every prompt lives in the repo (`packages/ai/prompts/<job>/vN.ts`) with version, changelog, and its eval set. The gateway logs which prompt version produced every output. Changing a prompt = new version + eval pass (§6) — never edit-in-place.
- **Every system prompt opens with the privacy preamble:** *"You will never receive names, contact info, or images. Refer to the subject only as 'this person'. Use ONLY the provided material; if it is insufficient, return null. Never invent facts."*
- **Structured output by default.** Jobs 3–8 demand strict JSON against a schema; the gateway validates and retries once on invalid, then fails silent.
- **Grounding rule for summaries (hard):** day/week summaries are built ONLY from the person's own words (update text + transcripts) — never from photos, never inferred. If the words are too thin for a day, that day returns null and the UI shows the photo without a caption. An invented "fact" in a summary is a sev-1 bug.
- **Tone guide for user-visible text:** warm, specific, short; second person avoided in summaries about others ("Sent the climbing route she'd been projecting" not "She engaged in climbing activity"); no emojis, no hype, no hedging.
- **Per-quiz moderator instructions** are authored data, not code (`QUIZ-ENGINE.md`) — the quiz prompt template interpolates them.

## 4 · The RAG engine (built in-house, on our stack)

RAG = the app retrieves the right de-identified context at inference time, instead of any model being trained on user data. Ours is deliberately simple and owned end-to-end:

**Corpus (what gets embedded)** — Zone B/C only, keyed by opaque IDs:
- Each `matchable` attribute row, normalized to canonical text ("hobby: bouldering — 'started during lockdown, V4'").
- Quiz dimension results (as structured text with confidence).
- Discover-module moderator notes (Zone C).
- The person summary (job 6) as one document.

**Pipeline:** write → normalize → PII-scrub (§5) → embed (job 7) → upsert to pgvector (HNSW index) with `{opaque_id, kind, visibility_flags, updated_at}`. Attribute edit → re-embed that row; person-level change → regenerate person summary + its embedding. **Deletion/opt-out → embeddings and summaries drop in the same cascade** (`DATA.md`).

**Retrieval flows:**
- *Matching:* ANN over person-embeddings for candidate pre-filter; per-pair, retrieve both sides' top-k attribute rows to compute overlap evidence.
- *Quiz moderator:* retrieves the taker's prior relevant dimensions/notes (their own data only) so adaptation is informed.
- *Freshness:* retrieves stale-flagged rows (`maybe_stale`) + recent activity text to pick ONE quick-check question.
- *Summaries:* the week's day-texts for that author only.

**Rules:** retrieval never crosses tier visibility for anything user-facing; retrieval for Mode-1 matching stays opaque; k small (≤20); everything cached with invalidation on write.

**"Training" clarified:** foundation models (Anthropic/OpenAI) are used via API with no-training/zero-retention terms and **never fine-tuned on user data**. What *learns* is our own lightweight ranking layer over de-identified features — specced in `MACHINE-LEARNING.md`. RAG supplies knowledge at inference; ML tunes weights from outcomes; neither puts a user's life inside a model's weights.

## 5 · The PII firewall (`packages/ai/gateway`)

Every AI call goes through ONE module. There is no second path — importing an AI SDK anywhere else fails lint/review.

The gateway, in order:
1. **Holds the keys** (from Secrets Manager; clients never see them).
2. **Scrubs + validates the payload:** allowlist of field shapes per job; rejects payloads containing keys like name/email/phone/handle; regex-scans free text for emails, phone numbers, and @handles (strip or reject); asserts subject references are opaque IDs. Photos/media are **never** accepted for any LLM job.
3. **Enforces per-job config:** model, temperature, max tokens, timeout, JSON schema.
4. **Executes** with retry/backoff, circuit breaker per provider, idempotency key per (job, subject, content-hash) so a retried queue job can't double-spend.
5. **Logs de-identified metadata** (job, prompt version, latency, tokens, cost — never the content) → cost dashboards + budget alerts per job.
6. **Validates output** (schema, grounding spot-checks for summaries) → retry once → fail silent.

## 6 · Evaluation & quality

- **Golden sets per job** (curated inputs + expected properties) run in CI on any prompt/model change; summaries checked for grounding (every claim maps to source words), moderator checked for score-invariance (it must never alter deterministic scores).
- **Implicit quality signals** (from product events, not the analytics store): summary edit/delete rate, quick-check "yes" rate (freshness precision), quiz-adaptation frequency per question (high = unclear question), suggestion conversion (`MACHINE-LEARNING.md`).
- **Human spot-check queue** in the admin console (`ADMIN.md`): random de-identified samples of each job's output for the founder to grade; grades feed prompt iteration.
- Provider/model swaps are config changes gated on the same evals.

## 7 · Reliability & cost

- All LLM work async (queue + workers); user actions never block on a model.
- Timeouts (10s standard / 30s batch), retry ×2 with backoff, circuit breaker per provider, provider fallback where quality-equivalent.
- Batch embeddings; cache person summaries; content-hash de-dupe.
- Per-job monthly budgets with alerts; the cost log (§5.5) is reviewed at the co-op economics level — AI spend is part of transparent economics (`COOP-PORTAL.md`).

## 8 · Privacy invariants (restate in code comments)

- No PII, contact info, or media ever reaches a model; subjects are opaque IDs; the gateway is the enforcement point.
- Summaries: user's own words only; never photos; pre-generated at post time; author can delete them.
- Quiz explanations: read by the moderator server-side, shown to no one, never cross a connection, deletable.
- Foundation models: API-only, no-training terms, no fine-tuning on user data. Deletion/opt-out cascades to embeddings, summaries, notes.
- Analytics store stays walled off from all AI/matching (per `analytics-rules.mdc`).


## 5a · The two lanes through one gateway

Every call still passes through the single gateway, but on one of two labeled lanes with different scrub rules:

| | `deidentified` lane | `personal_agent` lane |
|---|---|---|
| Used by | jobs 1–10 (matching, summaries, moderation) | jobs 11–13 (the assistant, `AGENT.md`) |
| Sees names/PII | **never** — opaque IDs, scrubber rejects | **requester's own visible data only** |
| Direction | reasons about *others* → must be identity-blind | reflects *your own* data back to *you* |
| Context source | RAG over Zone B/C (opaque) | the app's own permission layer, as user U |
| Scrub step | strip/reject names, emails, phones, handles, media | verify auth = U; verify every context item is U-visible; reject media |
| Shared invariants | keys server-side · no-training/zero-retention API terms · content discarded per request · only de-identified metadata logged |

The lane is part of the per-job config — a job cannot switch lanes at runtime, and a `deidentified` job that receives a payload containing PII still hard-fails even if a bug upstream let it through. Two lanes, one chokepoint, no third path.

## 9 · How it works end-to-end (two walkthroughs)

**A story post becomes a week summary (jobs 1–3):**
1. Maya posts Tuesday's update (video + caption). The post itself completes instantly — nothing waits on AI.
2. A queue job transcribes the video (job 1) and writes the transcript to the story row.
3. A second job builds the *day summary* (job 2): gateway → scrub (opaque author ref, caption + transcript text only, media rejected) → fast model at temp 0.4 → 1–2 sentences → grounding check (every claim maps to her words) → stored on the day. Too thin? Returns null; the day shows just the photo.
4. The *week summary* (job 3) re-rolls from the accumulated day texts each post, so the Catch-Up's week-hero is always pre-generated — nobody ever waits on a spinner at read time.
5. Maya deletes Tuesday's post → the transcript, day summary, and its contribution to the week summary drop in the same cascade.

**A quiz response is moderated (job 4):**
1. Sam finishes the values quiz. The deterministic scorer computes dimension scores — pure arithmetic, no model.
2. The moderator call goes gateway → scrub (answers + optional explanations, opaque ref) → standard model at temp 0.2 with the quiz's authored `moderator_instructions` → strict JSON: per-dimension confidence, quality flags, and (within `adaptation_policy`) at most N inserted clarifier questions.
3. Invalid JSON → one retry → fail silent: scores stand at default confidence, no adaptation. The moderator can *never* alter a score — the schema has no score field to return.
4. Confidence rides along to matching, where low-confidence dimensions are discounted (`MATCHING-ALGORITHMS.md`).

## 10 · Operational machinery

- **Queue & workers:** all LLM work runs as queue jobs (per `INFRASTRUCTURE.md`) with per-job concurrency caps, exponential backoff (×2), and a dead-letter queue reviewed in admin. Idempotency key = `(job, subject, content_hash)` so a redelivered job can't double-write or double-spend.
- **Config table (`ai_config`):** one row per job — `{job, lane, model_id, temperature, max_tokens, timeout_ms, schema_id, monthly_budget_usd, enabled}`. Model swaps, temp tuning, and kill-switching are row updates, not deploys. `enabled=false` = that surface fails silent app-wide.
- **Failure modes, decided in advance:**

| Failure | Behavior the user sees |
|---|---|
| Model/provider down | Surface hides (no summary, no adaptation); app fully usable |
| Invalid JSON twice | Same as down — fail silent, log for spot-check |
| Grounding check fails | Summary suppressed (never "best effort" prose about someone's life) |
| Budget exceeded | Job auto-disables + admin alert; nothing degrades loudly |
| Scrubber rejects payload | Call never leaves the building; bug ticket, not a user error |

- **Cost model:** the gateway's per-call log (tokens × price, by job) rolls into a monthly per-job dashboard in admin and the co-op economics view. Rule of thumb: embeddings and fast-tier jobs are pennies; watch jobs 3, 4, and 11 — they're the spend.

## 11 · How it can grow (adding touchpoint #14 safely)

The registry is designed to absorb new AI jobs without re-litigating privacy each time. A new touchpoint ships only by:
1. Adding a **registry row** here (model tier, temp, tokens, output, trigger) + an `ai_config` row.
2. Declaring its **lane** — and if `personal_agent`, pointing at the `AGENT.md` rules it obeys.
3. Writing the **prompt as v1 in the repo** with a golden eval set; CI green before enable.
4. Passing the **invisible-AI test**: no new sparkle icons, no "AI" labels; the output must read as Bridger being attentive, and fail silent.
5. **Budget + kill switch** set before `enabled=true`.

Candidate future touchpoints that fit this mold: event-description polish (author-side, their words only), inside-joke context suggestions (author-side), smarter freshness priors per category, agent tools per `AGENT.md` §14. Anything requiring content the scrubber would reject is not a candidate — the firewall doesn't grow exceptions.

## Acceptance criteria

- [ ] Every AI call routes through the gateway; no other file imports an AI SDK; keys server-side only.
- [ ] The registry table (§2) is implemented as per-job config: model, temp, max tokens, schema, timeout, budget.
- [ ] Prompts are versioned with eval sets; CI runs goldens on change; outputs log prompt version.
- [ ] Summaries are grounded (words-only), null when thin, deletable; no user-visible surface ever says "AI".
- [ ] RAG corpus is Zone B/C, opaque-ID keyed, re-embedded on change, dropped on delete/opt-out.
- [ ] PII scrub rejects names/emails/phones/handles and all media; idempotency + circuit breakers in place.
- [ ] The app functions fully with every AI job disabled (fail-silent surfaces).
- [ ] The `personal_agent` lane exists as labeled per-job config; lanes cannot switch at runtime; the deidentified lane hard-fails on PII even from internal bugs.
- [ ] `ai_config` drives model/temp/tokens/timeout/budget/enabled per job; kill-switching is a row update.
- [ ] Queue jobs are idempotent by (job, subject, content-hash); dead-letter queue is surfaced in admin.
- [ ] The failure-mode table's behaviors are implemented (fail silent, suppress on grounding failure, auto-disable on budget).
- [ ] New touchpoints follow the §11 checklist (registry row, lane, v1 prompt + goldens, invisible-AI test, budget) before enable.

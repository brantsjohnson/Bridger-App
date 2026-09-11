# MACHINE-LEARNING.md — How Bridger learns

How the app gets smarter from real use — so it feels **alive and aware, never creepy**. Read with `AI-SYSTEM.md` (models/RAG/firewall), `MATCHING-ALGORITHMS.md` (where learning is applied), `QUIZ-ENGINE.md`, `DATA.md`.

---

## 1 · The objective function (this is the whole ballgame)

Most social ML optimizes **engagement** — time in app, taps, return visits. Bridger explicitly does not. Our models optimize for **real-world connection outcomes**:

- suggestions that become **Close friendships** (promotions to Close are the gold label)
- reveals that lead to a **message or a plan**
- touch-grass signals and events that produce **actual meetups**
- friendships that **persist** (still tiered months later)

Time-in-app is **not** a reward signal anywhere. If a model change increases taps but not connections, it's a regression. This single choice is what keeps "alive and aware" from sliding into "attention trap" — the machine's incentives point at the user's real life.

## 2 · What Bridger learns from (signal taxonomy)

**Explicit, high-trust (primary):**
- Tier placements & changes — placed/promoted to **Close** (strongest positive), placed in **Friends** (real bond, weaker than Close), demoted (negative), removed (strong negative), **blocked (strongest negative; retroactive hard-negative on that pair's features)**. We just met → Acquaintances is not a style label.
- Suggestion outcomes — added / approved (positive); dismissed / "don't suggest again" / declined (negative).
- Quiz results **with the moderator's confidence** — low-confidence dimensions are discounted as features, not trusted.
- Quick-check answers — "yes, still into it" (label: fresh) / edited (label: stale→corrected). This is human-in-the-loop label correction.

**Behavioral, product-level (secondary):**
- Post-reveal conversion (message sent, plan made), event attendance after suggestion, touch-grass responses, module completion.
- These come from **domain tables / product events** — NOT the analytics store. The UX-analytics store (clicks, rage-clicks) is **walled off from all learning** (`analytics-rules.mdc`); it exists for the founder to fix UX, never to model people.

**Never used as signals:** message/caption/explanation *content*, photos, precise location, session length, scroll behavior, inferred mood/emotion. If it isn't an intentional act about a *relationship*, it doesn't teach the matcher.

All signals land in `matching_feedback(pair_features_snapshot, outcome, weight, created_at)` on **opaque IDs** — the feature store is de-identified from birth.

## 3 · Model progression (advanced ≠ opaque)

- **v1 — transparent weighted scoring** (live from day one): the named components in `MATCHING-ALGORITHMS.md` with hand-set weights in `matching_config`. Every suggestion is explainable. Meanwhile, every outcome is logged — v1's real job is **generating labeled data**.
- **v2 — fitted weights** (when ≥ a few thousand labeled pairs): logistic regression over the SAME named features. Weights become learned; explanations unchanged. Offline eval (AUC on held-out outcomes + top-k precision on "became Close") must beat v1 before rollout.
- **v3 — small rankers + smarter representation** (at real scale): gradient-boosted ranker over the feature store; optionally learn a light re-weighting of embedding dimensions from outcome pairs (a learned similarity metric — trained on de-identified vectors + outcomes only, never raw content). Per-user taste vectors updated from *their* accepted/declined suggestions.
- **Exploration:** a small ε (start 10%) of suggestion slots go to diverse/uncertain candidates (that still pass all eligibility gates and thresholds) so the system keeps learning and doesn't tunnel on one "type." Exploration never lowers the evidence bar — it explores *within* qualified candidates.
- **Never:** deep opaque end-to-end models over raw behavior, fine-tuning foundation models on user data, or any model whose suggestion can't be explained by shareable evidence.

## 4 · Learning-loop hygiene (the unglamorous stuff that makes it good)

- **Feature snapshots at decision time** (`pair_features_snapshot`) so training sees what the model saw — no leakage from post-outcome data.
- **Popularity-bias control:** specificity/inverse-frequency weighting already counters generic overlap; additionally cap how often any one person appears across others' suggestion sets per cycle (no "everyone gets shown the same 5 charming people").
- **Fairness of exposure:** monitor suggestion distribution; quiet/new profiles that pass gates must still surface (exploration slots help). Cold-start users lean on onboarding basics + Discover Me modules until embeddings mature.
- **Holdouts & rollback:** every model/weight change ships behind a config flag with a holdout cohort; compare connection outcomes, not clicks; instant rollback = flip config.
- **Drift & retraining:** retrain on a schedule (e.g. monthly) + on drift alarms (feature distributions, conversion drop). Blocks propagate to training data immediately.
- **Data minimization & TTL:** feedback rows carry only features + outcome; raw snapshots age out (e.g. 18 months) — aggregates persist, specifics don't. Account deletion purges the person's rows AND pair-rows they appear in.
- **Metrics that matter (the dashboard):** suggestion → add rate · add → Close rate (the north star) · reveal → message/plan rate · dismiss & block rates on suggestions (should FALL as learning works) · exploration yield · per-cohort exposure.

## 5 · Alive, not creepy (product rules the ML must obey)

The line between "this app gets me" and "this app is watching me" is **provenance + framing**. Rules:

1. **Only reference what they gave.** Any user-visible output (suggestion evidence, summaries, quick-checks) may only cite things the person explicitly shared at a tier the viewer has. Never surface behavior ("you looked at…", "you've been quiet lately").
2. **Insight appears as Bridger being thoughtful, not observant.** "You both live for climbing" (shared fact) — never "you two message similarly" (inference).
3. **No emotion/state inference, ever.** The model may notice an attribute is stale; it may not decide someone is sad, lonely, or vulnerable, and nothing may target such states.
4. **Predictable cadence.** Quick-checks are occasional and single; suggestions refresh on a rhythm; nothing pounces in real time on a user's action (the bridge suggestion waits until after the reveal). Instant reactions to behavior are what feel like surveillance.
5. **User edits are law.** A quick-check "no" or an attribute edit immediately outranks anything learned; the system defers visibly (matches update, old inferences drop).
6. **Thresholds never bend for liveliness.** An empty Discover is always preferable to a stretched match (`MATCHING-ALGORITHMS.md`).
7. **The user can turn it off.** `discoverable=false` / matchable-flag removal stops learning about them and drops their embeddings — same cascade as deletion.

## 6 · Where learning shows up (the "aware" moments, mapped)

- **Discover** ranks better over time; evidence headlines get more specific-surprising as specificity stats mature.
- **Bridge suggestions** get choosier about reciprocal quads that actually convert.
- **Event "to meet"** picks improve from attendance outcomes.
- **Quizzes** self-improve: questions with chronic low confidence / heavy adaptation get flagged in admin for rewrite (the moderator's telemetry is the quiz's QA).
- **Adaptation threshold:** each quiz's `adaptBelowConfidence` starts authored (measurement quizzes ~0.35; disclosure = off / `1.0`). Over time, tune the floor per quiz from `quiz_adapted` rate + completion / confidence lift so well-authored quizzes stay mostly AI-free and muddy ones get help sooner.
- **Freshness** learns per-category staleness priors (hobbies churn; hometowns don't).
- **Weights/thresholds** drift toward what produces Close friendships in *this* community, not a generic one.


## 7 · How learning actually happens (one pair, end to end)

1. **Decision time.** Discover considers suggesting Ana to Ben. The scorer computes named features — quiz_alignment 0.71 (confidence-weighted), embedding_similarity 0.63, shared_attributes 0.82 (two high-specificity overlaps: bouldering + ceramics), mutual_warmth 0.5, context_fit 0.6 — combines them with `matching_config` weights → 0.71, above threshold, evidence gate passed. The suggestion renders; the **feature snapshot is frozen** into `matching_feedback` at that moment.
2. **Outcome arrives.** Ben adds Ana (weak positive, weight 0.3). Three weeks later he promotes her to Close — the **gold label** (1.0) lands on the same snapshot. Had he tapped "don't suggest again": −0.5; blocked: −1.0 retroactive on the pair.
3. **Training (v2+).** Monthly, the logistic regression refits over all snapshots→outcomes. Suppose shared_attributes at high specificity keeps predicting Close while raw embedding similarity adds little for this community: its weight rises, embedding's falls. Nothing about the *features* changes — only how much each is trusted.
4. **Gate & ship.** Offline eval on a held-out month: candidate beats incumbent on top-k precision for became-Close (not clicks). Ship behind the config flag to a cohort; watch dismiss/block rates fall; roll on or roll back by flipping the row.
5. **Deletion.** Ana deletes her account → her rows AND every pair-row she appears in purge; the next refit never sees her.

## 8 · The feature dictionary & labels (the contract)

Features are **named, bounded [0–1], and human-readable** — the same names in code, config, snapshots, and this doc: `quiz_alignment` (computed over the **intersection of quizzes both people completed** at compatible versions — 0 when none shared; each shared quiz is its own evidence item; **per-dial psychology** in `MATCHING-PSYCHOLOGY.md`) · `embedding_similarity` · `shared_attributes` (inverse-frequency weighted) · `moderator_notes_affinity` · `mutual_warmth` · `context_fit` (+ per-user taste vector, v3). Labels: promoted-to-Close **+1.0** · placed-in-Friends **+0.55** · added/approved **+0.3** · reveal→message/plan **+0.4** · event-attended-after-suggestion **+0.4** · dismissed **−0.3** · don't-suggest-again **−0.5** · demoted **−0.5** · removed **−0.7** · blocked **−1.0**. Adding a feature or label = a PR to this table first — the dictionary is the contract that keeps every suggestion explainable.

## 9 · Cold start (a new community, day one)

- **v1 weights work with zero history** — hand-set, transparent; learning starts as logging, not behavior.
- **A new user** leans on onboarding basics + Discover-Me modules; embeddings mature as they fill modules (each answer visibly improves their matches — the incentive is honest).
- **Small-n rules:** no v2 fit below a few thousand labeled pairs (v1 stays); exploration ε starts higher (~15%) when data is thin and anneals down; the evidence gate never relaxes — early Discover being sparse is correct, not a bug to paper over.

## 10 · The learning dashboard (what "is it working" looks like)

One admin view: **north star** = add→Close rate on suggested pairs (trend, by cohort) · suggestion→add rate · reveal→message/plan rate · dismiss + block rates on suggestions (**should fall** as learning works) · exploration yield (do ε-slots convert?) · **exposure distribution** (no one hogging suggestion slots; quiet profiles surfacing) · feature-weight history over versions (the story of what this community actually bonds over) · drift alarms. Every number computes from `matching_feedback` + domain tables — never the UX-analytics store.

## 11 · How it can grow (and what it never becomes)

In order, each gated on beating the incumbent at connection outcomes: **v2** logistic (same features) → **v3** boosted ranker + learned embedding re-weighting + per-user taste vectors → **community priors** (per-community weight sets — what predicts friendship in a climbing town ≠ a college co-op) → **temporal features** (seasonality of touch-grass conversion; never time-in-app) → **quiz self-improvement loop** (chronic low-confidence questions auto-flagged for rewrite in admin).

Never on the roadmap, by design: engagement objectives in any form · deep end-to-end models over raw behavior · content-based features (message/note text) · emotion or vulnerability inference · cross-community data pooling that would leak one community's patterns into another. If a future idea needs one of these, the answer is already written down: no.

## Acceptance criteria

- [ ] No model anywhere optimizes engagement/time-in-app; offline + online evals score connection outcomes only.
- [ ] All learning reads domain/product tables on opaque IDs; the UX-analytics store is untouched by any model.
- [ ] v1 transparent weights live with full feedback logging; v2/v3 gated on offline eval beating the incumbent on connection metrics.
- [ ] Exploration slots exist, bounded, and never bypass eligibility gates or thresholds.
- [ ] Snapshot-at-decision training, holdout cohorts, config-flag rollback, drift alarms, scheduled retrains.
- [ ] Feedback TTL + deletion purge (including pair-rows) implemented and tested.
- [ ] Every user-visible "aware" moment cites only tier-visible shared facts; no behavioral references; no emotion inference; user edits override learned state immediately.
- [ ] The feature dictionary + label weights (§8) exist as one source of truth shared by code, config, and snapshots; changes land there first.
- [ ] Cold-start rules hold: v1-only below the data floor, higher annealed ε early, evidence gate never relaxed.
- [ ] The learning dashboard (§10) computes exclusively from matching_feedback + domain tables.
- [ ] Deletion purges a person's rows and all pair-rows before the next refit.

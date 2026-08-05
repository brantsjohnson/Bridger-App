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
- Tier placements & changes — placed/promoted to **Close** (strongest positive), demoted (negative), removed (strong negative), **blocked (strongest negative; retroactive hard-negative on that pair's features)**.
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
- **Freshness** learns per-category staleness priors (hobbies churn; hometowns don't).
- **Weights/thresholds** drift toward what produces Close friendships in *this* community, not a generic one.

## Acceptance criteria

- [ ] No model anywhere optimizes engagement/time-in-app; offline + online evals score connection outcomes only.
- [ ] All learning reads domain/product tables on opaque IDs; the UX-analytics store is untouched by any model.
- [ ] v1 transparent weights live with full feedback logging; v2/v3 gated on offline eval beating the incumbent on connection metrics.
- [ ] Exploration slots exist, bounded, and never bypass eligibility gates or thresholds.
- [ ] Snapshot-at-decision training, holdout cohorts, config-flag rollback, drift alarms, scheduled retrains.
- [ ] Feedback TTL + deletion purge (including pair-rows) implemented and tested.
- [ ] Every user-visible "aware" moment cites only tier-visible shared facts; no behavioral references; no emotion inference; user edits override learned state immediately.

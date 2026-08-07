# Matching module — plain English

## How a suggestion is born (Mode 1)

1. You turned Discover on and filled enough Everyone+matchable facts (or finished a Discover quiz).
2. Nest looks at **friends of your friends** only. Blocks, skips, people you already know, and people who turned Discover off are out.
3. For each remaining person, Nest scores **six named features** (quiz overlap, embedding closeness, shared Everyone facts, moderator-note affinity, mutual-friend warmth, context). If a pair lacks data for a feature, that feature is **0** — not “turned off.”
4. Evidence gate: they need **one shared completed Discover quiz** OR **three** meaningful Everyone+matchable overlaps. Below the score threshold → **no suggestion** (empty Discover is correct).
5. Up to five suggestions are stored. A small exploration slice reshuffles among people who already passed the gate.
6. The feature snapshot is frozen into `matching_feedback` so later friendship outcomes can teach the weights — never from PostHog clicks.

Suggestion card “why” titles only cite **Everyone-visible matchable** facts. Private quiz dimensions may help the score silently; they never appear as titles.

## How a reveal gets its content (Mode 2)

1. You connect. Beat 0 asks how you met and sets the friendship tier.
2. **Until beat 0 is saved, Nest returns no overlap.**
3. After that, `pair-overlap` compares facts each person shared at the tier they granted.
4. Strongest overlap becomes the headline; up to three extras; quiz lines are dimension label + % only (never answers).
5. Thin overlap returns honest shapes (headline only, or `strongest: null`) — never invented filler.

## What this module never does

- Call the AI gateway on the hot path
- Read the Assistant / personal_agent tables
- Read UX analytics
- Use Friends/Close-only fields for stranger suggestions
- Run as Supabase Edge Functions (Nest only)

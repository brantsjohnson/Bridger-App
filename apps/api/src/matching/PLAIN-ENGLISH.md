# Matching module — plain English

## How a suggestion is born (Mode 1)

1. You turned Discover on and filled enough Everyone+matchable facts (or finished a Discover quiz).
2. Nest looks at **friends of your friends** only. Blocks, skips, people you already know, and people who turned Discover off are out.
3. For each remaining person, Nest scores **six named features** (quiz overlap using each quiz's own rule, embedding closeness, shared Everyone facts, moderator-note affinity, mutual-friend warmth, context). If a pair lacks data for a feature, that feature is **0**, not turned off. Humor and values want the same scores. Assertiveness wants opposites. The Friend Zone uses a style chart.
4. Evidence gate: they need **one shared completed Discover quiz** OR **three** meaningful Everyone+matchable overlaps. Below the score threshold → **no suggestion** (empty Discover is correct).
5. Up to five suggestions are stored. A small exploration slice reshuffles among people who already passed the gate.
6. The feature snapshot is frozen into `matching_feedback` so later friendship outcomes can teach the weights — never from PostHog clicks.

Suggestion card “why” titles only cite **Everyone-visible matchable** facts. Private quiz dimensions may help the score silently; they never appear as titles.

## How a reveal gets its content (Mode 2)

1. You connect. Beat 0 asks how you met and sets the friendship tier.
2. **Until beat 0 is saved, Nest returns no overlap.**
3. After that, `pair-overlap` compares facts each person shared at the tier they granted. Grants are one-way: you see what they labeled for the circle they put you in. We just met = Acquaintances.
4. Strongest overlap becomes the headline; up to three extras; quiz lines are dimension label + % only (never answers).
5. Thin overlap returns honest shapes (headline only, or `strongest: null`). The phone shows a Personality quizzes hint. Never invented filler. Adding a friend is never blocked on quizzes.

## How Close friends teach the matcher

When you place someone in Friends or Close, Nest writes a learning row (`matching_feedback`) with the six numbers from that pair. Nightly Nest reads those rows and proposes new weights. Live weights only change after enough Close labels, so early noise cannot yank Discover. This is a Nest job, not an Edge Function.

## What this module never does

- Call the AI gateway on the hot path
- Read the Assistant / personal_agent tables
- Read UX analytics
- Use Friends/Close-only fields for stranger suggestions
- Run as Supabase Edge Functions (Nest only)

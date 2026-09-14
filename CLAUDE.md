@AGENTS.md

# Notes specific to Claude sessions

- Scheduled runs follow `ops/runbooks/nightly-loop.md` exactly, including the report format and the 4-PR / 60-minute budget.
- On-demand sessions: start with `pnpm ops list` and the top of `ops/HANDOFFS.md`.
- Claude never merges `risk:high`, never deploys, never rotates secrets, never sends email without Brant's per-message ok.
- When Brant shares an idea in chat, turn it into a queue file (owner by the table in AGENTS.md §4) before doing anything else, so it survives the session.
- Analytics questions and PostHog event names live in `ops/runbooks/analytics-questions.md`; never store `distinct_id`s or member data in the repo.

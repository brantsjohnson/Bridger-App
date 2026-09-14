# DECISIONS: the ops decision log

Append only. Product and spec decisions also get logged in `guide-docs/INDEX.md` §6; this file is for how we work.

| Date | Decision | Why | Who |
|---|---|---|---|
| 2026-09-14 | Shared agent memory lives inside the repo under `ops/` | Every agent already has the repo; git is the audit trail; renders on phone | Brant |
| 2026-09-14 | Overnight autonomy: auto-merge `risk:low` PRs when CI is green; auth, payments, user data, infra, legal drafts wait for Brant | Ship small fixes while Brant sleeps without risking accounts or money | Brant |
| 2026-09-14 | Risk is decided by path (see `ops/RISK-TIERS.md`) and enforced by CI label plus CODEOWNERS, not by agent judgment | Judgment drifts; paths do not | Claude, pending Brant confirm |
| 2026-09-14 | Branch naming `<owner>/<queue-id>-<slug>`; PR body must cite the queue id | Lets the nightly report tie merges to work items automatically | Claude |
| 2026-09-14 | Priority order for Claude's first weeks: agent coordination, then bug triage, then PostHog depth, then Figma component library | Brant's pick 2026-09-14 | Brant |
| 2026-09-14 | Set up GitHub for Claude (push, PR, repo settings) via a fine-grained PAT Brant generated and pasted in chat, rather than the Cowork GitHub-source picker | Brant is non-technical; doing the GitHub setup directly was faster and less confusing than walking him through settings pages | Brant, Claude |

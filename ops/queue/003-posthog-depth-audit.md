---
id: 003
title: PostHog depth audit: what is actually captured today and what the funnels need
owner: claude
status: todo
risk: low
priority: p1
area: analytics
needs: secret
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

Brant wants to know where people get stuck, stop signing up, stop paying, never add friends, or never use a feature. The taxonomy is thorough on paper; this checks what the running app really sends and builds the first funnels and dashboards in PostHog so the questions in `ops/runbooks/analytics-questions.md` can be answered every week.

## Done means

- [ ] Inventory: every `analyticsId`, surface, flow, and product event in code vs `ANALYTICS-TAXONOMY.md` (script under `scripts/` that prints the gaps)
- [ ] Confirm the RN sink is receiving events from TestFlight builds (project key set in EAS env, opt-in fires after sign-in)
- [ ] PostHog: one dashboard "Bridger: stuck points" with the ten insights from the runbook, links recorded in the runbook
- [ ] Session replay stays off (privacy decision); document why in the dashboard description
- [ ] Gaps filed as queue items for Cursor, with taxonomy rows

## Notes and handoffs

2026-09-14 claude: needs a PostHog personal API key with read access to insights, stored as a scheduled-task secret, not in the repo. Ask Brant. Also confirm whether the `.claude/skills/self-driving-setup` (PostHog Signals) run was ever completed; the `./posthog-setup-report.md` it expects is not in the repo.

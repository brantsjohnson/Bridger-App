---
id: 002
title: Turn on auto-merge, branch protection, and give Claude push access
owner: brant
status: todo
risk: block
priority: p0
area: ops
needs: brant
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

The overnight loop cannot merge anything until GitHub is configured to allow it, and Claude cannot open PRs until the repo is added as a source for its sessions.

## Done means

- [ ] `brantsjohnson/Bridger-App` added as a GitHub source for Claude (Cowork repo picker) with push access
- [ ] Settings > General: Allow auto-merge on, Allow squash merging on
- [ ] Settings > Branches: rule on `main` requiring `CI / verify` and `Secret scan` checks and Code Owner review
- [ ] Settings > Actions: workflow permissions read and write; allow Actions to create and approve PRs
- [ ] Labels exist: `risk:low`, `risk:high`, `risk:block`, `agent:cursor`, `agent:claude`, `agent:grokbot` (the risk-label workflow creates the risk ones on first run)
- [ ] Cursor cloud agents / Bugbot enabled on the repo so `@cursor` in an issue starts work (confirm in cursor.com dashboard)

## Notes and handoffs

2026-09-14 claude: exact steps are in `ops/RISK-TIERS.md` bottom section.

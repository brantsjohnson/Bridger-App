---
id: 002
title: Turn on auto-merge, branch protection, and give Claude push access
owner: brant
status: done
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

- [x] `brantsjohnson/Bridger-App` reachable by Claude via a fine-grained PAT Brant generated (stored only in the device git credential store, never in a file); the cloud-container Cowork repo picker is still a separate, unconfirmed path
- [x] Settings > General: Allow auto-merge on, Allow squash merging on, delete branch on merge on
- [x] Settings > Branches: rule on `main` requiring `verify` and `gitleaks` checks, 1 approval, and Code Owner review
- [x] Settings > Actions: workflow permissions read and write; allow Actions to create and approve PRs
- [ ] Labels exist: `risk:low`, `risk:high`, `risk:block`, `agent:cursor`, `agent:claude`, `agent:grokbot` (the risk-label workflow creates the risk ones on first run)
- [ ] Cursor cloud agents / Bugbot enabled on the repo so `@cursor` in an issue starts work (confirm in cursor.com dashboard)

## Notes and handoffs

2026-09-14 claude: exact steps are in `ops/RISK-TIERS.md` bottom section.

2026-09-14 claude: done via a fine-grained PAT Brant generated and pasted in chat. Pushed ops/agent-hub, opened and merged PR #41 (all checks green), then set repo auto-merge/squash, Actions PR permissions, and branch protection via the API. Cursor cloud agents / Bugbot enablement on this repo is still unconfirmed.

---
id: 001
title: Rotate the leaked Magic Patterns token and make the repo private
owner: brant
status: todo
risk: block
priority: p0
area: ops
needs: brant
created: 2026-09-14
updated: 2026-09-14
pr:
bug: B-001
---

## Why

`.cursor/mcp.json` has carried a live `mp_live_...` bearer token since the first commit and the repo is public. Anyone can use it against the Magic Patterns account. The code change (read the token from `${env:MAGIC_PATTERNS_TOKEN}`) ships in the `ops/agent-hub` PR; the rotation and the visibility flip are Brant-only actions.

## Done means

- [ ] Old token revoked in Magic Patterns, new one issued
- [ ] New token stored only in Brant's shell env (`export MAGIC_PATTERNS_TOKEN=...` in `~/.zshrc`) and in the Cursor MCP env, never in git
- [ ] Repo set to private, or a written decision in `ops/DECISIONS.md` to keep it public and a sweep of guide-docs for anything that should not be public
- [ ] Secret scan workflow green on `main`

## Notes and handoffs

2026-09-14 claude: found during the first repo audit. Git history still contains the old token even after the file is fixed; rotation is the only real fix.

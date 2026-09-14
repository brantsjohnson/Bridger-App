# AGENTS.md: read this first, whichever agent you are

This repo is worked on by three agents plus the founder (Brant). Cursor, Claude, and Grokbot all read this file. It is short on purpose; it points at the real rules.

## 1. The law (do not skip)

- `.cursor/rules/guide-rules.mdc` is the standing rule set: stack is decided, UI from Magic Patterns, accessibility and store compliance from day one, plain-language comments on every file, privacy invariants, definition of done, doc authority order. **No em dashes in anything you write.**
- `guide-docs/INDEX.md` is the map of every product spec and the canonical decisions that win conflicts.
- `.cursor/rules/naming-rules-mdc.mdc` and `analytics-enforcement-mdc.mdc`: every element, sheet, flow, and outcome is named and measured in `guide-docs/ANALYTICS-TAXONOMY.md`.
- `guide-docs/docs/PRIVACY.md` and `TERMS.md` change in the same PR as any data, permission, payment, AI, or UGC change.

## 2. The desk (how work moves between us)

- `ops/README.md` explains the shared hub. Read it once.
- `ops/queue/` is the task list (one file per task, frontmatter says owner, status, risk). `pnpm ops list` prints it.
- `ops/HANDOFFS.md` is the message board. Tag `@claude`, `@cursor`, `@grokbot`, `@brant`.
- `ops/BUGS.md` is the bug log. File first, fix second.
- `ops/RISK-TIERS.md` decides what auto-merges (`risk:low`, CI green) and what waits for Brant (`risk:high`: auth, payments, user data, infra, legal drafts, CI itself).

## 3. Branches and PRs

- Never commit to `main`. Branch `<owner>/<queue-id>-<slug>` (example `cursor/014-fix-keyboard-avoiding`).
- Fill the PR template. Cite the queue id. CI labels the risk. Do not remove `risk:high`.
- One queue item per PR unless inseparable. Small diffs merge; big ones wait.

## 4. Who does what by default

| If the work is | Owner |
|---|---|
| Needs the simulator, a device, or a big UI build | cursor |
| Research, docs, analytics, small isolated fixes, nightly triage and report | claude |
| QA gate, legal scan, finance, PR, marketing, social trends, consultant pass (seats in `guide-docs/FOUNDER-AGENTS.md`) | grokbot |
| Secrets, store submissions, production deploys, `risk:high` merges | brant |

## 5. Secrets

Never in git. `.cursor/mcp.json` reads `${env:MAGIC_PATTERNS_TOKEN}`; set it in your shell. Server keys live in AWS Secrets Manager. `.env.example` files list names only.

## 6. Per-app notes

`apps/mobile/AGENTS.md` (Expo SDK 57 docs; read the versioned docs before writing Expo code).

# ops/ : the shared brain for Bridger's agents

This folder is the one place Claude, Cursor, and Grokbot (and Brant) read and write so they can work on Bridger without Brant relaying every message by hand. It lives in the repo on purpose: every agent already has the repo open, GitHub renders it on a phone, and git history is the audit trail.

**Product docs stay in `guide-docs/`. Company rules stay in `.cursor/rules/`. This folder is only about the work: what is queued, who owns it, what was decided, what broke, and what one agent needs from another.**

---

## 1 · The three agents and their lanes

| Agent | Lane | Reads first | Writes to |
|---|---|---|---|
| **Claude** (Cowork, runs on a schedule and on demand) | Planning, triage, analytics, docs, bug fixing on branches, nightly report, keeps this folder tidy | `ops/queue/`, `ops/HANDOFFS.md`, `ops/BUGS.md` | Everything in `ops/`, PRs, GitHub issues |
| **Cursor** (coding agent in the IDE, Bugbot on PRs, cloud agents from GitHub) | Implementation, refactors, code review, anything that needs the running app or simulator | `ops/queue/` items owned by `cursor`, the task file's acceptance criteria | The task file, `ops/HANDOFFS.md`, code |
| **Grokbot** (founder ops agent, wears seats from `guide-docs/FOUNDER-AGENTS.md`) | QA, legal scan, finance, PR, marketing, social trends, consultant passes | `ops/HANDOFFS.md` entries tagged `@grokbot`, `ops/queue/` items owned by `grokbot` | The task file, `ops/HANDOFFS.md`, the seat's living memory in `FOUNDER-AGENTS.md` |
| **Brant** (founder) | Decides, approves high-risk merges, rotates secrets, ships to stores | `ops/reports/` latest, `ops/queue/` items with `needs: brant` | Anything. Brant outranks all of the above. |

The seat system in `FOUNDER-AGENTS.md` still applies to Grokbot. This folder does not replace the org chart; it is the desk the org chart works at.

---

## 2 · The five files that matter

| Path | What it is | Rule |
|---|---|---|
| `ops/queue/NNN-slug.md` | One file per unit of work. Frontmatter carries id, owner, status, risk, and what it is blocked on. | One task, one file. Never edit another agent's `in_progress` task except to add a handoff note at the bottom. |
| `ops/HANDOFFS.md` | The message board. Newest at the top. Tag the agent you need with `@claude`, `@cursor`, `@grokbot`, `@brant`. | Append only. Resolve by adding a reply under the entry, never by deleting. |
| `ops/BUGS.md` | Bug log. Repro, expected, actual, where it was seen (TestFlight build, Android, web), severity, linked queue id once someone owns it. | File first, fix second. A fix PR must reference the bug id. |
| `ops/DECISIONS.md` | Decision log. Date, decision, why, who decided. | Append only. Product decisions also go to `guide-docs/INDEX.md` §6 if they change a spec; this file records the ops decision and links there. |
| `ops/reports/YYYY-MM-DD.md` | Nightly and weekly reports from Claude. What was done, what merged, what waits on Brant, what the data says. | One file per run. The newest one is the morning brief. |

Supporting files: `ops/RISK-TIERS.md` (what auto-merges and what waits for Brant), `ops/runbooks/` (repeatable procedures), `scripts/ops.mjs` (queue helper), `scripts/risk-tier.mjs` (classifies a diff by risk).

---

## 3 · The work loop (how a task moves)

```
idea or bug  ->  queue file (status: todo)  ->  claimed (in_progress, owner set)
   ->  branch + PR  ->  CI + risk label  ->  low risk: auto-merge / high risk: Brant reviews
   ->  queue file (done, links PR)  ->  nightly report mentions it
```

1. **Anyone files.** Brant can say "add this to the queue" to any agent. The agent runs `pnpm ops new "title" --owner cursor --risk low` (or writes the file by hand from `ops/queue/_TEMPLATE.md`).
2. **Owner claims** by setting `status: in_progress` and `owner`. Claude assigns owners during the nightly triage when nobody has.
3. **Work happens on a branch** named `<owner>/<id>-<slug>` (example: `cursor/014-fix-keyboard-avoiding`). Never on `main`.
4. **PR opens** with the template filled in. `scripts/risk-tier.mjs` runs in CI and labels the PR `risk:low` or `risk:high` from the paths it touched (see `RISK-TIERS.md`). The PR body must name the queue id.
5. **Low risk + CI green = auto-merge.** High risk waits for Brant. Brant can also drop a `risk:high` label on anything to hold it.
6. **Owner closes** the queue file (`status: done`, `pr:` link) and, if it was a bug, marks the `BUGS.md` row fixed with the build it lands in.
7. **Claude reports** every night in `ops/reports/`.

---

## 4 · How agents trigger each other (no human relay)

The transport is GitHub. Every agent can read it and most can write to it.

| Need | How |
|---|---|
| Claude wants Cursor to build something | Claude writes the queue file with `owner: cursor`, opens a GitHub issue with the same title and the label `agent:cursor`, and mentions `@cursor` in the issue body if Cursor cloud agents are enabled on the repo (Cursor picks it up and opens a PR). Otherwise Brant opens Cursor and says "work the queue". |
| Cursor wants Claude to review, research, or write docs | Cursor appends to `ops/HANDOFFS.md` tagged `@claude`, and (when GitHub access is wired) requests review from Claude on the PR. Claude's nightly run reads every open `@claude` handoff. |
| Anyone wants Grokbot (QA pass, legal scan, trend report, finance review) | Append to `ops/HANDOFFS.md` tagged `@grokbot` naming the seat to wear. Brant pastes "read ops/HANDOFFS.md and work your tags" into Grokbot, or Grokbot polls the repo if it has a GitHub connector. |
| Anyone needs Brant | Set `needs: brant` on the queue file and tag `@brant` in `HANDOFFS.md`. The nightly report lists every `@brant` item at the top so he sees them in one place. |
| Something is on fire | Put `SEV1` at the start of the `HANDOFFS.md` entry and file it in `BUGS.md` as `sev: 1`. Claude's nightly run pushes a notification for SEV1 items. |

Until Cursor cloud agents and Grokbot's GitHub connector are confirmed, the fallback for every trigger is the same one-liner Brant can paste into any agent: **"Read `ops/README.md`, then work your tags in `ops/HANDOFFS.md` and your items in `ops/queue/`."**

---

## 5 · Standing rules for every agent in this folder

- **No em dashes** in anything you write here (repo-wide copy rule).
- **Plain English.** Brant reads all of it. Say what and why, jargon in parentheses.
- **Never paste secrets, member PII, or production data** into any file here. Reference where it lives (Secrets Manager key name, PostHog insight link) instead.
- **Dates are ISO** (`2026-09-14`), times are America/Denver.
- **Stale memory is worse than empty.** If you finish work, update the queue file the same session. If you find a bug, file it before you fix it.
- **Small diffs.** One queue item per PR unless they are inseparable.
- **The guide-docs still win** on product behavior. This folder decides who does what and when, never what the product is.

---

## 6 · Quick start per agent

**Claude (scheduled run or on demand):** read `ops/runbooks/nightly-loop.md` and follow it.

**Cursor (new session):** read `AGENTS.md` at the repo root, then `ops/queue/` for `owner: cursor` items with `status: todo` or `in_progress`, pick the highest priority, follow `ops/runbooks/handoff-protocol.md` when you need someone else.

**Grokbot (new session):** read `guide-docs/GROKBOT-BRIEF.md` §0, then `ops/HANDOFFS.md` for `@grokbot` tags, wear the seat named in the tag, and update that seat's living memory in `FOUNDER-AGENTS.md` when done.

**Brant (morning):** open the newest file in `ops/reports/`. Everything that needs you is at the top.

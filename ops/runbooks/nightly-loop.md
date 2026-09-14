# Runbook: Claude's nightly loop

Runs every night (scheduled task, 1:00 AM America/Denver) and any time Brant says "run the loop". Goal: Brant wakes up to a shorter bug list, merged low-risk fixes, and one report that tells him exactly what needs him.

Hard limits for the run: never merge `risk:high`, never touch `main` directly, never deploy, never rotate secrets, never paste member data anywhere. If GitHub write access is missing, do steps 1 to 3 and 7 anyway and write the report locally.

## 0 · Orient (2 minutes)

1. `git fetch origin && git checkout main && git pull`.
2. Read `ops/HANDOFFS.md` top to bottom until you hit an entry you have already replied to. Collect every `@claude` tag and every `SEV1`.
3. Read `ops/BUGS.md` open rows and `ops/queue/` items with `owner: claude` or `owner: unassigned`.
4. Read the newest `ops/reports/` file so you do not repeat yourself.

## 1 · Triage (assign, do not build yet)

For every unassigned queue item and every open bug without a queue id:

- Decide the owner. Rule of thumb: needs the simulator, a device, or a big UI change = `cursor`. Needs research, docs, data, a small isolated code fix = `claude`. Needs a QA pass, legal scan, spend review, or a trend report = `grokbot`. Needs a decision, a secret, or a store action = `brant`.
- Set `priority` and `risk` from `ops/RISK-TIERS.md`.
- For `owner: cursor` items with `priority: p0` or `p1`, open a GitHub issue (label `agent:cursor`) so Cursor can pick it up.

## 2 · Fix what is yours (the bulk of the run)

Work `owner: claude` items in priority order, and any open bug with `sev: 1` or `2` whose fix is clearly `risk:low`. For each:

1. Branch `claude/<id>-<slug>` from `main`.
2. Reproduce or at least locate the cause. Write it in the queue file's notes.
3. Make the smallest change. Follow `.cursor/rules/guide-rules.mdc` (plain-language header comment, no em dashes, analytics ids and taxonomy rows if UI changed, PRIVACY/TERMS if data changed).
4. Run `pnpm build && pnpm typecheck && pnpm test` on the touched packages. If the run cannot install the monorepo, say so in the PR body and rely on CI.
5. Open the PR with the template. Cite the queue id and bug id. Let CI label the risk.
6. Update the queue file: `status: review`, `pr:` link.

Budget: stop after 4 PRs or when the run is 60 minutes in, whichever is first. Breadth beats a heroic refactor at 3 AM.

## 3 · Check on yesterday's PRs

- `risk:low` PRs with green CI should have auto-merged. If one did not, find out why (CI red, merge conflict, label missing) and either fix it on the branch or note it for Brant.
- Close the queue files for anything that merged (`status: done`).
- For `risk:high` PRs still open, make sure the PR description says in two sentences what Brant should look at.

## 4 · Watch the data (once PostHog has real traffic)

Run the questions in `ops/runbooks/analytics-questions.md` against PostHog (API key lives in the scheduled task's secrets, never in the repo). Look for:

- Onboarding: `flow_abandoned` for `onboarding` by `last_step`
- Friend adding: `flow_started` vs `flow_completed` for `add_friend`, by `method`
- Co-op join: `surface_opened` on the join sheet vs `coop_joined`
- Dead clicks and rage clicks by `screen.section.element` (top 10 this week)
- Features never touched by returning users
- Crash-adjacent: sessions ending on the same screen repeatedly

Write two to five sentences of "where people get stuck and why we think so" into the report. If a finding is actionable, file a queue item.

## 5 · Watch the inbox and the money (when access exists)

- Customer service mailbox: summarize new threads, draft replies into `ops/support/drafts/` for Brant to send, file bugs from real reports (initials only, no emails in the repo).
- Spend: compare this month's vendor spend to `ops/FINANCE.md`; flag anything up more than 25 percent.

## 6 · Tidy the hub

- Any queue file `done` for more than 30 days moves to `ops/queue/archive/`.
- Any `HANDOFFS.md` thread with a reply and no open ask can be left; the file is trimmed monthly to the last 60 days (older entries move to `ops/HANDOFFS-archive.md`).
- Make sure `ops/BUGS.md` rows have a queue id or a reason they do not.

## 7 · Report

Write `ops/reports/YYYY-MM-DD.md` in this exact order so Brant can read the first screen and stop:

1. **Needs you** (every `@brant` and `needs: brant`, with the one action each)
2. **Merged while you slept** (PR list with one line each)
3. **Waiting on your review** (`risk:high` PRs)
4. **New bugs / changed bugs**
5. **What the data says** (skip the heading if no data yet)
6. **Handoffs sent** (to cursor, to grokbot)
7. **Next run will** (three bullets max)

Commit the report and every queue change to a branch `claude/report-YYYY-MM-DD`, open the PR (it is `risk:low`, docs only, so it auto-merges). If any item is `SEV1`, send Brant a push notification with the one-line summary.

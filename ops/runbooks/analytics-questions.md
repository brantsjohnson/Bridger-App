# Runbook: the analytics questions Claude asks every week

These are the questions Brant wants answered once real users are in the app. Each one names the PostHog events and properties from `guide-docs/ANALYTICS-TAXONOMY.md` so the answer can be pulled the same way every time. Write findings into the nightly report, never raw user data.

| Question | Events and properties | What "bad" looks like |
|---|---|---|
| Where do people quit onboarding? | `flow_started`/`flow_step`/`flow_abandoned` where `flow = onboarding`, break down by `last_step` and `platform` | Any single step losing more than 15 percent of the people who reach it |
| Do people who sign up come back? | `$session` counts per `distinct_id` on day 1, 3, 7 after `flow_completed` for `onboarding` | Fewer than half return by day 3 |
| Are people adding friends, and how? | `flow_started` vs `flow_completed` for `add_friend`, break down by `method` (qr, link, scan) | Completion under 60 percent, or one method that almost always fails |
| Does the co-op join sheet convert? | `surface_opened` where `surface = coop_join` vs the coop product event on confirmed join, and `surface_dismissed` with `dwell_ms` | Long dwell then dismiss = people read it and said no; short dwell = they never understood it |
| What do people try to tap that does nothing? | `dead_click` grouped by `id` (screen.section.element), top 10 this week | Same element in the top 3 two weeks running = design it or make it tappable |
| Where do people get frustrated? | `rage_click` grouped by `screen` and `id` | Any rage clicks on a primary CTA |
| Which features are never used? | `view` and `surface_opened` per `screen`/`surface` divided by weekly active people | A shipped surface under 5 percent reach after two weeks |
| Does the first session end well? | Last `screen` viewed in each first session; `flow_abandoned` in first session | Sessions ending on `onboarding` or `auth` screens |
| What do people do first on Home? | `click` where `first_interaction = true` and `screen = home`, grouped by `id` | If the first tap is a dead click, the screen is misleading |
| Are stories and touch grass being answered, not just sent? | Product events for post and reply pairs (see taxonomy §3b) | Sends with no replies within 48 hours |

Rules: never build a vanity metric (follower-like counts, leaderboards). Never export or store `distinct_id` values in the repo. Insight links go in the report; numbers go in as ranges or percentages.

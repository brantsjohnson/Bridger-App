---
id: 005
title: Vendor and spend inventory (Finance seat)
owner: grokbot
status: todo
risk: low
priority: p1
area: finance
needs: brant
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

Brant wants expenses monitored. Step one is knowing the list. Step two (later) is a monthly digest in the nightly report.

## Done means

- [ ] `ops/FINANCE.md` with every vendor: plan, monthly or annual cost, billing email, renewal date, who can log in, what breaks if it lapses
- [ ] Alert thresholds agreed with Brant (default: flag any vendor up more than 25 percent month over month)
- [ ] Where a bill can be read automatically (AWS Cost Explorer API, Supabase usage API), note it so Claude can pull it in the nightly loop

## Notes and handoffs

2026-09-14 claude: handed to Grokbot in `ops/HANDOFFS.md`. No card or account numbers in the repo, ever.

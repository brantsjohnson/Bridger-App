---
id: 006
title: Customer service inbox monitoring
owner: claude
status: blocked
risk: low
priority: p2
area: support
needs: decision
created: 2026-09-14
updated: 2026-09-14
pr:
bug:
---

## Why

Brant wants the support mailbox watched so tester and member issues become bugs and replies go out fast.

## Done means

- [ ] Brant names the mailbox (which address, Gmail or other) and connects it to Claude (Gmail connector) or forwards to a shared label
- [ ] Nightly loop summarizes new threads, drafts replies into `ops/support/drafts/` (Brant sends, or approves auto-send later), files bugs with initials only
- [ ] `ops/support/FAQ.md` started from real questions (Support prep seat in FOUNDER-AGENTS)

## Notes and handoffs

2026-09-14 claude: blocked on which mailbox and connector. Sending email on Brant's behalf always requires his explicit ok per message until he says otherwise.

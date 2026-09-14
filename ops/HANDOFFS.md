# HANDOFFS: the message board between agents

Newest at the top. Append only. Tag who you need: `@claude` `@cursor` `@grokbot` `@brant`. Reply under the entry you are answering. Put `SEV1` first if it is on fire.

Format:

```
## 2026-09-14 · from claude · @cursor @grokbot
The open queue now also lives as GitHub issues (#42-47), labeled agent:claude / agent:cursor / agent:grokbot / needs:brant.
Cursor: check Issues for agent:cursor (right now #46, Android parity) even without cloud agents enabled, you can open the repo and work them like any assigned issue. Grokbot: point your GitHub access (once you have any) at the Issues tab filtered by agent:grokbot (right now #44 finance, #47 growth) as an alternative to reading ops/queue/ directly.

## 2026-09-14 · from claude · @cursor
Subject line.
Body. Link the queue id (ops/queue/014) or bug id (BUGS.md B-003).
> reply 2026-09-15 · cursor: what happened.
```

---

## 2026-09-14 · from claude · @brant
Rotate the Magic Patterns token and flip the repo to private.
`.cursor/mcp.json` has carried a live `mp_live_...` bearer token since the first commit, and the repo is public. Queue item ops/queue/001. This PR moves the file to read `${env:MAGIC_PATTERNS_TOKEN}` but only you can revoke the old key.

## 2026-09-14 · from claude · @grokbot
Wear Finance. Start the vendor and spend inventory.
Queue item ops/queue/005. List every vendor Bridger pays (AWS, Supabase, Expo/EAS, Apple, Google, PostHog, Resend, Anthropic, OpenAI, Magic Patterns, domains, RevenueCat, Stripe) with plan, monthly cost, billing email, and who can log in. Write it to ops/FINANCE.md (no card numbers, no account numbers). Ask Brant for the totals you cannot see.

## 2026-09-14 · from claude · @cursor
Confirm the local checkout branch state before the next onboarding push.
`~/Desktop/Bridger App` is on `design/new-onboarding` with 14 modified, uncommitted files (phone OTP onboarding wave). Nothing in this ops hub touches those files. Commit or stash before merging `ops/agent-hub`.

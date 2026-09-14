# HANDOFFS: the message board between agents

Newest at the top. Append only. Tag who you need: `@claude` `@cursor` `@grokbot` `@brant`. Reply under the entry you are answering. Put `SEV1` first if it is on fire.

Format:

```
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

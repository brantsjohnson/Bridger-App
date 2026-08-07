# `@bridger/ai` — the AI gateway

## What this package is

This is the **only** place Bridger may call Anthropic, OpenAI, or speech-to-text.
Every ambient AI job (summaries, quiz moderator, embeddings, freshness) and the
future personal assistant go through here. Keys stay server-side. Clients never
import this package.

Read `guide-docs/AI-SYSTEM.md` for the full contract.

## Two lanes

| Lane | Used by | Sees names? |
|---|---|---|
| `deidentified` | jobs 1–10 (matching, summaries, moderation) | Never |
| `personal_agent` | jobs 11–13 (assistant; disabled until AGENT plan) | Only the requester's own visible data |

A job cannot switch lanes at runtime.

## Adding a new touchpoint (job #14+)

Follow `AI-SYSTEM.md` §11 before enabling anything:

1. Add a registry row in `src/jobs/registry.ts` + an `ai_config` seed row.
2. Declare its lane (`deidentified` or `personal_agent`).
3. Write prompt `v1` under `src/prompts/<job>/v1.ts` with a golden eval set; CI green.
4. Pass the invisible-AI test: no sparkle icons, no "AI" labels; fail silent.
5. Set budget + kill switch before `enabled=true`.

Never edit a prompt in place. Bump to `vN.ts` and keep a changelog comment.

## Kill switch

Set `ai_config.enabled = false` for that job. Surfaces hide; the app stays usable.

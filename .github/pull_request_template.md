<!-- Keep it short. Brant reads this on his phone. No em dashes. -->

## What and why

One or two sentences. Which queue item: `ops/queue/NNN`. Which bug (if any): `B-NNN`.

## Risk

- [ ] I checked `ops/RISK-TIERS.md`; I expect this to be labeled `risk:low` / `risk:high` (pick one)
- [ ] No secrets, member PII, or production data in the diff

## Done checklist (guide-rules)

- [ ] Plain-language header comment on every new file
- [ ] UI changes: `analyticsId`s added and `ANALYTICS-TAXONOMY.md` rows in this PR
- [ ] Data, permission, payment, or AI changes: `PRIVACY.md` / `TERMS.md` updated in this PR
- [ ] `pnpm build && pnpm typecheck && pnpm test` pass locally, or "relying on CI" stated here with the reason

## For Brant (only if risk:high)

The two sentences that tell you what to look at.

# Bridger — Co-op Portal (governance & stewardship)

This documents the **existing** co-op portal (your uploaded `service.ts` / `routes.ts` / `adminRoutes.ts` / `ideaNotifications.ts` / `seed.ts`) and integrates it with the rest of the docs. It's the space where the co-op is **run in the open**: anyone can see how Bridger works and where it's headed; **members participate**.

Distinct from `COOP.md` (which defines *membership benefits* inside the app). This doc is the *governance portal* those members steer.

---

## The core pattern (the part to preserve)

Every route follows one rule, and it's exactly "members participate, non-members see":

- **Public reads use `optionalAuth`** — the request is never blocked. Anyone (logged-out, non-member) can view overview, ideas, beta, mission, economics, roles, and dues. If a valid session *is* present, the same read adds the viewer's state ("you support this").
- **Writes use `requireAuth`** — creating ideas, supporting, commenting, voting on beta, supporting mission principles, voting on dues, joining the waitlist. Only signed-in participants can act.

So the portal is **transparent to the world and participatory for members** — which is itself one of the mission principles ("Transparency by default").

> **Integration decision (one line of code):** today the write gate is `requireAuth` (any signed-in user). To make participation **co-op-members-only** (matching this doc's framing and `COOP.md`), swap `requireAuth` for a `requireCoopMember` check that reads `coop_memberships` (`DATA.md`). Reads stay `optionalAuth` (public). Recommended: **public view, member participate.**

---

## Where it lives (reconciled with the architecture)

It's an **Express router mounted at `/co-op`** inside the main app, reusing the app's **auth** (JWT `bsession` cookie + `sessions`) and **Prisma** — *not* a separate service. Server module:

```
server/coop/
├── routes.ts            # public reads (optionalAuth) + member writes (requireAuth)
├── adminRoutes.ts       # /co-op/admin — env-allowlisted admins or ADMIN_API_KEY
├── service.ts           # all portal business logic (ideas, beta, mission, economics, roles, dues, participation)
├── ideaNotifications.ts # Resend emails: review team on new idea, submitter on decision, custom updates
└── seed.ts              # lazy default content (economics, roles, mission principles, Beta 0.2)
```

Client pages: `/co-op` (overview), `/co-op/ideas`, `/co-op/ideas/:id`, `/co-op/vote` (beta + dues + mission), `/co-op/governance`, `/co-op/cost`, `/co-op/profile`, `/co-op/admin`.

**This supersedes the earlier "co-op portal is external / out of scope" note** in `ARCHITECTURE.md`: it's a real module of the app, sharing the same API and auth. The consumer mobile app links into it (Home co-op footer, Profile co-op icon, onboarding co-op pitch).

---

## Features (from your service)

### Ideas (member feature-request CRM)
- **Create / update / support (toggle) / comment**, filterable by **status**, **category**, **sort**, and **pending**.
- **Categories:** connection · activities · events · friends · groups · safety · privacy · accessibility · monetization · other.
- **Statuses:** submitted → under_review → needs_more_detail → cost_estimate_needed → community_discussion → planned · deferred · declined · implemented.
- Also captured: **urgency** (not_urgent…critical), **impact** (high/med/low), **cost guess** (small/medium/large/major), **funding model** (free/subscription/pay-as-you-go/other), plus problem, evidence, drawbacks.
- **Private until approved**, then public; **auto-approves after 48h** if a reviewer hasn't acted (`IDEA_AUTO_APPROVE_MS`).
- **Emails (Resend):** notify the review team on a new idea (48h clock); notify the submitter on a decision (declined / needs_more_detail); send custom updates.

### Beta voting
- Members **verify a beta access code**, then **vote** yes / no / extend on the current version; **7-day rounds** auto-tally (extend restarts a round; yes → released, no → archived). Versions carry release notes, known issues, unfinished list, test URL.

### Mission
- The **principles** members can **support** (toggle). Seeded defaults: *People over engagement · No attention traps · One member, one vote · The mission can't be sold · Value stays with members · You control your data · Transparency by default.* (These are the app's values, made votable.)

### Economics (transparency)
- Public **cost assumptions** (hosting, AI, storage, email/SMS, legal, accounting, development, moderation, marketing, support, events, community activities) — the "here's what it costs to run" view. Feeds a cost/dues picture.

### Roles
- Public **volunteer roles** with responsibilities, estimated weekly/monthly hours, and risks (Founder/CEO, Developer, Designer, Moderator, Social/Marketing). Shows the real labor behind the co-op.

### Dues (participatory)
- A **dues summary** plus members **voting on the preferred annual dues amount** — pricing is set *with* members, not at them. This should inform the single annual membership in `COOP.md` (it's a preference signal, not a charge; real payment still runs through `payments`).

### Waitlist · Interest · Participation
- **Join waitlist**, **save interest** (curious / interested / committed), and a per-member **participation** ledger (`/me/participation`).

### Admin
- `/co-op/admin`, gated by **env allowlist** (`COOP_ADMIN_USERNAMES` / `COOP_ADMIN_EMAILS`) or **`ADMIN_API_KEY`** header: review/approve/deny ideas, set status, send update emails. (Complements the app-organizer console in `ADMIN.md`, but is its own thing — governance, not app content.)

---

## How it connects to the app

- **Membership** — the portal reads/writes the same `coop_memberships` the app uses (`DATA.md`). Members who join in-app (the onboarding co-op pitch / co-op benefit funnel) are the members who participate here.
- **Dues** — the portal's dues vote informs the annual membership price in `COOP.md`; charges go through the app's `payments` module (kind `coop_dues`).
- **Values** — the portal's mission principles are the same principles the app is built on (privacy, no attention traps, one member/one vote) — the portal is where they're made visible and votable.
- **Entry points** — Home co-op footer, Profile co-op icon, and the onboarding co-op pitch all deep-link into `/co-op`; non-members land on the public view, members on the participatory one.

---

## Env / config (from your code)

`JWT_SECRET`, `COOP_ADMIN_USERNAMES`, `COOP_ADMIN_EMAILS`, `ADMIN_API_KEY`, `COOP_IDEA_REVIEW_EMAIL` (defaults to hello@bridger.social), plus the Resend email creds used by `lib/email`.

---

## Acceptance criteria

- [ ] All portal reads are public (`optionalAuth`); a signed-in viewer additionally sees their own support/vote state.
- [ ] All writes require a member (`requireAuth` today; tighten to `requireCoopMember` to match "members participate, non-members view").
- [ ] Ideas support the full status/category vocab, private-until-approved, 48h auto-approve, and the three notification emails.
- [ ] Beta voting runs 7-day rounds with yes/no/extend auto-tally and access-code gating.
- [ ] Mission principles, economics, roles, and dues are publicly viewable; supporting/voting requires a member.
- [ ] Admin actions are gated by the env allowlist or `ADMIN_API_KEY`.
- [ ] The portal reuses the app's auth + `coop_memberships`; dues votes inform (don't charge) the `COOP.md` membership; charges run through `payments`.

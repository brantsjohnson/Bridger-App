# Bridger — Co-op Portal (governance & stewardship)

The space where the co-op is **run in the open**: anyone can see how Bridger works and where it is headed; **members participate**. Distinct from `COOP.md` (membership benefits inside the app).

**Runtime (shipped):** Nest `apps/api/src/coop/` + Expo `apps/mobile/app/coop/portal/*`. The Express tree at repo-root `coop/` is **deprecated** (content source only; see `coop/DEPRECATED.md`).

---

## Core rules

| Rule | Behavior |
|---|---|
| Public reads | Mission, model, ideas (public), beta notes, economics, roles, hub — no login required |
| Member writes | Support ideas/principles, comment, submit ideas, beta verify + vote, period-end cancel |
| No tallies on portal | Support counts and beta yes/no/extend counts **never** appear in the app. Admin console shows aggregates. |
| No names on portal | Ideas/comments use **"A member"** or omit authors. Opaque `user_id` only in admin. |
| Dues display | **$24/year**. No dues preference vote in the app. Full cost **simulator** is public. |
| Cancel | Period-end: keep perks until `dues_paid_through`, then free rolling ~30-day storage |

---

## Mobile routes

| Route | Role |
|---|---|
| `/coop` | Benefits + join |
| `/coop/portal` | Hub (Phase 0, guide cards) |
| `/coop/portal/mission` | Seven principles |
| `/coop/portal/model` | Why co-op, phases, comparison |
| `/coop/portal/ideas` | List + submit |
| `/coop/portal/ideas/[id]` | Detail + comments |
| `/coop/portal/vote` | Beta notes + member vote |
| `/coop/portal/cost` | Books + simulator + roles |
| `/coop/portal/manage` | Quiet membership / cancel |

---

## Nest API

- Public/optional auth: `GET /coop/portal/overview|ideas|ideas/:id|mission|economics|roles|beta/current`
- Member: idea create/support/comment, mission support, beta verify/vote, `POST /coop/membership/cancel`
- Admin (`AdminGuard`): `GET/PATCH /admin/coop/portal/ideas`, `GET /admin/coop/portal/votes/summary`, pending count
- Ideas: private until approved; lazy **48h auto-approve**; Resend to `COOP_IDEA_REVIEW_EMAIL` on create (best-effort)

---

## Admin console

`apps/admin` → **Co-op portal**: idea queue (approve / plan / implement / decline), beta tallies, top supported ideas. **Co-op members** shows `cancel_at_period_end`.

---

## Analytics

Product: `coop_joined`, `coop_cancel_scheduled`, `coop_left` (when period ends / hard leave). UI ids under `COOP.*` in `ANALYTICS-TAXONOMY.md` / `ids.ts`.

---

## Acceptance

- [x] Public can read portal without joining
- [x] Members write; tallies and names hidden on portal
- [x] Mission + model + ideas + vote + full cost simulator
- [x] Period-end cancel + reconcile to free storage
- [x] Admin idea CRM + vote summary + review email hook
- [x] Express `coop/` not mounted

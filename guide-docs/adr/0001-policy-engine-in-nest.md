# ADR 0001 · Policy engine lives in Nest

**Status:** proposed (2026-09-21)

## Context

`SupabaseService.admin` uses the service-role key (`apps/api/src/supabase/supabase.service.ts`). That bypasses RLS. `apps/api/src/common/visibility.ts` re-checks blocks and tiers for some callers, not all. `GET /jname/leaderboard` returns friends' `jname_results` while `jname_results_select_own` is own-row only.

The phone uses the publishable key. Its only table write is `media` (`apps/mobile/lib/media-upload.ts`). `media_select` is wider than `stories_select`.

Extensions and the phone are untrusted. A policy that runs only in the client is not a policy.

## Decision

User-data reads and writes go through one module, `apps/api/src/policy/`, inside the Nest API. It loads the catalog, applies the requester context, queries Postgres with the service role, and omits fields before JSON is returned.

RLS stays as defense in depth for the publishable key. It is not the API's authorization. The service-role client is not exported to the phone, the admin browser, or extension code.

`visibility.ts` becomes an internal detail of the policy module. Feature services stop calling `supabase.admin` after the enforce flip (`06` Phase 3, founder gate). Until that flip, shadow mode may fall through to today's response if the wrapper throws.

Denied fields are omitted. Denied rows are not-found. Details: `guide-docs/platform/03-POLICY-AND-SECURITY.md`.

## Consequences

- New endpoints are safe only if they use the module. The standing rule forbids new `.from()` calls outside it after the flip.
- Shadow mode is required first so we do not change TestFlight JSON by accident.
- RLS migrations still matter for the phone path. They do not replace this module.
- An insider with production SQL can still read tables. This ADR does not claim otherwise.

## Alternatives rejected

- RLS only, and switch Nest to the user JWT so RLS applies. That would make today's policies the product. Several of those policies are `USING (true)`, and `media_select` does not match story tiers. We would freeze the holes. A user-JWT client can be a later extra fence. It is not enough on its own.
- Policy in the Expo app. The app is untrusted, and extensions would inherit the same binary.

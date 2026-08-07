# Assistant access widen checklist (Phase 5)

Ops only. Do **not** change code defaults (`founder_only` stays the seed).

1. Live on `founder_only` with spot-checks for at least a week.
2. Enable agent jobs in `ai_config` (`agent_query`, `agent_reasoning`; then `agent_voice`) for founders only.
3. Flip act tools on one at a time via `PUT /admin/assistant` (`save_note` → `draft_message` → `draft_event` → `add_calendar_entry`).
4. Move access to `allowlist` and add opaque user ids.
5. Move to `coop` when membership economics are ready (personal_agent spend is a co-op cost line).
6. `everyone` only with an explicit founder decision.
7. Watch `/admin/ai/cost` for the `personal_agent` lane; kill-switch jobs or tools if spend spikes.

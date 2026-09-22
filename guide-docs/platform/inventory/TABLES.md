# Generated table appendix

Machine output of `scripts/data-inventory/generate.mjs`. Do not edit by hand.
Regenerate after a migration. Quoted policy SQL is the parser flattening of the migration text.

## public.activity_hearts

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| post_id | uuid | no |  | public.activity_posts(id) | cascade | 0008_polls_touchgrass_activities.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |

Policy `activity_hearts_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy activity_hearts_select on public.activity_hearts for select to authenticated using (true)
```

Policy `activity_hearts_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy activity_hearts_write on public.activity_hearts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.activity_posts

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0008_polls_touchgrass_activities.sql |
| activity_id | uuid | no |  | public.weekly_activities(id) | cascade | 0008_polls_touchgrass_activities.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0008_polls_touchgrass_activities.sql |
| media_id | uuid | yes |  | public.media(id) | set null | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| caption | text | yes |  |  |  | 0053_side_quest_notes_app.sql |
| emoji | text | yes |  |  |  | 0053_side_quest_notes_app.sql |

Indexes:
- `idx_activity_posts_activity` (activity_id) in `0008_polls_touchgrass_activities.sql`
- `idx_activity_posts_author` (author_id) in `0008_polls_touchgrass_activities.sql`

Policy `activity_posts_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy activity_posts_select on public.activity_posts for select to authenticated using (true)
```

Policy `activity_posts_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy activity_posts_write on public.activity_posts for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

## public.admin_config

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| home_defaults | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| live_quiz_slug | text | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| themed_prompts | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| updated_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| assistant | jsonb | no |  |  |  | 0029_assistant.sql |
| storage | jsonb | no |  |  |  | 0032_profile_customize_phase_b.sql |
| demo_week | jsonb | no |  |  |  | 0044_demo_week_invite_access.sql |

Policy `admin_config_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy admin_config_select on public.admin_config for select to authenticated using (true)
```

## public.ai_config

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| job | text | no | yes |  |  | 0028_ai_system.sql |
| lane | text | no |  |  |  | 0028_ai_system.sql |
| model_id | text | no |  |  |  | 0028_ai_system.sql |
| temperature | double precision | no |  |  |  | 0028_ai_system.sql |
| max_tokens | integer | no |  |  |  | 0028_ai_system.sql |
| timeout_ms | integer | no |  |  |  | 0028_ai_system.sql |
| schema_id | text | yes |  |  |  | 0028_ai_system.sql |
| monthly_budget_usd | double precision | no |  |  |  | 0028_ai_system.sql |
| enabled | boolean | no |  |  |  | 0028_ai_system.sql |
| updated_at | timestamptz | no |  |  |  | 0028_ai_system.sql |

Policies: none in migrations.

## public.ai_job_cost_log

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0028_ai_system.sql |
| job | text | no |  | public.ai_config(job) |  | 0028_ai_system.sql |
| prompt_version | text | yes |  |  |  | 0028_ai_system.sql |
| latency_ms | integer | no |  |  |  | 0028_ai_system.sql |
| input_tokens | integer | no |  |  |  | 0028_ai_system.sql |
| output_tokens | integer | no |  |  |  | 0028_ai_system.sql |
| estimated_usd | double precision | no |  |  |  | 0028_ai_system.sql |
| subject_ref | text | no |  |  |  | 0028_ai_system.sql |
| created_at | timestamptz | no |  |  |  | 0028_ai_system.sql |

Indexes:
- `idx_ai_job_cost_log_job_created` (job, created_at desc) in `0028_ai_system.sql`

Policies: none in migrations.

## public.ai_jobs

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0028_ai_system.sql |
| job | text | no |  | public.ai_config(job) |  | 0028_ai_system.sql |
| subject_ref | text | no |  |  |  | 0028_ai_system.sql |
| content_hash | text | no |  |  |  | 0028_ai_system.sql |
| payload_json | jsonb | no |  |  |  | 0028_ai_system.sql |
| status | text | no |  |  |  | 0028_ai_system.sql |
| attempts | integer | no |  |  |  | 0028_ai_system.sql |
| run_after | timestamptz | no |  |  |  | 0028_ai_system.sql |
| last_error | text | yes |  |  |  | 0028_ai_system.sql |
| result_json | jsonb | yes |  |  |  | 0028_ai_system.sql |
| created_at | timestamptz | no |  |  |  | 0028_ai_system.sql |
| finished_at | timestamptz | yes |  |  |  | 0028_ai_system.sql |

Indexes:
- `uq_ai_jobs_done_idempotent` unique (job, subject_ref, content_hash) where status = 'done' in `0028_ai_system.sql`
- `idx_ai_jobs_poll` (status, run_after) where status in ('pending', 'failed') in `0028_ai_system.sql`

Policies: none in migrations.

## public.ai_ops_alerts

Created in `0037_billy_billing.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0037_billy_billing.sql |
| source | text | no |  |  |  | 0037_billy_billing.sql |
| code | text | no |  |  |  | 0037_billy_billing.sql |
| detail | text | no |  |  |  | 0037_billy_billing.sql |
| job | text | yes |  |  |  | 0037_billy_billing.sql |
| resolved_at | timestamptz | yes |  |  |  | 0037_billy_billing.sql |
| created_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |

Indexes:
- `idx_ai_ops_alerts_open` (created_at desc) where resolved_at is null in `0037_billy_billing.sql`

Policies: none in migrations.

## public.assistant_activity_log

Created in `0029_assistant.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0029_assistant.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0029_assistant.sql |
| tool | text | no |  |  |  | 0029_assistant.sql |
| summary | text | no |  |  |  | 0029_assistant.sql |
| undo_payload | jsonb | yes |  |  |  | 0029_assistant.sql |
| created_at | timestamptz | no |  |  |  | 0029_assistant.sql |
| undone_at | timestamptz | yes |  |  |  | 0029_assistant.sql |
| playbook_id | text | yes |  |  |  | 0033_assistant_d1.sql |
| playbook_version | text | yes |  |  |  | 0033_assistant_d1.sql |

Indexes:
- `idx_assistant_activity_user` (user_id, created_at desc) in `0029_assistant.sql`

Policies: none in migrations.

## public.assistant_memory_chunks

Created in `0029_assistant.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0029_assistant.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0029_assistant.sql |
| kind | text | no |  |  |  | 0029_assistant.sql |
| ref_id | text | yes |  |  |  | 0029_assistant.sql |
| text | text | no |  |  |  | 0029_assistant.sql |
| embedding | vector(1536) | yes |  |  |  | 0029_assistant.sql |
| updated_at | timestamptz | no |  |  |  | 0029_assistant.sql |

Indexes:
- `idx_assistant_memory_user` (user_id) in `0029_assistant.sql`

Policies: none in migrations.

## public.assistant_proposals

Created in `0029_assistant.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0029_assistant.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0029_assistant.sql |
| session_id | uuid | yes |  | public.assistant_sessions(id) | cascade | 0029_assistant.sql |
| tool | text | no |  |  |  | 0029_assistant.sql |
| preview | text | no |  |  |  | 0029_assistant.sql |
| args | jsonb | no |  |  |  | 0029_assistant.sql |
| status | text | no |  |  |  | 0029_assistant.sql |
| created_at | timestamptz | no |  |  |  | 0029_assistant.sql |
| resolved_at | timestamptz | yes |  |  |  | 0029_assistant.sql |

Policies: none in migrations.

## public.assistant_scheduled_messages

Created in `0034_assistant_scheduled_messages.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0034_assistant_scheduled_messages.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0034_assistant_scheduled_messages.sql |
| person_id | uuid | no |  | public.users(id) | cascade | 0034_assistant_scheduled_messages.sql |
| body | text | no |  |  |  | 0034_assistant_scheduled_messages.sql |
| send_at | timestamptz | no |  |  |  | 0034_assistant_scheduled_messages.sql |
| status | text | no |  |  |  | 0034_assistant_scheduled_messages.sql |
| activity_id | uuid | yes |  | public.assistant_activity_log(id) | set null | 0034_assistant_scheduled_messages.sql |
| created_at | timestamptz | no |  |  |  | 0034_assistant_scheduled_messages.sql |
| cancelled_at | timestamptz | yes |  |  |  | 0034_assistant_scheduled_messages.sql |
| sent_at | timestamptz | yes |  |  |  | 0034_assistant_scheduled_messages.sql |

Indexes:
- `assistant_scheduled_messages_due_idx` (send_at) where status = 'queued' in `0034_assistant_scheduled_messages.sql`
- `assistant_scheduled_messages_user_idx` (user_id) in `0034_assistant_scheduled_messages.sql`

Policy `assistant_scheduled_messages_select_own` (select, roles: not stated) in `0034_assistant_scheduled_messages.sql`:

```sql
create policy assistant_scheduled_messages_select_own on public.assistant_scheduled_messages for select using (auth.uid() = user_id)
```

## public.assistant_sessions

Created in `0029_assistant.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0029_assistant.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0029_assistant.sql |
| status | text | no |  |  |  | 0029_assistant.sql |
| created_at | timestamptz | no |  |  |  | 0029_assistant.sql |
| closed_at | timestamptz | yes |  |  |  | 0029_assistant.sql |
| fill_state | jsonb | no |  |  |  | 0033_assistant_d1.sql |

Indexes:
- `idx_assistant_sessions_user` (user_id, status) in `0029_assistant.sql`

Policies: none in migrations.

## public.assistant_turns

Created in `0029_assistant.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0029_assistant.sql |
| session_id | uuid | no |  | public.assistant_sessions(id) | cascade | 0029_assistant.sql |
| role | text | no |  |  |  | 0029_assistant.sql |
| content | text | no |  |  |  | 0029_assistant.sql |
| tool_name | text | yes |  |  |  | 0029_assistant.sql |
| created_at | timestamptz | no |  |  |  | 0029_assistant.sql |
| playbook_id | text | yes |  |  |  | 0033_assistant_d1.sql |
| playbook_version | text | yes |  |  |  | 0033_assistant_d1.sql |

Indexes:
- `idx_assistant_turns_session` (session_id, created_at) in `0029_assistant.sql`

Policies: none in migrations.

## public.attributes

Created in `0003_attributes.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0003_attributes.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0003_attributes.sql |
| key | text | no |  |  |  | 0003_attributes.sql |
| value | jsonb | no |  |  |  | 0003_attributes.sql |
| layer | attr_layer | no |  |  |  | 0003_attributes.sql |
| visible_to_tier | tier | no |  |  |  | 0003_attributes.sql |
| matchable | boolean | no |  |  |  | 0003_attributes.sql |
| created_at | timestamptz | no |  |  |  | 0003_attributes.sql |
| updated_at | timestamptz | no |  |  |  | 0003_attributes.sql |

Indexes:
- `idx_attributes_owner` (owner_id) in `0003_attributes.sql`
- `idx_attributes_owner_layer` (owner_id, layer) in `0003_attributes.sql`
- `idx_attributes_matchable` (owner_id) where matchable in `0003_attributes.sql`

Policy `attributes_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy attributes_select on public.attributes for select to authenticated using (public.can_view(owner_id, visible_to_tier))
```

Policy `attributes_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy attributes_insert on public.attributes for insert to authenticated with check (owner_id = auth.uid())
```

Policy `attributes_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy attributes_update on public.attributes for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

Policy `attributes_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy attributes_delete on public.attributes for delete to authenticated using (owner_id = auth.uid())
```

## public.billy_balances

Created in `0037_billy_billing.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0037_billy_billing.sql |
| balance_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| lifetime_granted_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| lifetime_spent_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| updated_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |

Policy `billy_balances_select_own` (select, roles: authenticated) in `0037_billy_billing.sql`:

```sql
create policy billy_balances_select_own on public.billy_balances for select to authenticated using (user_id = auth.uid())
```

## public.billy_config

Created in `0037_billy_billing.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | integer | no | yes |  |  | 0037_billy_billing.sql |
| taste_grant_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| plus_price_usd | numeric(12, 2) | no |  |  |  | 0037_billy_billing.sql |
| plus_grant_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| rollover_cap_multiplier | numeric(6, 2) | no |  |  |  | 0037_billy_billing.sql |
| taste_rollover | boolean | no |  |  |  | 0037_billy_billing.sql |
| min_balance_to_start_turn_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| updated_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |

Policies: none in migrations.

## public.billy_ledger

Created in `0037_billy_billing.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0037_billy_billing.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0037_billy_billing.sql |
| kind | text | no |  |  |  | 0037_billy_billing.sql |
| amount_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| balance_after_usd | numeric(12, 4) | no |  |  |  | 0037_billy_billing.sql |
| job | text | yes |  |  |  | 0037_billy_billing.sql |
| cost_log_id | uuid | yes |  |  |  | 0037_billy_billing.sql |
| note | text | yes |  |  |  | 0037_billy_billing.sql |
| created_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |

Indexes:
- `idx_billy_ledger_user_created` (user_id, created_at desc) in `0037_billy_billing.sql`
- `idx_billy_ledger_kind_created` (kind, created_at desc) in `0037_billy_billing.sql`

Policy `billy_ledger_select_own` (select, roles: authenticated) in `0037_billy_billing.sql`:

```sql
create policy billy_ledger_select_own on public.billy_ledger for select to authenticated using (user_id = auth.uid())
```

## public.billy_subscriptions

Created in `0037_billy_billing.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0037_billy_billing.sql |
| plan | text | no |  |  |  | 0037_billy_billing.sql |
| status | text | no |  |  |  | 0037_billy_billing.sql |
| current_period_start | timestamptz | yes |  |  |  | 0037_billy_billing.sql |
| current_period_end | timestamptz | yes |  |  |  | 0037_billy_billing.sql |
| cancel_at_period_end | boolean | no |  |  |  | 0037_billy_billing.sql |
| provider_ref | text | yes |  |  |  | 0037_billy_billing.sql |
| created_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |
| updated_at | timestamptz | no |  |  |  | 0037_billy_billing.sql |

Policy `billy_subscriptions_select_own` (select, roles: authenticated) in `0037_billy_billing.sql`:

```sql
create policy billy_subscriptions_select_own on public.billy_subscriptions for select to authenticated using (user_id = auth.uid())
```

## public.blocks

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| blocker_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| blocked_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |

Indexes:
- `idx_blocks_blocked` (blocked_id) in `0004_relationships.sql`

Policy `blocks_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy blocks_all on public.blocks for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid())
```

## public.bucket_list

Created in `0006_content_social.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0006_content_social.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0006_content_social.sql |
| text | text | no |  |  |  | 0006_content_social.sql |
| is_public | boolean | no |  |  |  | 0006_content_social.sql |
| done | boolean | no |  |  |  | 0006_content_social.sql |
| created_at | timestamptz | no |  |  |  | 0006_content_social.sql |

Indexes:
- `idx_bucket_list_owner` (owner_id) in `0006_content_social.sql`

Policy `bucket_list_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy bucket_list_select on public.bucket_list for select to authenticated using ( owner_id = auth.uid() or (is_public and public.can_view(owner_id, 'acquaintance')) or exists (select 1 from public.bucket_list_tags t where t.item_id = id and t.tagged_user_id = auth.uid()) )
```

Policy `bucket_list_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy bucket_list_write on public.bucket_list for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

## public.bucket_list_tags

Created in `0006_content_social.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| item_id | uuid | no |  | public.bucket_list(id) | cascade | 0006_content_social.sql |
| tagged_user_id | uuid | no |  | public.users(id) | cascade | 0006_content_social.sql |

Indexes:
- `idx_bucket_list_tags_user` (tagged_user_id) in `0006_content_social.sql`

Policy `bucket_list_tags_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy bucket_list_tags_select on public.bucket_list_tags for select to authenticated using ( tagged_user_id = auth.uid() or exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid()) )
```

Policy `bucket_list_tags_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy bucket_list_tags_write on public.bucket_list_tags for all to authenticated using (exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid())) with check (exists (select 1 from public.bucket_list b where b.id = item_id and b.owner_id = auth.uid()))
```

## public.client_not_found_hits

Created in `0020_client_not_found_hits.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0020_client_not_found_hits.sql |
| created_at | timestamptz | no |  |  |  | 0020_client_not_found_hits.sql |
| missing_path | text | no |  |  |  | 0020_client_not_found_hits.sql |
| path_trail | text[] | no |  |  |  | 0020_client_not_found_hits.sql |
| reason | text | no |  |  |  | 0020_client_not_found_hits.sql |
| platform | text | yes |  |  |  | 0020_client_not_found_hits.sql |
| app_version | text | yes |  |  |  | 0020_client_not_found_hits.sql |
| session_id | text | yes |  |  |  | 0020_client_not_found_hits.sql |

Indexes:
- `idx_client_not_found_hits_created` (created_at desc) in `0020_client_not_found_hits.sql`

Policies: none in migrations.

## public.connections

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0004_relationships.sql |
| user_a | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| user_b | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| status | connection_status | no |  |  |  | 0004_relationships.sql |
| made_via | made_via | yes |  |  |  | 0004_relationships.sql |
| mutual_friend_id | uuid | yes |  | public.users(id) | set null | 0004_relationships.sql |
| met_context | met_context | yes |  |  |  | 0004_relationships.sql |
| met_event_id | uuid | yes |  | public.events(id) | set null | 0004_relationships.sql |
| met_place_label | text | yes |  |  |  | 0004_relationships.sql |
| met_approx_geo | text | yes |  |  |  | 0004_relationships.sql |
| met_at | timestamptz | yes |  |  |  | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |
| updated_at | timestamptz | no |  |  |  | 0004_relationships.sql |
| met_note | text | yes |  |  |  | 0022_connection_met_note.sql |
| met_via_user_id | uuid | yes |  | public.users(id) | set null | 0030_matching.sql |

Indexes:
- `uq_connections_pair` unique (least(user_a, user_b), greatest(user_a, user_b)) in `0004_relationships.sql`
- `idx_connections_user_a` (user_a) in `0004_relationships.sql`
- `idx_connections_user_b` (user_b) in `0004_relationships.sql`

Policy `connections_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy connections_select on public.connections for select to authenticated using (user_a = auth.uid() or user_b = auth.uid())
```

Policy `connections_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy connections_insert on public.connections for insert to authenticated with check (user_a = auth.uid() or user_b = auth.uid())
```

Policy `connections_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy connections_update on public.connections for update to authenticated using (user_a = auth.uid() or user_b = auth.uid()) with check (user_a = auth.uid() or user_b = auth.uid())
```

Policy `connections_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy connections_delete on public.connections for delete to authenticated using (user_a = auth.uid() or user_b = auth.uid())
```

## public.coop_announcements

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| body | text | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| published_at | timestamptz | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| title | text | yes |  |  |  | 0016_admin_content_gaps.sql |
| cta_label | text | yes |  |  |  | 0016_admin_content_gaps.sql |
| cta_url | text | yes |  |  |  | 0016_admin_content_gaps.sql |

Policy `coop_announcements_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy coop_announcements_select on public.coop_announcements for select to authenticated using (true)
```

## public.coop_beta_unlocks

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| version_id | uuid | no |  | public.coop_beta_versions(id) | cascade | 0024_coop_portal.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policies: none in migrations.

## public.coop_beta_versions

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| label | text | no |  |  |  | 0024_coop_portal.sql |
| access_code_hash | text | no |  |  |  | 0024_coop_portal.sql |
| release_notes | text | yes |  |  |  | 0024_coop_portal.sql |
| known_issues | text | yes |  |  |  | 0024_coop_portal.sql |
| unfinished | text | yes |  |  |  | 0024_coop_portal.sql |
| test_url | text | yes |  |  |  | 0024_coop_portal.sql |
| status | text | no |  |  |  | 0024_coop_portal.sql |
| round_ends_at | timestamptz | yes |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_beta_versions_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_beta_versions_select on public.coop_beta_versions for select to authenticated using (true)
```

## public.coop_beta_votes

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| version_id | uuid | no |  | public.coop_beta_versions(id) | cascade | 0024_coop_portal.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| choice | text | no |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_beta_votes_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_beta_votes_select on public.coop_beta_votes for select to authenticated using (true)
```

## public.coop_dues_votes

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0024_coop_portal.sql |
| amount_cents | int | no |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |
| updated_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_dues_votes_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_dues_votes_select on public.coop_dues_votes for select to authenticated using (true)
```

## public.coop_economics_assumptions

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| category | text | no |  |  |  | 0024_coop_portal.sql |
| label | text | no |  |  |  | 0024_coop_portal.sql |
| monthly_cents | int | no |  |  |  | 0024_coop_portal.sql |
| notes | text | yes |  |  |  | 0024_coop_portal.sql |
| sort_order | int | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_economics_select` (select, roles: anon, authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_economics_select on public.coop_economics_assumptions for select to anon, authenticated using (true)
```

## public.coop_idea_comments

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| idea_id | uuid | no |  | public.coop_ideas(id) | cascade | 0024_coop_portal.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| body | text | no |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_idea_comments_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_idea_comments_select on public.coop_idea_comments for select to authenticated using (true)
```

## public.coop_idea_supports

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| idea_id | uuid | no |  | public.coop_ideas(id) | cascade | 0024_coop_portal.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_idea_supports_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_idea_supports_select on public.coop_idea_supports for select to authenticated using (true)
```

## public.coop_ideas

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| title | text | no |  |  |  | 0024_coop_portal.sql |
| problem | text | yes |  |  |  | 0024_coop_portal.sql |
| evidence | text | yes |  |  |  | 0024_coop_portal.sql |
| drawbacks | text | yes |  |  |  | 0024_coop_portal.sql |
| category | text | no |  |  |  | 0024_coop_portal.sql |
| status | text | no |  |  |  | 0024_coop_portal.sql |
| urgency | text | yes |  |  |  | 0024_coop_portal.sql |
| impact | text | yes |  |  |  | 0024_coop_portal.sql |
| cost_guess | text | yes |  |  |  | 0024_coop_portal.sql |
| funding_model | text | yes |  |  |  | 0024_coop_portal.sql |
| public | boolean | no |  |  |  | 0024_coop_portal.sql |
| support_count | int | no |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |
| updated_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |
| approved_at | timestamptz | yes |  |  |  | 0024_coop_portal.sql |

Indexes:
- `idx_coop_ideas_public` (public, support_count desc) in `0024_coop_portal.sql`

Policy `coop_ideas_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_ideas_select on public.coop_ideas for select to authenticated using (public = true or author_id = auth.uid())
```

## public.coop_memberships

Created in `0010_membership_payments.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0010_membership_payments.sql |
| since | timestamptz | no |  |  |  | 0010_membership_payments.sql |
| active | boolean | no |  |  |  | 0010_membership_payments.sql |
| dues_paid_through | date | yes |  |  |  | 0010_membership_payments.sql |
| created_at | timestamptz | no |  |  |  | 0010_membership_payments.sql |
| updated_at | timestamptz | no |  |  |  | 0010_membership_payments.sql |
| cancel_at_period_end | boolean | no |  |  |  | 0025_coop_portal_robust.sql |
| cancelled_at | timestamptz | yes |  |  |  | 0025_coop_portal_robust.sql |
| provider | text | yes |  |  |  | 0049_payment_providers.sql |
| provider_subscription_id | text | yes |  |  |  | 0049_payment_providers.sql |
| stripe_customer_id | text | yes |  |  |  | 0049_payment_providers.sql |

Indexes:
- `idx_coop_memberships_provider_sub` (provider_subscription_id) where provider_subscription_id is not null in `0049_payment_providers.sql`

Policy `coop_memberships_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy coop_memberships_select on public.coop_memberships for select to authenticated using (user_id = auth.uid())
```

## public.coop_mission_principles

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| slug | text | no |  |  |  | 0024_coop_portal.sql |
| title | text | no |  |  |  | 0024_coop_portal.sql |
| body | text | no |  |  |  | 0024_coop_portal.sql |
| sort_order | int | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_mission_principles_select` (select, roles: anon, authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_mission_principles_select on public.coop_mission_principles for select to anon, authenticated using (true)
```

## public.coop_mission_supports

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| principle_id | uuid | no |  | public.coop_mission_principles(id) | cascade | 0024_coop_portal.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_mission_supports_select` (select, roles: authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_mission_supports_select on public.coop_mission_supports for select to authenticated using (true)
```

## public.coop_promo_codes

Created in `0042_coop_promo_codes.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0042_coop_promo_codes.sql |
| code | text | no |  |  |  | 0042_coop_promo_codes.sql |
| label | text | no |  |  |  | 0042_coop_promo_codes.sql |
| grant_months | integer | no |  |  |  | 0042_coop_promo_codes.sql |
| max_redemptions | integer | no |  |  |  | 0042_coop_promo_codes.sql |
| redeemed_count | integer | no |  |  |  | 0042_coop_promo_codes.sql |
| active | boolean | no |  |  |  | 0042_coop_promo_codes.sql |
| created_at | timestamptz | no |  |  |  | 0042_coop_promo_codes.sql |
| updated_at | timestamptz | no |  |  |  | 0042_coop_promo_codes.sql |

Policies: none in migrations.

## public.coop_promo_redemptions

Created in `0042_coop_promo_codes.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| promo_code_id | uuid | no |  | public.coop_promo_codes(id) | cascade | 0042_coop_promo_codes.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0042_coop_promo_codes.sql |
| redeemed_at | timestamptz | no |  |  |  | 0042_coop_promo_codes.sql |

Indexes:
- `idx_coop_promo_redemptions_code` (promo_code_id) in `0042_coop_promo_codes.sql`
- `idx_coop_promo_redemptions_user` (user_id) in `0042_coop_promo_codes.sql`

Policy `coop_promo_redemptions_select_own` (select, roles: authenticated) in `0042_coop_promo_codes.sql`:

```sql
create policy coop_promo_redemptions_select_own on public.coop_promo_redemptions for select to authenticated using (user_id = auth.uid())
```

## public.coop_roles

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| title | text | no |  |  |  | 0024_coop_portal.sql |
| responsibilities | text | yes |  |  |  | 0024_coop_portal.sql |
| hours_week | text | yes |  |  |  | 0024_coop_portal.sql |
| risks | text | yes |  |  |  | 0024_coop_portal.sql |
| sort_order | int | no |  |  |  | 0024_coop_portal.sql |

Policy `coop_roles_select` (select, roles: anon, authenticated) in `0024_coop_portal.sql`:

```sql
create policy coop_roles_select on public.coop_roles for select to anon, authenticated using (true)
```

## public.coop_waitlist

Created in `0024_coop_portal.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0024_coop_portal.sql |
| email_hmac | text | yes |  |  |  | 0024_coop_portal.sql |
| user_id | uuid | yes |  | public.users(id) | cascade | 0024_coop_portal.sql |
| interest | text | yes |  |  |  | 0024_coop_portal.sql |
| created_at | timestamptz | no |  |  |  | 0024_coop_portal.sql |

Policies: none in migrations.

## public.day_summaries

Created in `0005_content_media_stories.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0005_content_media_stories.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0005_content_media_stories.sql |
| date | date | no |  |  |  | 0005_content_media_stories.sql |
| text | text | yes |  |  |  | 0005_content_media_stories.sql |
| media_refs | jsonb | no |  |  |  | 0005_content_media_stories.sql |
| visible_to_tier | tier | no |  |  |  | 0005_content_media_stories.sql |
| built_at | timestamptz | no |  |  |  | 0005_content_media_stories.sql |

Indexes:
- `idx_day_summaries_author` (author_id) in `0005_content_media_stories.sql`

Policy `day_summaries_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy day_summaries_select on public.day_summaries for select to authenticated using (public.can_view(author_id, visible_to_tier))
```

Policy `day_summaries_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy day_summaries_write on public.day_summaries for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

## public.delight_triggers

Created in `0016_admin_content_gaps.sql`. RLS enabled: yes. Policies: 3.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0016_admin_content_gaps.sql |
| delight_id | uuid | no |  | public.delights(id) | cascade | 0016_admin_content_gaps.sql |
| from_user_id | uuid | no |  | public.users(id) | cascade | 0016_admin_content_gaps.sql |
| to_user_id | uuid | no |  | public.users(id) | cascade | 0016_admin_content_gaps.sql |
| played | boolean | no |  |  |  | 0016_admin_content_gaps.sql |
| created_at | timestamptz | no |  |  |  | 0016_admin_content_gaps.sql |

Indexes:
- `idx_delight_triggers_to` (to_user_id, played) in `0016_admin_content_gaps.sql`

Policy `delight_triggers_insert` (insert, roles: authenticated) in `0016_admin_content_gaps.sql`:

```sql
create policy delight_triggers_insert on public.delight_triggers for insert to authenticated with check (from_user_id = auth.uid())
```

Policy `delight_triggers_select` (select, roles: authenticated) in `0016_admin_content_gaps.sql`:

```sql
create policy delight_triggers_select on public.delight_triggers for select to authenticated using (to_user_id = auth.uid() or from_user_id = auth.uid())
```

Policy `delight_triggers_update` (update, roles: authenticated) in `0016_admin_content_gaps.sql`:

```sql
create policy delight_triggers_update on public.delight_triggers for update to authenticated using (to_user_id = auth.uid()) with check (to_user_id = auth.uid())
```

## public.delights

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| enabled | boolean | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| scope | delight_scope | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| schedule | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| name | text | no |  |  |  | 0016_admin_content_gaps.sql |
| slug | text | yes |  |  |  | 0016_admin_content_gaps.sql |
| status | text | no |  |  |  | 0036_delight_catalog.sql |
| kind | text | no |  |  |  | 0036_delight_catalog.sql |
| notes | text | no |  |  |  | 0036_delight_catalog.sql |

Indexes:
- `idx_delights_slug` unique (slug) where slug is not null in `0016_admin_content_gaps.sql`

Policy `delights_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy delights_select on public.delights for select to authenticated using (true)
```

## public.disclosure_items

Created in `0040_disclosure.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0040_disclosure.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0040_disclosure.sql |
| condition_key | text | no |  |  |  | 0040_disclosure.sql |
| condition_label_custom | text | yes |  |  |  | 0040_disclosure.sql |
| impact_level | smallint | yes |  |  |  | 0040_disclosure.sql |
| context_note | text | yes |  |  |  | 0040_disclosure.sql |
| created_at | timestamptz | no |  |  |  | 0040_disclosure.sql |

Indexes:
- `idx_disclosure_items_user` (user_id) in `0040_disclosure.sql`

Policy `disclosure_items_all` (all, roles: authenticated) in `0040_disclosure.sql`:

```sql
create policy disclosure_items_all on public.disclosure_items for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.disclosure_profiles

Created in `0040_disclosure.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0040_disclosure.sql |
| version | int | no |  |  |  | 0040_disclosure.sql |
| status | text | no |  |  |  | 0040_disclosure.sql |
| match_weight_preference | text | yes |  |  |  | 0040_disclosure.sql |
| matching_enabled | boolean | no |  |  |  | 0040_disclosure.sql |
| completed_at | timestamptz | yes |  |  |  | 0040_disclosure.sql |
| updated_at | timestamptz | no |  |  |  | 0040_disclosure.sql |

Policy `disclosure_profiles_all` (all, roles: authenticated) in `0040_disclosure.sql`:

```sql
create policy disclosure_profiles_all on public.disclosure_profiles for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.event_assignments

Created in `0023_event_assignments_cover.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0023_event_assignments_cover.sql |
| event_id | uuid | no |  | public.events(id) | cascade | 0023_event_assignments_cover.sql |
| label | text | no |  |  |  | 0023_event_assignments_cover.sql |
| assignee_id | uuid | yes |  | public.users(id) | set null | 0023_event_assignments_cover.sql |
| done | boolean | no |  |  |  | 0023_event_assignments_cover.sql |
| sort_order | int | no |  |  |  | 0023_event_assignments_cover.sql |
| created_at | timestamptz | no |  |  |  | 0023_event_assignments_cover.sql |
| updated_at | timestamptz | no |  |  |  | 0023_event_assignments_cover.sql |

Indexes:
- `idx_event_assignments_event` (event_id) in `0023_event_assignments_cover.sql`

Policy `event_assignments_select` (select, roles: authenticated) in `0023_event_assignments_cover.sql`:

```sql
create policy event_assignments_select on public.event_assignments for select to authenticated using ( exists ( select 1 from public.events e where e.id = event_id and ( e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids) or exists ( select 1 from public.event_invites ei where ei.event_id = e.id and ei.user_id = auth.uid() ) ) ) )
```

Policy `event_assignments_insert` (insert, roles: authenticated) in `0023_event_assignments_cover.sql`:

```sql
create policy event_assignments_insert on public.event_assignments for insert to authenticated with check ( exists ( select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)) ) )
```

Policy `event_assignments_update` (update, roles: authenticated) in `0023_event_assignments_cover.sql`:

```sql
create policy event_assignments_update on public.event_assignments for update to authenticated using ( assignee_id = auth.uid() or exists ( select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)) ) ) with check ( assignee_id = auth.uid() or assignee_id is null or exists ( select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)) ) )
```

Policy `event_assignments_delete` (delete, roles: authenticated) in `0023_event_assignments_cover.sql`:

```sql
create policy event_assignments_delete on public.event_assignments for delete to authenticated using ( exists ( select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)) ) )
```

## public.event_intros

Created in `0007_events.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0007_events.sql |
| event_id | uuid | no |  | public.events(id) | cascade | 0007_events.sql |
| a | uuid | no |  | public.users(id) | cascade | 0007_events.sql |
| b | uuid | no |  | public.users(id) | cascade | 0007_events.sql |
| why | text | yes |  |  |  | 0007_events.sql |
| created_at | timestamptz | no |  |  |  | 0007_events.sql |

Indexes:
- `idx_event_intros_event` (event_id) in `0007_events.sql`

Policy `event_intros_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_intros_select on public.event_intros for select to authenticated using ( a = auth.uid() or b = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) )
```

Policy `event_intros_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_intros_write on public.event_intros for all to authenticated using (exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids)))) with check (exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))))
```

## public.event_invites

Created in `0007_events.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0007_events.sql |
| event_id | uuid | no |  | public.events(id) | cascade | 0007_events.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0007_events.sql |
| status | event_invite_status | no |  |  |  | 0007_events.sql |
| allergies_optin | boolean | no |  |  |  | 0007_events.sql |
| allergies_text | text | yes |  |  |  | 0007_events.sql |
| created_at | timestamptz | no |  |  |  | 0007_events.sql |
| updated_at | timestamptz | no |  |  |  | 0007_events.sql |
| invited_by | uuid | yes |  | public.users(id) | set null | 0038_event_invite_attribution.sql |

Indexes:
- `idx_event_invites_event` (event_id) in `0007_events.sql`
- `idx_event_invites_user` (user_id) in `0007_events.sql`
- `idx_event_invites_invited_by` (invited_by) where invited_by is not null in `0038_event_invite_attribution.sql`

Policy `event_invites_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_invites_select on public.event_invites for select to authenticated using ( user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) )
```

Policy `event_invites_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_invites_insert on public.event_invites for insert to authenticated with check ( user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) )
```

Policy `event_invites_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_invites_update on public.event_invites for update to authenticated using ( user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) ) with check ( user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) )
```

Policy `event_invites_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy event_invites_delete on public.event_invites for delete to authenticated using ( user_id = auth.uid() or exists (select 1 from public.events e where e.id = event_id and (e.host_id = auth.uid() or auth.uid() = any (e.co_host_ids))) )
```

## public.events

Created in `0007_events.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0007_events.sql |
| host_id | uuid | no |  | public.users(id) | cascade | 0007_events.sql |
| co_host_ids | uuid[] | no |  |  |  | 0007_events.sql |
| title | text | no |  |  |  | 0007_events.sql |
| bio | text | yes |  |  |  | 0007_events.sql |
| starts_at | timestamptz | yes |  |  |  | 0007_events.sql |
| address | text | yes |  |  |  | 0007_events.sql |
| place | text | yes |  |  |  | 0007_events.sql |
| bring | text | yes |  |  |  | 0007_events.sql |
| chip_in | jsonb | yes |  |  |  | 0007_events.sql |
| allow_friends_invite | boolean | no |  |  |  | 0007_events.sql |
| cap | integer | no |  |  |  | 0007_events.sql |
| created_at | timestamptz | no |  |  |  | 0007_events.sql |
| updated_at | timestamptz | no |  |  |  | 0007_events.sql |
| cover | jsonb | yes |  |  |  | 0023_event_assignments_cover.sql |
| recurrence | jsonb | yes |  |  |  | 0039_event_recurrence.sql |

Indexes:
- `idx_events_host` (host_id) in `0007_events.sql`
- `idx_events_starts` (starts_at) in `0007_events.sql`

Policy `events_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy events_select on public.events for select to authenticated using ( host_id = auth.uid() or auth.uid() = any (co_host_ids) or exists (select 1 from public.event_invites ei where ei.event_id = id and ei.user_id = auth.uid()) or public.can_view(host_id, 'acquaintance') )
```

Policy `events_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy events_insert on public.events for insert to authenticated with check (host_id = auth.uid())
```

Policy `events_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy events_update on public.events for update to authenticated using (host_id = auth.uid() or auth.uid() = any (co_host_ids)) with check (host_id = auth.uid() or auth.uid() = any (co_host_ids))
```

Policy `events_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy events_delete on public.events for delete to authenticated using (host_id = auth.uid())
```

## public.freshness_prompts

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0028_ai_system.sql |
| attribute_id | uuid | yes |  |  |  | 0028_ai_system.sql |
| question | text | yes |  |  |  | 0028_ai_system.sql |
| created_at | timestamptz | no |  |  |  | 0028_ai_system.sql |
| answered_at | timestamptz | yes |  |  |  | 0028_ai_system.sql |

Policies: none in migrations.

## public.friend_notes

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0004_relationships.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| person_id | uuid | yes |  | public.users(id) | cascade | 0004_relationships.sql |
| kind | friend_note_kind | no |  |  |  | 0004_relationships.sql |
| text | text | yes |  |  |  | 0004_relationships.sql |
| date | date | yes |  |  |  | 0004_relationships.sql |
| remind | boolean | no |  |  |  | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |
| updated_at | timestamptz | no |  |  |  | 0004_relationships.sql |
| cadence | text | yes |  |  |  | 0026_friend_notes_check_in.sql |
| next_remind_at | timestamptz | yes |  |  |  | 0026_friend_notes_check_in.sql |
| pending_person_id | uuid | yes |  | public.pending_people(id) | cascade | 0055_pending_people.sql |

Indexes:
- `idx_friend_notes_author` (author_id) in `0004_relationships.sql`
- `idx_friend_notes_author_next_remind` (author_id, next_remind_at) where kind = 'check_in' and next_remind_at is not null in `0026_friend_notes_check_in.sql`
- `idx_friend_notes_pending` (pending_person_id) in `0055_pending_people.sql`

Policy `friend_notes_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy friend_notes_all on public.friend_notes for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

## public.invite_links

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| token | text | no | yes |  |  | 0004_relationships.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| expires_at | timestamptz | yes |  |  |  | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |

Indexes:
- `idx_invite_links_owner` (owner_id) in `0004_relationships.sql`

Policy `invite_links_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy invite_links_all on public.invite_links for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

## public.jname_referrals

Created in `0043_jname_quiz.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0043_jname_quiz.sql |
| token | uuid | no |  | public.jname_shares(token) | cascade | 0043_jname_quiz.sql |
| sharer_id | uuid | no |  | public.users(id) | cascade | 0043_jname_quiz.sql |
| invited_user_id | uuid | yes |  | public.users(id) | cascade | 0043_jname_quiz.sql |
| anon_ref | text | yes |  |  |  | 0043_jname_quiz.sql |
| opened_at | timestamptz | no |  |  |  | 0043_jname_quiz.sql |
| resolved_at | timestamptz | yes |  |  |  | 0043_jname_quiz.sql |

Indexes:
- `jname_referrals_one_per_user` unique (token, invited_user_id) where invited_user_id is not null in `0043_jname_quiz.sql`
- `jname_referrals_one_per_anon` unique (token, anon_ref) where anon_ref is not null and invited_user_id is null in `0043_jname_quiz.sql`
- `jname_referrals_sharer_idx` (sharer_id) in `0043_jname_quiz.sql`
- `jname_referrals_invited_idx` (invited_user_id) in `0043_jname_quiz.sql`

Policy `jname_referrals_select_involved` (select, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_referrals_select_involved on public.jname_referrals for select to authenticated using (sharer_id = auth.uid() or invited_user_id = auth.uid())
```

## public.jname_results

Created in `0043_jname_quiz.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0043_jname_quiz.sql |
| j_name | text | no |  |  |  | 0043_jname_quiz.sql |
| percent | int | no |  |  |  | 0043_jname_quiz.sql |
| top_names | text[] | no |  |  |  | 0043_jname_quiz.sql |
| created_at | timestamptz | no |  |  |  | 0043_jname_quiz.sql |
| updated_at | timestamptz | no |  |  |  | 0043_jname_quiz.sql |

Policy `jname_results_select_own` (select, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_results_select_own on public.jname_results for select to authenticated using (user_id = auth.uid())
```

Policy `jname_results_insert_own` (insert, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_results_insert_own on public.jname_results for insert to authenticated with check (user_id = auth.uid())
```

Policy `jname_results_update_own` (update, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_results_update_own on public.jname_results for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

Policy `jname_results_delete_own` (delete, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_results_delete_own on public.jname_results for delete to authenticated using (user_id = auth.uid())
```

## public.jname_shares

Created in `0043_jname_quiz.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| token | uuid | no | yes |  |  | 0043_jname_quiz.sql |
| sharer_id | uuid | no |  | public.users(id) | cascade | 0043_jname_quiz.sql |
| j_name | text | no |  |  |  | 0043_jname_quiz.sql |
| percent | int | no |  |  |  | 0043_jname_quiz.sql |
| created_at | timestamptz | no |  |  |  | 0043_jname_quiz.sql |

Indexes:
- `jname_shares_sharer_idx` (sharer_id) in `0043_jname_quiz.sql`

Policy `jname_shares_select_own` (select, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_shares_select_own on public.jname_shares for select to authenticated using (sharer_id = auth.uid())
```

Policy `jname_shares_insert_own` (insert, roles: authenticated) in `0043_jname_quiz.sql`:

```sql
create policy jname_shares_insert_own on public.jname_shares for insert to authenticated with check (sharer_id = auth.uid())
```

## public.matching_config

Created in `0030_matching.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0030_matching.sql |
| version | integer | no |  |  |  | 0030_matching.sql |
| active | boolean | no |  |  |  | 0030_matching.sql |
| weights | jsonb | no |  |  |  | 0030_matching.sql |
| suggest_threshold | numeric | no |  |  |  | 0030_matching.sql |
| spotlight_threshold | numeric | no |  |  |  | 0030_matching.sql |
| min_shared_signals | integer | no |  |  |  | 0030_matching.sql |
| confidence_floor | numeric | no |  |  |  | 0030_matching.sql |
| reveal_extras_max | integer | no |  |  |  | 0030_matching.sql |
| refresh_cap | integer | no |  |  |  | 0030_matching.sql |
| exploration_epsilon | numeric | no |  |  |  | 0030_matching.sql |
| exploration_epsilon_cold | numeric | no |  |  |  | 0030_matching.sql |
| bridge_cooldown_days | integer | no |  |  |  | 0030_matching.sql |
| ann_candidate_cap | integer | no |  |  |  | 0030_matching.sql |
| exposure_cap_pct | numeric | no |  |  |  | 0030_matching.sql |
| exposure_hard_cap | integer | no |  |  |  | 0030_matching.sql |
| v2_enabled | boolean | no |  |  |  | 0030_matching.sql |
| holdout_pct | numeric | no |  |  |  | 0030_matching.sql |
| notes | text | yes |  |  |  | 0030_matching.sql |
| created_at | timestamptz | no |  |  |  | 0030_matching.sql |

Indexes:
- `uq_matching_config_one_active` unique (active) where active = true in `0030_matching.sql`

Policies: none in migrations.

## public.matching_feedback

Created in `0030_matching.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0030_matching.sql |
| opaque_a | uuid | no |  | public.users(id) | cascade | 0030_matching.sql |
| opaque_b | uuid | no |  | public.users(id) | cascade | 0030_matching.sql |
| surface | text | yes |  |  |  | 0030_matching.sql |
| suggestion_id | uuid | yes |  | public.matching_suggestions(id) | set null | 0030_matching.sql |
| pair_features_snapshot | jsonb | no |  |  |  | 0030_matching.sql |
| outcome | text | no |  |  |  | 0030_matching.sql |
| weight | numeric | no |  |  |  | 0030_matching.sql |
| created_at | timestamptz | no |  |  |  | 0030_matching.sql |
| superseded_at | timestamptz | yes |  |  |  | 0030_matching.sql |

Indexes:
- `idx_matching_feedback_pair` (opaque_a, opaque_b, created_at desc) in `0030_matching.sql`
- `idx_matching_feedback_outcome` (outcome, created_at desc) in `0030_matching.sql`
- `idx_matching_feedback_created` (created_at) in `0030_matching.sql`

Policies: none in migrations.

## public.matching_suggestions

Created in `0030_matching.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0030_matching.sql |
| viewer_id | uuid | no |  | public.users(id) | cascade | 0030_matching.sql |
| candidate_id | uuid | no |  | public.users(id) | cascade | 0030_matching.sql |
| surface | text | no |  |  |  | 0030_matching.sql |
| event_id | uuid | yes |  | public.events(id) | cascade | 0030_matching.sql |
| connection_id | uuid | yes |  | public.connections(id) | cascade | 0030_matching.sql |
| via_friend_id | uuid | yes |  | public.users(id) | set null | 0030_matching.sql |
| score | numeric | no |  |  |  | 0030_matching.sql |
| breakdown | jsonb | no |  |  |  | 0030_matching.sql |
| evidence | jsonb | no |  |  |  | 0030_matching.sql |
| is_exploration | boolean | no |  |  |  | 0030_matching.sql |
| is_spotlight | boolean | no |  |  |  | 0030_matching.sql |
| feature_snapshot | jsonb | no |  |  |  | 0030_matching.sql |
| created_at | timestamptz | no |  |  |  | 0030_matching.sql |
| expires_at | timestamptz | yes |  |  |  | 0030_matching.sql |
| dismissed_at | timestamptz | yes |  |  |  | 0030_matching.sql |
| converted_connection_id | uuid | yes |  | public.connections(id) | set null | 0030_matching.sql |

Indexes:
- `idx_matching_suggestions_viewer` (viewer_id, surface, created_at desc) in `0030_matching.sql`
- `uq_matching_suggestions_active_discover` unique (viewer_id, candidate_id) where surface = 'discover' and dismissed_at is null in `0030_matching.sql`

Policy `matching_suggestions_select_own` (select, roles: authenticated) in `0030_matching.sql`:

```sql
create policy matching_suggestions_select_own on public.matching_suggestions for select to authenticated using (viewer_id = auth.uid())
```

## public.media

Created in `0005_content_media_stories.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0005_content_media_stories.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0005_content_media_stories.sql |
| storage_path | text | no |  |  |  | 0005_content_media_stories.sql |
| kind | media_kind | no |  |  |  | 0005_content_media_stories.sql |
| created_at | timestamptz | no |  |  |  | 0005_content_media_stories.sql |
| expires_at | timestamptz | yes |  |  |  | 0005_content_media_stories.sql |

Indexes:
- `idx_media_owner` (owner_id) in `0005_content_media_stories.sql`

Policy `media_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy media_select on public.media for select to authenticated using (owner_id = auth.uid() or public.can_view(owner_id, 'acquaintance'))
```

Policy `media_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy media_insert on public.media for insert to authenticated with check (owner_id = auth.uid())
```

Policy `media_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy media_update on public.media for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

Policy `media_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy media_delete on public.media for delete to authenticated using (owner_id = auth.uid())
```

## public.module_moderator_notes

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0028_ai_system.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0028_ai_system.sql |
| module_key | text | no |  |  |  | 0028_ai_system.sql |
| notes | jsonb | no |  |  |  | 0028_ai_system.sql |
| updated_at | timestamptz | no |  |  |  | 0028_ai_system.sql |

Policies: none in migrations.

## public.music_connections

Created in `0035_music_connect.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0035_music_connect.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0035_music_connect.sql |
| provider | text | no |  |  |  | 0035_music_connect.sql |
| refresh_token_enc | text | no |  |  |  | 0035_music_connect.sql |
| access_token_enc | text | yes |  |  |  | 0035_music_connect.sql |
| access_expires_at | timestamptz | yes |  |  |  | 0035_music_connect.sql |
| scopes | text[] | no |  |  |  | 0035_music_connect.sql |
| provider_user_id | text | yes |  |  |  | 0035_music_connect.sql |
| connected_at | timestamptz | no |  |  |  | 0035_music_connect.sql |
| updated_at | timestamptz | no |  |  |  | 0035_music_connect.sql |

Indexes:
- `music_connections_user_idx` (user_id) in `0035_music_connect.sql`

Policy `music_connections_select_own` (select, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_connections_select_own on public.music_connections for select to authenticated using (user_id = auth.uid())
```

Policy `music_connections_delete_own` (delete, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_connections_delete_own on public.music_connections for delete to authenticated using (user_id = auth.uid())
```

## public.music_oauth_states

Created in `0035_music_connect.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| state | text | no | yes |  |  | 0035_music_connect.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0035_music_connect.sql |
| provider | text | no |  |  |  | 0035_music_connect.sql |
| created_at | timestamptz | no |  |  |  | 0035_music_connect.sql |
| expires_at | timestamptz | no |  |  |  | 0035_music_connect.sql |

Indexes:
- `music_oauth_states_expires_idx` (expires_at) in `0035_music_connect.sql`

Policies: none in migrations.

## public.music_picks

Created in `0035_music_connect.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0035_music_connect.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0035_music_connect.sql |
| kind | text | no |  |  |  | 0035_music_connect.sql |
| spotify_id | text | yes |  |  |  | 0035_music_connect.sql |
| spotify_uri | text | yes |  |  |  | 0035_music_connect.sql |
| apple_music_id | text | yes |  |  |  | 0035_music_connect.sql |
| isrc | text | yes |  |  |  | 0035_music_connect.sql |
| title | text | no |  |  |  | 0035_music_connect.sql |
| artist_name | text | no |  |  |  | 0035_music_connect.sql |
| album_name | text | yes |  |  |  | 0035_music_connect.sql |
| artwork_url | text | yes |  |  |  | 0035_music_connect.sql |
| preview_url | text | yes |  |  |  | 0035_music_connect.sql |
| visible_to_tier | tier | no |  |  |  | 0035_music_connect.sql |
| matchable | boolean | no |  |  |  | 0035_music_connect.sql |
| created_at | timestamptz | no |  |  |  | 0035_music_connect.sql |
| updated_at | timestamptz | no |  |  |  | 0035_music_connect.sql |

Indexes:
- `music_picks_one_listening_now` unique (owner_id) where kind = 'listening_now' in `0035_music_connect.sql`
- `music_picks_one_song_of_week` unique (owner_id) where kind = 'song_of_week' in `0035_music_connect.sql`
- `music_picks_owner_idx` (owner_id) in `0035_music_connect.sql`
- `music_picks_spotify_id_idx` (spotify_id) where spotify_id is not null in `0035_music_connect.sql`

Policy `music_picks_select` (select, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_picks_select on public.music_picks for select to authenticated using (public.can_view(owner_id, visible_to_tier))
```

Policy `music_picks_insert` (insert, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_picks_insert on public.music_picks for insert to authenticated with check (owner_id = auth.uid())
```

Policy `music_picks_update` (update, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_picks_update on public.music_picks for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

Policy `music_picks_delete` (delete, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_picks_delete on public.music_picks for delete to authenticated using (owner_id = auth.uid())
```

## public.music_taste_artists

Created in `0035_music_connect.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0035_music_connect.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0035_music_connect.sql |
| provider | text | no |  |  |  | 0035_music_connect.sql |
| artist_id | text | no |  |  |  | 0035_music_connect.sql |
| artist_name | text | no |  |  |  | 0035_music_connect.sql |
| rank | smallint | yes |  |  |  | 0035_music_connect.sql |
| artwork_url | text | yes |  |  |  | 0035_music_connect.sql |
| visible_to_tier | tier | no |  |  |  | 0035_music_connect.sql |
| matchable | boolean | no |  |  |  | 0035_music_connect.sql |
| synced_at | timestamptz | no |  |  |  | 0035_music_connect.sql |

Indexes:
- `music_taste_artists_owner_idx` (owner_id) in `0035_music_connect.sql`
- `music_taste_artists_artist_idx` (artist_id) in `0035_music_connect.sql`

Policy `music_taste_artists_select` (select, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_taste_artists_select on public.music_taste_artists for select to authenticated using (public.can_view(owner_id, visible_to_tier))
```

Policy `music_taste_artists_delete_own` (delete, roles: authenticated) in `0035_music_connect.sql`:

```sql
create policy music_taste_artists_delete_own on public.music_taste_artists for delete to authenticated using (owner_id = auth.uid())
```

## public.notifications

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 3.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0011_admin_quizzes_notifications.sql |
| kind | text | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| payload | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| read | boolean | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| created_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |

Indexes:
- `idx_notifications_user` (user_id, read) in `0011_admin_quizzes_notifications.sql`

Policy `notifications_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid())
```

Policy `notifications_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy notifications_update on public.notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

Policy `notifications_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid())
```

## public.payments

Created in `0010_membership_payments.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0010_membership_payments.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0010_membership_payments.sql |
| kind | payment_kind | no |  |  |  | 0010_membership_payments.sql |
| amount | numeric(12, 2) | yes |  |  |  | 0010_membership_payments.sql |
| provider_ref | text | yes |  |  |  | 0010_membership_payments.sql |
| created_at | timestamptz | no |  |  |  | 0010_membership_payments.sql |

Indexes:
- `idx_payments_user` (user_id) in `0010_membership_payments.sql`

Policy `payments_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy payments_select on public.payments for select to authenticated using (user_id = auth.uid())
```

## public.pending_people

Created in `0055_pending_people.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0055_pending_people.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0055_pending_people.sql |
| phone_e164 | text | no |  |  |  | 0055_pending_people.sql |
| display_name | text | yes |  |  |  | 0055_pending_people.sql |
| merged_user_id | uuid | yes |  | public.users(id) | set null | 0055_pending_people.sql |
| created_at | timestamptz | no |  |  |  | 0055_pending_people.sql |

Indexes:
- `uq_pending_people_author_phone_open` unique (author_id, phone_e164) where merged_user_id is null in `0055_pending_people.sql`
- `idx_pending_people_phone` (phone_e164) in `0055_pending_people.sql`
- `idx_pending_people_author` (author_id) in `0055_pending_people.sql`

Policy `pending_people_all` (all, roles: authenticated) in `0055_pending_people.sql`:

```sql
create policy pending_people_all on public.pending_people for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

## public.person_embeddings

Created in `0009_ai_rag.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0009_ai_rag.sql |
| embedding | vector(1536) | yes |  |  |  | 0009_ai_rag.sql |
| model | text | yes |  |  |  | 0009_ai_rag.sql |
| updated_at | timestamptz | no |  |  |  | 0009_ai_rag.sql |

Indexes:
- `idx_person_embeddings_hnsw` (embedding vector_cosine_ops) in `0009_ai_rag.sql`

Policies: none in migrations.

## public.person_summaries

Created in `0009_ai_rag.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0009_ai_rag.sql |
| summary_text | text | yes |  |  |  | 0009_ai_rag.sql |
| maybe_stale | boolean | no |  |  |  | 0009_ai_rag.sql |
| updated_at | timestamptz | no |  |  |  | 0009_ai_rag.sql |

Policies: none in migrations.

## public.plan_state

Created in `0010_membership_payments.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0010_membership_payments.sql |
| plan | coop_plan | no |  |  |  | 0010_membership_payments.sql |
| storage | storage_plan | no |  |  |  | 0010_membership_payments.sql |
| used_bytes | bigint | no |  |  |  | 0010_membership_payments.sql |
| circle_caps | jsonb | no |  |  |  | 0010_membership_payments.sql |
| video | boolean | no |  |  |  | 0010_membership_payments.sql |
| summary | summary_cadence | no |  |  |  | 0010_membership_payments.sql |
| event_cap | integer | no |  |  |  | 0010_membership_payments.sql |
| created_at | timestamptz | no |  |  |  | 0010_membership_payments.sql |
| updated_at | timestamptz | no |  |  |  | 0010_membership_payments.sql |

Policy `plan_state_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy plan_state_select on public.plan_state for select to authenticated using (user_id = auth.uid())
```

## public.poll_options

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0008_polls_touchgrass_activities.sql |
| poll_id | uuid | no |  | public.polls(id) | cascade | 0008_polls_touchgrass_activities.sql |
| label | text | no |  |  |  | 0008_polls_touchgrass_activities.sql |

Indexes:
- `idx_poll_options_poll` (poll_id) in `0008_polls_touchgrass_activities.sql`

Policy `poll_options_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy poll_options_write on public.poll_options for all to authenticated using (exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid())) with check (exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid()))
```

Policy `poll_options_select` (select, roles: authenticated) in `0027_profile_presentation.sql`:

```sql
create policy poll_options_select on public.poll_options for select to authenticated using ( exists ( select 1 from public.polls p where p.id = poll_id and (p.author_id = auth.uid() or public.can_view(p.author_id, p.audience_tier)) ) )
```

## public.poll_votes

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| poll_id | uuid | no |  | public.polls(id) | cascade | 0008_polls_touchgrass_activities.sql |
| option_id | uuid | no |  | public.poll_options(id) | cascade | 0008_polls_touchgrass_activities.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |

Indexes:
- `idx_poll_votes_option` (option_id) in `0008_polls_touchgrass_activities.sql`

Policy `poll_votes_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy poll_votes_select on public.poll_votes for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.polls p where p.id = poll_id and p.author_id = auth.uid()))
```

Policy `poll_votes_insert` (insert, roles: authenticated) in `0027_profile_presentation.sql`:

```sql
create policy poll_votes_insert on public.poll_votes for insert to authenticated with check ( user_id = auth.uid() and exists ( select 1 from public.polls p join public.poll_options o on o.poll_id = p.id where p.id = poll_id and o.id = option_id and (p.author_id = auth.uid() or public.can_view(p.author_id, p.audience_tier)) ) )
```

## public.polls

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0008_polls_touchgrass_activities.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0008_polls_touchgrass_activities.sql |
| question | text | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| closes_at | timestamptz | yes |  |  |  | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| audience_tier | tier | no |  |  |  | 0027_profile_presentation.sql |

Indexes:
- `idx_polls_author` (author_id) in `0008_polls_touchgrass_activities.sql`

Policy `polls_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy polls_write on public.polls for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `polls_select` (select, roles: authenticated) in `0027_profile_presentation.sql`:

```sql
create policy polls_select on public.polls for select to authenticated using (author_id = auth.uid() or public.can_view(author_id, audience_tier))
```

## public.profile_greatest_hits

Created in `0031_profile_greatest_hits.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0031_profile_greatest_hits.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0031_profile_greatest_hits.sql |
| media_id | uuid | no |  | public.media(id) | cascade | 0031_profile_greatest_hits.sql |
| placement_index | smallint | no |  |  |  | 0031_profile_greatest_hits.sql |
| after_module | text | yes |  |  |  | 0031_profile_greatest_hits.sql |
| visible_to_tier | tier | no |  |  |  | 0031_profile_greatest_hits.sql |
| created_at | timestamptz | no |  |  |  | 0031_profile_greatest_hits.sql |

Indexes:
- `idx_profile_greatest_hits_owner` (owner_id) in `0031_profile_greatest_hits.sql`

Policy `profile_greatest_hits_select` (select, roles: authenticated) in `0031_profile_greatest_hits.sql`:

```sql
create policy profile_greatest_hits_select on public.profile_greatest_hits for select to authenticated using (public.can_view(owner_id, visible_to_tier))
```

Policy `profile_greatest_hits_insert` (insert, roles: authenticated) in `0031_profile_greatest_hits.sql`:

```sql
create policy profile_greatest_hits_insert on public.profile_greatest_hits for insert to authenticated with check (owner_id = auth.uid())
```

Policy `profile_greatest_hits_update` (update, roles: authenticated) in `0031_profile_greatest_hits.sql`:

```sql
create policy profile_greatest_hits_update on public.profile_greatest_hits for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

Policy `profile_greatest_hits_delete` (delete, roles: authenticated) in `0031_profile_greatest_hits.sql`:

```sql
create policy profile_greatest_hits_delete on public.profile_greatest_hits for delete to authenticated using (owner_id = auth.uid())
```

## public.qr_tokens

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| token | text | no | yes |  |  | 0004_relationships.sql |
| owner_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| expires_at | timestamptz | yes |  |  |  | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |

Indexes:
- `idx_qr_tokens_owner` (owner_id) in `0004_relationships.sql`

Policy `qr_tokens_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy qr_tokens_all on public.qr_tokens for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())
```

## public.quip_tags

Created in `0006_content_social.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| quip_id | uuid | no |  | public.quips(id) | cascade | 0006_content_social.sql |
| tagged_user_id | uuid | no |  | public.users(id) | cascade | 0006_content_social.sql |

Indexes:
- `idx_quip_tags_user` (tagged_user_id) in `0006_content_social.sql`

Policy `quip_tags_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quip_tags_select on public.quip_tags for select to authenticated using ( tagged_user_id = auth.uid() or exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid()) )
```

Policy `quip_tags_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quip_tags_write on public.quip_tags for all to authenticated using (exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid())) with check (exists (select 1 from public.quips q where q.id = quip_id and q.author_id = auth.uid()))
```

## public.quips

Created in `0006_content_social.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0006_content_social.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0006_content_social.sql |
| quoted_person_id | uuid | yes |  | public.users(id) | set null | 0006_content_social.sql |
| text | text | no |  |  |  | 0006_content_social.sql |
| context_event_id | uuid | yes |  | public.events(id) | set null | 0006_content_social.sql |
| place | text | yes |  |  |  | 0006_content_social.sql |
| visible_to_tier | tier | no |  |  |  | 0006_content_social.sql |
| created_at | timestamptz | no |  |  |  | 0006_content_social.sql |
| accent | text | no |  |  |  | 0057_quip_accent_photo.sql |
| photo_media_id | uuid | yes |  | public.media(id) | set null | 0057_quip_accent_photo.sql |

Indexes:
- `idx_quips_author` (author_id) in `0006_content_social.sql`
- `idx_quips_quoted` (quoted_person_id) in `0006_content_social.sql`
- `idx_quips_photo` (photo_media_id) where photo_media_id is not null in `0057_quip_accent_photo.sql`

Policy `quips_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quips_select on public.quips for select to authenticated using ( author_id = auth.uid() or quoted_person_id = auth.uid() or exists (select 1 from public.quip_tags qt where qt.quip_id = id and qt.tagged_user_id = auth.uid()) or public.can_view(author_id, visible_to_tier) )
```

Policy `quips_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quips_insert on public.quips for insert to authenticated with check (author_id = auth.uid())
```

Policy `quips_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quips_update on public.quips for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `quips_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quips_delete on public.quips for delete to authenticated using (author_id = auth.uid())
```

## public.quiz_questions

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| quiz_id | uuid | no |  | public.quizzes(id) | cascade | 0011_admin_quizzes_notifications.sql |
| prompt | text | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| type | quiz_question_type | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| options | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| allow_explain | boolean | no |  |  |  | 0011_admin_quizzes_notifications.sql |

Indexes:
- `idx_quiz_questions_quiz` (quiz_id) in `0011_admin_quizzes_notifications.sql`

Policy `quiz_questions_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quiz_questions_select on public.quiz_questions for select to authenticated using (true)
```

## public.quiz_registry

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| slug | text | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| title | text | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| status | quiz_status | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| live_week | text | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| friends_taken_count | integer | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| created_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| quiz_id | uuid | yes |  | public.quizzes(id) |  | 0016_admin_content_gaps.sql |
| web_takeable | boolean | no |  |  |  | 0016_admin_content_gaps.sql |
| comparable | boolean | no |  |  |  | 0016_admin_content_gaps.sql |
| cover | jsonb | yes |  |  |  | 0017_quiz_activity_covers.sql |
| description | text | yes |  |  |  | 0017_quiz_activity_covers.sql |

Policy `quiz_registry_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quiz_registry_select on public.quiz_registry for select to authenticated using (true)
```

## public.quiz_responses

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| quiz_id | uuid | no |  | public.quizzes(id) | cascade | 0011_admin_quizzes_notifications.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0011_admin_quizzes_notifications.sql |
| question_id | uuid | no |  | public.quiz_questions(id) | cascade | 0011_admin_quizzes_notifications.sql |
| selected_option_ids | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| explain_text | text | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| created_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |

Indexes:
- `idx_quiz_responses_user` (user_id) in `0011_admin_quizzes_notifications.sql`
- `idx_quiz_responses_quiz` (quiz_id) in `0011_admin_quizzes_notifications.sql`

Policy `quiz_responses_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quiz_responses_all on public.quiz_responses for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.quiz_results

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 3.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0011_admin_quizzes_notifications.sql |
| quiz_id | uuid | no |  | public.quizzes(id) | cascade | 0011_admin_quizzes_notifications.sql |
| dimension_scores | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| confidence | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| completed_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |

Policy `quiz_results_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quiz_results_select on public.quiz_results for select to authenticated using (user_id = auth.uid())
```

Policy `quiz_results_insert` (insert, roles: authenticated) in `0016_admin_content_gaps.sql`:

```sql
create policy quiz_results_insert on public.quiz_results for insert to authenticated with check (user_id = auth.uid())
```

Policy `quiz_results_update` (update, roles: authenticated) in `0016_admin_content_gaps.sql`:

```sql
create policy quiz_results_update on public.quiz_results for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.quizzes

Created in `0011_admin_quizzes_notifications.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0011_admin_quizzes_notifications.sql |
| version | integer | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| goal | text | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| dimensions | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| moderator_instructions | text | yes |  |  |  | 0011_admin_quizzes_notifications.sql |
| adaptation_policy | jsonb | no |  |  |  | 0011_admin_quizzes_notifications.sql |
| created_at | timestamptz | no |  |  |  | 0011_admin_quizzes_notifications.sql |

Policy `quizzes_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy quizzes_select on public.quizzes for select to authenticated using (true)
```

## public.reactions

Created in `0005_content_media_stories.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0005_content_media_stories.sql |
| story_id | uuid | no |  | public.stories(id) | cascade | 0005_content_media_stories.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0005_content_media_stories.sql |
| kind | reaction_kind | no |  |  |  | 0005_content_media_stories.sql |
| media_id | uuid | yes |  | public.media(id) | set null | 0005_content_media_stories.sql |
| text | text | yes |  |  |  | 0005_content_media_stories.sql |
| sticker_id | text | yes |  |  |  | 0005_content_media_stories.sql |
| parent_reaction_id | uuid | yes |  | public.reactions(id) | cascade | 0005_content_media_stories.sql |
| created_at | timestamptz | no |  |  |  | 0005_content_media_stories.sql |

Indexes:
- `idx_reactions_story` (story_id) in `0005_content_media_stories.sql`
- `idx_reactions_parent` (parent_reaction_id) in `0005_content_media_stories.sql`

Policy `reactions_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy reactions_select on public.reactions for select to authenticated using ( author_id = auth.uid() or exists ( select 1 from public.stories s where s.id = story_id and public.can_view(s.author_id, s.visible_to_tier) ) )
```

Policy `reactions_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy reactions_insert on public.reactions for insert to authenticated with check (author_id = auth.uid())
```

Policy `reactions_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy reactions_update on public.reactions for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `reactions_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy reactions_delete on public.reactions for delete to authenticated using (author_id = auth.uid())
```

## public.recap_answers

Created in `0019_recap_podcast.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0019_recap_podcast.sql |
| week_id | uuid | no |  | public.recap_weeks(id) | cascade | 0019_recap_podcast.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0019_recap_podcast.sql |
| question_index | int | no |  |  |  | 0019_recap_podcast.sql |
| media_id | uuid | yes |  | public.media(id) | cascade | 0019_recap_podcast.sql |
| duration_seconds | int | no |  |  |  | 0019_recap_podcast.sql |
| visible_to_tier | tier | no |  |  |  | 0019_recap_podcast.sql |
| created_at | timestamptz | no |  |  |  | 0019_recap_podcast.sql |
| expires_at | timestamptz | yes |  |  |  | 0019_recap_podcast.sql |

Indexes:
- `idx_recap_answers_week` (week_id) in `0019_recap_podcast.sql`
- `idx_recap_answers_author` (author_id) in `0019_recap_podcast.sql`
- `idx_recap_answers_expires` (expires_at) in `0019_recap_podcast.sql`

Policy `recap_answers_select` (select, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_answers_select on public.recap_answers for select to authenticated using ( author_id = auth.uid() or ( (expires_at is null or expires_at > now()) and public.can_view(author_id, visible_to_tier) ) )
```

Policy `recap_answers_insert` (insert, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_answers_insert on public.recap_answers for insert to authenticated with check (author_id = auth.uid())
```

Policy `recap_answers_update` (update, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_answers_update on public.recap_answers for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `recap_answers_delete` (delete, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_answers_delete on public.recap_answers for delete to authenticated using (author_id = auth.uid())
```

## public.recap_question_votes

Created in `0019_recap_podcast.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| question_id | uuid | no |  | public.recap_submitted_questions(id) | cascade | 0019_recap_podcast.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0019_recap_podcast.sql |
| created_at | timestamptz | no |  |  |  | 0019_recap_podcast.sql |

Policy `recap_question_votes_all` (all, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_question_votes_all on public.recap_question_votes for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.recap_questions

Created in `0019_recap_podcast.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0019_recap_podcast.sql |
| week_id | uuid | no |  | public.recap_weeks(id) | cascade | 0019_recap_podcast.sql |
| idx | int | no |  |  |  | 0019_recap_podcast.sql |
| text | text | no |  |  |  | 0019_recap_podcast.sql |
| source | text | no |  |  |  | 0019_recap_podcast.sql |
| author_id | uuid | yes |  | public.users(id) | set null | 0019_recap_podcast.sql |
| created_at | timestamptz | no |  |  |  | 0019_recap_podcast.sql |

Indexes:
- `idx_recap_questions_week` (week_id) in `0019_recap_podcast.sql`

Policy `recap_questions_select` (select, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_questions_select on public.recap_questions for select to authenticated using (true)
```

## public.recap_submitted_questions

Created in `0019_recap_podcast.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0019_recap_podcast.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0019_recap_podcast.sql |
| text | text | no |  |  |  | 0019_recap_podcast.sql |
| votes | int | no |  |  |  | 0019_recap_podcast.sql |
| used | boolean | no |  |  |  | 0019_recap_podcast.sql |
| created_at | timestamptz | no |  |  |  | 0019_recap_podcast.sql |

Indexes:
- `idx_recap_submitted_questions_created` (created_at desc) in `0019_recap_podcast.sql`
- `idx_recap_submitted_questions_unused_votes` (used, votes desc, created_at desc) in `0056_recap_self_maintain.sql`

Policy `recap_submitted_questions_select` (select, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_submitted_questions_select on public.recap_submitted_questions for select to authenticated using (true)
```

Policy `recap_submitted_questions_insert` (insert, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_submitted_questions_insert on public.recap_submitted_questions for insert to authenticated with check (author_id = auth.uid())
```

## public.recap_weeks

Created in `0019_recap_podcast.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0019_recap_podcast.sql |
| week_of | text | no |  |  |  | 0019_recap_podcast.sql |
| active | boolean | no |  |  |  | 0019_recap_podcast.sql |
| created_at | timestamptz | no |  |  |  | 0019_recap_podcast.sql |
| week_start | date | yes |  |  |  | 0056_recap_self_maintain.sql |
| origin | text | no |  |  |  | 0056_recap_self_maintain.sql |

Indexes:
- `idx_recap_weeks_active` (active) in `0019_recap_podcast.sql`
- `recap_weeks_week_start_uidx` unique (week_start) where week_start is not null in `0056_recap_self_maintain.sql`

Policy `recap_weeks_select` (select, roles: authenticated) in `0019_recap_podcast.sql`:

```sql
create policy recap_weeks_select on public.recap_weeks for select to authenticated using (true)
```

## public.scrapbook_elements

Created in `0054_scrapbook_pages.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0054_scrapbook_pages.sql |
| page_id | uuid | no |  | public.scrapbook_pages(id) | cascade | 0054_scrapbook_pages.sql |
| type | text | no |  |  |  | 0054_scrapbook_pages.sql |
| x | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| y | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| width | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| height | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| rotation | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| z_index | integer | no |  |  |  | 0054_scrapbook_pages.sql |
| slot | integer | yes |  |  |  | 0054_scrapbook_pages.sql |
| locked | boolean | no |  |  |  | 0054_scrapbook_pages.sql |
| user_modified | boolean | no |  |  |  | 0054_scrapbook_pages.sql |
| source | text | yes |  |  |  | 0054_scrapbook_pages.sql |
| media_id | uuid | yes |  | public.media(id) | set null | 0054_scrapbook_pages.sql |
| data | jsonb | no |  |  |  | 0054_scrapbook_pages.sql |
| created_at | timestamptz | no |  |  |  | 0054_scrapbook_pages.sql |

Indexes:
- `idx_scrapbook_elements_page` (page_id) in `0054_scrapbook_pages.sql`
- `idx_scrapbook_elements_media` (media_id) where media_id is not null in `0054_scrapbook_pages.sql`

Policy `scrapbook_elements_select` (select, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_elements_select on public.scrapbook_elements for select to authenticated using ( exists ( select 1 from public.scrapbook_pages p where p.id = scrapbook_elements.page_id and ( p.author_id = auth.uid() or exists ( select 1 from public.stories s where s.id = p.story_id and public.can_view(s.author_id, s.visible_to_tier) ) ) ) )
```

Policy `scrapbook_elements_write` (all, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_elements_write on public.scrapbook_elements for all to authenticated using ( exists ( select 1 from public.scrapbook_pages p where p.id = scrapbook_elements.page_id and p.author_id = auth.uid() ) ) with check ( exists ( select 1 from public.scrapbook_pages p where p.id = scrapbook_elements.page_id and p.author_id = auth.uid() ) )
```

## public.scrapbook_pages

Created in `0054_scrapbook_pages.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0054_scrapbook_pages.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0054_scrapbook_pages.sql |
| story_id | uuid | yes |  | public.stories(id) | cascade | 0054_scrapbook_pages.sql |
| aspect_ratio | numeric | no |  |  |  | 0054_scrapbook_pages.sql |
| background | jsonb | no |  |  |  | 0054_scrapbook_pages.sql |
| layout_id | text | yes |  |  |  | 0054_scrapbook_pages.sql |
| layout_family | text | yes |  |  |  | 0054_scrapbook_pages.sql |
| revision | integer | no |  |  |  | 0054_scrapbook_pages.sql |
| created_at | timestamptz | no |  |  |  | 0054_scrapbook_pages.sql |
| updated_at | timestamptz | no |  |  |  | 0054_scrapbook_pages.sql |

Indexes:
- `idx_scrapbook_pages_author` (author_id) in `0054_scrapbook_pages.sql`
- `idx_scrapbook_pages_story` (story_id) in `0054_scrapbook_pages.sql`

Policy `scrapbook_pages_select` (select, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_pages_select on public.scrapbook_pages for select to authenticated using ( author_id = auth.uid() or exists ( select 1 from public.stories s where s.id = scrapbook_pages.story_id and public.can_view(s.author_id, s.visible_to_tier) ) )
```

Policy `scrapbook_pages_insert` (insert, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_pages_insert on public.scrapbook_pages for insert to authenticated with check (author_id = auth.uid())
```

Policy `scrapbook_pages_update` (update, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_pages_update on public.scrapbook_pages for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `scrapbook_pages_delete` (delete, roles: authenticated) in `0054_scrapbook_pages.sql`:

```sql
create policy scrapbook_pages_delete on public.scrapbook_pages for delete to authenticated using (author_id = auth.uid())
```

## public.stories

Created in `0005_content_media_stories.sql`. RLS enabled: yes. Policies: 4.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0005_content_media_stories.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0005_content_media_stories.sql |
| type | story_type | no |  |  |  | 0005_content_media_stories.sql |
| media_id | uuid | yes |  | public.media(id) | set null | 0005_content_media_stories.sql |
| update_text | text | yes |  |  |  | 0005_content_media_stories.sql |
| transcript | text | yes |  |  |  | 0005_content_media_stories.sql |
| theme_slug | text | yes |  |  |  | 0005_content_media_stories.sql |
| visible_to_tier | tier | no |  |  |  | 0005_content_media_stories.sql |
| created_at | timestamptz | no |  |  |  | 0005_content_media_stories.sql |
| expires_at | timestamptz | yes |  |  |  | 0005_content_media_stories.sql |
| live_until | timestamptz | yes |  |  |  | 0024_story_live_until_archive.sql |
| event_id | uuid | yes |  | public.events(id) | set null | 0045_stories_event_id.sql |
| page_id | uuid | yes |  | public.scrapbook_pages(id) | set null | 0054_scrapbook_pages.sql |
| revision | integer | no |  |  |  | 0054_scrapbook_pages.sql |

Indexes:
- `idx_stories_author` (author_id) in `0005_content_media_stories.sql`
- `idx_stories_created` (created_at desc) in `0005_content_media_stories.sql`
- `idx_stories_live_until` (live_until) in `0024_story_live_until_archive.sql`
- `idx_stories_expires_at` (expires_at) in `0024_story_live_until_archive.sql`
- `idx_stories_event` (event_id) where event_id is not null in `0045_stories_event_id.sql`
- `idx_stories_page` (page_id) where page_id is not null in `0054_scrapbook_pages.sql`

Policy `stories_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy stories_select on public.stories for select to authenticated using (public.can_view(author_id, visible_to_tier))
```

Policy `stories_insert` (insert, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy stories_insert on public.stories for insert to authenticated with check (author_id = auth.uid())
```

Policy `stories_update` (update, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy stories_update on public.stories for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

Policy `stories_delete` (delete, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy stories_delete on public.stories for delete to authenticated using (author_id = auth.uid())
```

## public.suggestion_skips

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| blocker_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| skipped_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |

Policy `suggestion_skips_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy suggestion_skips_all on public.suggestion_skips for all to authenticated using (blocker_id = auth.uid()) with check (blocker_id = auth.uid())
```

## public.tiers

Created in `0004_relationships.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| other_id | uuid | no |  | public.users(id) | cascade | 0004_relationships.sql |
| tier | tier | no |  |  |  | 0004_relationships.sql |
| created_at | timestamptz | no |  |  |  | 0004_relationships.sql |
| updated_at | timestamptz | no |  |  |  | 0004_relationships.sql |

Indexes:
- `idx_tiers_other` (other_id) in `0004_relationships.sql`

Policy `tiers_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy tiers_all on public.tiers for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.touch_grass

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0008_polls_touchgrass_activities.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0008_polls_touchgrass_activities.sql |
| audience_tier | tier | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| when_window | touch_grass_when | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| why | text | yes |  |  |  | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| expires_at | timestamptz | yes |  |  |  | 0018_touch_grass_responses.sql |

Indexes:
- `idx_touch_grass_author` (author_id) in `0008_polls_touchgrass_activities.sql`
- `idx_touch_grass_created` (created_at desc) in `0008_polls_touchgrass_activities.sql`
- `idx_touch_grass_expires` (expires_at) in `0018_touch_grass_responses.sql`

Policy `touch_grass_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy touch_grass_select on public.touch_grass for select to authenticated using (author_id = auth.uid() or public.can_view(author_id, audience_tier))
```

Policy `touch_grass_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy touch_grass_write on public.touch_grass for all to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid())
```

## public.touch_grass_responses

Created in `0018_touch_grass_responses.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| signal_id | uuid | no |  | public.touch_grass(id) | cascade | 0018_touch_grass_responses.sql |
| user_id | uuid | no |  | public.users(id) | cascade | 0018_touch_grass_responses.sql |
| status | text | no |  |  |  | 0018_touch_grass_responses.sql |
| created_at | timestamptz | no |  |  |  | 0018_touch_grass_responses.sql |

Indexes:
- `idx_touch_grass_responses_signal` (signal_id) in `0018_touch_grass_responses.sql`

Policy `touch_grass_responses_select` (select, roles: authenticated) in `0018_touch_grass_responses.sql`:

```sql
create policy touch_grass_responses_select on public.touch_grass_responses for select to authenticated using ( user_id = auth.uid() or exists ( select 1 from public.touch_grass tg where tg.id = signal_id and tg.author_id = auth.uid() ) )
```

Policy `touch_grass_responses_write` (all, roles: authenticated) in `0018_touch_grass_responses.sql`:

```sql
create policy touch_grass_responses_write on public.touch_grass_responses for all to authenticated using (user_id = auth.uid()) with check ( user_id = auth.uid() and exists ( select 1 from public.touch_grass tg where tg.id = signal_id and (tg.author_id = auth.uid() or public.can_view(tg.author_id, tg.audience_tier)) ) )
```

## public.user_contacts

Created in `0002_identity.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0002_identity.sql |
| email | text | yes |  |  |  | 0002_identity.sql |
| phone | text | yes |  |  |  | 0002_identity.sql |
| updated_at | timestamptz | no |  |  |  | 0002_identity.sql |

Policy `user_contacts_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy user_contacts_all on public.user_contacts for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.user_identity

Created in `0002_identity.sql`. RLS enabled: yes. Policies: 2.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0002_identity.sql |
| display_name | text | yes |  |  |  | 0002_identity.sql |
| avatar_media_id | uuid | yes |  | public.media(id) | set null | 0002_identity.sql |
| profile_song | text | yes |  |  |  | 0002_identity.sql |
| updated_at | timestamptz | no |  |  |  | 0002_identity.sql |
| avatar_filter | text | yes |  |  |  | 0051_avatar_photo_filter.sql |
| avatar_original_media_id | uuid | yes |  |  |  | 0051_avatar_photo_filter.sql |

Policy `user_identity_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy user_identity_select on public.user_identity for select to authenticated using (user_id = auth.uid() or public.can_view(user_id, 'acquaintance'))
```

Policy `user_identity_write` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy user_identity_write on public.user_identity for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.user_settings

Created in `0002_identity.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| user_id | uuid | no | yes | public.users(id) | cascade | 0002_identity.sql |
| discoverable | boolean | no |  |  |  | 0002_identity.sql |
| notif_prefs | jsonb | no |  |  |  | 0002_identity.sql |
| home_city | text | yes |  |  |  | 0002_identity.sql |
| meet_scope | text | no |  |  |  | 0002_identity.sql |
| theme | text | yes |  |  |  | 0002_identity.sql |
| locale | text | yes |  |  |  | 0002_identity.sql |
| updated_at | timestamptz | no |  |  |  | 0002_identity.sql |
| home_layout | jsonb | yes |  |  |  | 0016_admin_content_gaps.sql |
| onboarding_complete | boolean | no |  |  |  | 0021_onboarding_complete.sql |
| profile_presentation | jsonb | yes |  |  |  | 0027_profile_presentation.sql |
| assistant_enabled | boolean | no |  |  |  | 0029_assistant.sql |
| always_view_original | boolean | no |  |  |  | 0032_profile_customize_phase_b.sql |
| profile_custom_css | text | yes |  |  |  | 0032_profile_customize_phase_b.sql |
| profile_custom_html | jsonb | yes |  |  |  | 0032_profile_customize_phase_b.sql |
| profile_custom_code_status | text | yes |  |  |  | 0032_profile_customize_phase_b.sql |
| profile_custom_code_sanitized_at | timestamptz | yes |  |  |  | 0032_profile_customize_phase_b.sql |
| delight_opt_ins | text[] | no |  |  |  | 0036_delight_catalog.sql |
| can_invite | boolean | no |  |  |  | 0044_demo_week_invite_access.sql |
| demo_invite_sent_at | timestamptz | yes |  |  |  | 0044_demo_week_invite_access.sql |
| profile_color | text | yes |  |  |  | 0046_profile_color_onboarding.sql |
| social_battery | integer | yes |  |  |  | 0046_profile_color_onboarding.sql |
| connection_style | jsonb | yes |  |  |  | 0046_profile_color_onboarding.sql |
| profile_intro_seen | boolean | no |  |  |  | 0047_profile_intro_seen.sql |
| onboarding_step | text | yes |  |  |  | 0048_onboarding_progress.sql |
| onboarding_draft | jsonb | yes |  |  |  | 0048_onboarding_progress.sql |
| membership_interests | text[] | no |  |  |  | 0055_pending_people.sql |
| help_interests | text[] | no |  |  |  | 0055_pending_people.sql |
| page_authoring | text | yes |  |  |  | 0055_pending_people.sql |

Policy `user_settings_all` (all, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy user_settings_all on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())
```

## public.users

Created in `0002_identity.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes | auth.users(id) | cascade | 0002_identity.sql |
| auth_provider | text | yes |  |  |  | 0002_identity.sql |
| status | text | no |  |  |  | 0002_identity.sql |
| created_at | timestamptz | no |  |  |  | 0002_identity.sql |

Policy `users_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy users_select on public.users for select to authenticated using (id = auth.uid() or public.can_view(id, 'acquaintance'))
```

## public.week_summaries

Created in `0028_ai_system.sql`. RLS enabled: yes. Policies: 0.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0028_ai_system.sql |
| author_id | uuid | no |  | public.users(id) | cascade | 0028_ai_system.sql |
| week_start | date | no |  |  |  | 0028_ai_system.sql |
| days_json | jsonb | no |  |  |  | 0028_ai_system.sql |
| built_at | timestamptz | no |  |  |  | 0028_ai_system.sql |

Indexes:
- `idx_week_summaries_author` (author_id) in `0028_ai_system.sql`

Policies: none in migrations.

## public.weekly_activities

Created in `0008_polls_touchgrass_activities.sql`. RLS enabled: yes. Policies: 1.

| Column | Type | Nullable | PK | References | On delete | Added in |
|---|---|---|---|---|---|---|
| id | uuid | no | yes |  |  | 0008_polls_touchgrass_activities.sql |
| title | text | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| prompt | text | yes |  |  |  | 0008_polls_touchgrass_activities.sql |
| active | boolean | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| starts_at | timestamptz | yes |  |  |  | 0008_polls_touchgrass_activities.sql |
| ends_at | timestamptz | yes |  |  |  | 0008_polls_touchgrass_activities.sql |
| created_at | timestamptz | no |  |  |  | 0008_polls_touchgrass_activities.sql |
| cover | jsonb | yes |  |  |  | 0017_quiz_activity_covers.sql |
| emoji | text | yes |  |  |  | 0017_quiz_activity_covers.sql |
| closes_in | text | yes |  |  |  | 0017_quiz_activity_covers.sql |
| post_mode | text | no |  |  |  | 0053_side_quest_notes_app.sql |

Policy `weekly_activities_select` (select, roles: authenticated) in `0012_rls_policies.sql`:

```sql
create policy weekly_activities_select on public.weekly_activities for select to authenticated using (true)
```

## Functions

- `can_view` security_definer=true search_path=public defined in `0013_harden_functions.sql`
- `drop_zone_c_on_undiscoverable` security_definer=true search_path=public defined in `0028_ai_system.sql`
- `handle_new_user` security_definer=true search_path=public defined in `0055_pending_people.sql`
- `merge_pending_people_for_user` security_definer=true search_path=public defined in `0055_pending_people.sql`
- `purge_assistant_on_disable` security_definer=true search_path=public defined in `0029_assistant.sql`
- `purge_expired_recaps` security_definer=true search_path=public defined in `0019_recap_podcast.sql`
- `purge_matching_for_user` security_definer=true search_path=public defined in `0030_matching.sql`
- `set_updated_at` security_definer=false search_path='' defined in `0013_harden_functions.sql`
- `touch_scrapbook_page` security_definer=false search_path=public defined in `0054_scrapbook_pages.sql`
- `trg_discoverable_purge_matching` security_definer=true search_path=public defined in `0030_matching.sql`
- `user_contacts_phone_merge` security_definer=true search_path=public defined in `0055_pending_people.sql`

## Triggers

- `trg_user_identity_updated_at` before update on public.user_identity -> set_updated_at (`0002_identity.sql`)
- `trg_user_contacts_updated_at` before update on public.user_contacts -> set_updated_at (`0002_identity.sql`)
- `trg_user_settings_updated_at` before update on public.user_settings -> set_updated_at (`0002_identity.sql`)
- `trg_attributes_updated_at` before update on public.attributes -> set_updated_at (`0003_attributes.sql`)
- `trg_tiers_updated_at` before update on public.tiers -> set_updated_at (`0004_relationships.sql`)
- `trg_connections_updated_at` before update on public.connections -> set_updated_at (`0004_relationships.sql`)
- `trg_friend_notes_updated_at` before update on public.friend_notes -> set_updated_at (`0004_relationships.sql`)
- `trg_events_updated_at` before update on public.events -> set_updated_at (`0007_events.sql`)
- `trg_event_invites_updated_at` before update on public.event_invites -> set_updated_at (`0007_events.sql`)
- `trg_person_embeddings_updated_at` before update on public.person_embeddings -> set_updated_at (`0009_ai_rag.sql`)
- `trg_person_summaries_updated_at` before update on public.person_summaries -> set_updated_at (`0009_ai_rag.sql`)
- `trg_coop_memberships_updated_at` before update on public.coop_memberships -> set_updated_at (`0010_membership_payments.sql`)
- `trg_plan_state_updated_at` before update on public.plan_state -> set_updated_at (`0010_membership_payments.sql`)
- `trg_admin_config_updated_at` before update on public.admin_config -> set_updated_at (`0011_admin_quizzes_notifications.sql`)
- `on_auth_user_created` after insert on auth.users -> handle_new_user (`0015_new_user_trigger.sql`)
- `trg_event_assignments_updated_at` before update on public.event_assignments -> set_updated_at (`0023_event_assignments_cover.sql`)
- `trg_coop_ideas_updated_at` before update on public.coop_ideas -> set_updated_at (`0024_coop_portal.sql`)
- `trg_coop_dues_votes_updated_at` before update on public.coop_dues_votes -> set_updated_at (`0024_coop_portal.sql`)
- `trg_ai_config_updated_at` before update on public.ai_config -> set_updated_at (`0028_ai_system.sql`)
- `trg_module_moderator_notes_updated_at` before update on public.module_moderator_notes -> set_updated_at (`0028_ai_system.sql`)
- `trg_drop_zone_c_on_undiscoverable` after update of discoverable on public.user_settings -> drop_zone_c_on_undiscoverable (`0028_ai_system.sql`)
- `trg_assistant_memory_chunks_updated_at` before update on public.assistant_memory_chunks -> set_updated_at (`0029_assistant.sql`)
- `trg_purge_assistant_on_disable` after update of assistant_enabled on public.user_settings -> purge_assistant_on_disable (`0029_assistant.sql`)
- `trg_user_settings_purge_matching` after update of discoverable on public.user_settings -> trg_discoverable_purge_matching (`0030_matching.sql`)
- `trg_billy_config_updated_at` before update on public.billy_config -> set_updated_at (`0037_billy_billing.sql`)
- `trg_billy_subscriptions_updated_at` before update on public.billy_subscriptions -> set_updated_at (`0037_billy_billing.sql`)
- `trg_billy_balances_updated_at` before update on public.billy_balances -> set_updated_at (`0037_billy_billing.sql`)
- `trg_coop_promo_codes_updated_at` before update on public.coop_promo_codes -> set_updated_at (`0042_coop_promo_codes.sql`)
- `trg_scrapbook_pages_touch` before update on public.scrapbook_pages -> touch_scrapbook_page (`0054_scrapbook_pages.sql`)
- `on_user_contacts_phone_merge` after insert or update of phone on public.user_contacts -> user_contacts_phone_merge (`0055_pending_people.sql`)

## Enums

- `attr_layer`: `essential`, `profile`, `connection`
- `connection_status`: `pending`, `accepted`
- `coop_plan`: `free`, `coop`
- `delight_scope`: `global`, `opt-in`, `gift`
- `event_invite_status`: `going`, `cant`, `invited`
- `friend_note_kind`: `text`, `date`, `check_in`
- `made_via`: `link`, `qr`, `add`, `suggestion`
- `media_kind`: `photo`, `video`, `audio`
- `met_context`: `event`, `place`, `mutual`, `qr`, `link`
- `payment_kind`: `coop_dues`, `billy_plus`
- `quiz_question_type`: `single`, `multi`
- `quiz_status`: `live`, `draft`, `archived`
- `reaction_kind`: `circleVideo`, `text`, `sticker`
- `storage_plan`: `rolling30`, `unlimited`
- `story_type`: `photo`, `video`, `audio`
- `summary_cadence`: `weekly`, `daily`
- `tier`: `none`, `acquaintance`, `friend`, `close`
- `touch_grass_when`: `now`, `tonight`, `weekend`
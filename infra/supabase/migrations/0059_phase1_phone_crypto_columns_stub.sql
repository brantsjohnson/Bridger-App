-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Adds nullable parallel columns for Phase 1 phone encryption (HMAC lookup +
-- ciphertext + key metadata). Plaintext phone columns stay until a later cutover
-- pass backfills and switches reads. Do not drop phone / phone_e164 here.
-- ============================================

-- --- user_contacts: parallel crypto columns (cutover later). ---
alter table public.user_contacts
  add column if not exists phone_hmac text,
  add column if not exists phone_ciphertext text,
  add column if not exists key_id text,
  add column if not exists key_version integer;

comment on column public.user_contacts.phone_hmac is
  'Phase 1: HMAC(normalized E.164) for merge/friend find. Populated during cutover; plaintext phone remains until retired.';
comment on column public.user_contacts.phone_ciphertext is
  'Phase 1: envelope ciphertext for phone. Populated during cutover; not used for reads until cutover ships.';
comment on column public.user_contacts.key_id is
  'Phase 1: logical KMS / DEK id for phone_ciphertext.';
comment on column public.user_contacts.key_version is
  'Phase 1: DEK rotation version for phone_ciphertext.';

-- --- pending_people: same pattern for author cards (cutover later). ---
alter table public.pending_people
  add column if not exists phone_hmac text,
  add column if not exists phone_ciphertext text,
  add column if not exists key_id text,
  add column if not exists key_version integer;

comment on column public.pending_people.phone_hmac is
  'Phase 1: HMAC(normalized E.164) for signup merge. Plaintext phone_e164 remains until cutover.';
comment on column public.pending_people.phone_ciphertext is
  'Phase 1: envelope ciphertext for phone_e164 during cutover.';
comment on column public.pending_people.key_id is
  'Phase 1: logical KMS / DEK id for phone_ciphertext.';
comment on column public.pending_people.key_version is
  'Phase 1: DEK rotation version for phone_ciphertext.';

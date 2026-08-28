-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Remembers HOW someone paid for co-op membership (Apple, Google, Stripe, soft,
-- or promo) and the store / Stripe subscription id, so renewals and cancels
-- from RevenueCat / Stripe webhooks can update the right row. Also stores a
-- Stripe customer id when they paid by card.
--
-- SECURITY: `coop_memberships` already has RLS (own-row); Nest writes with the
-- service key. Hard-deleted with the account.
-- ============================================

alter table public.coop_memberships
  add column if not exists provider text,
  add column if not exists provider_subscription_id text,
  add column if not exists stripe_customer_id text;

comment on column public.coop_memberships.provider is
  'Who charged dues: apple | google | stripe | soft | promo. Cleared / replaced on each join.';

comment on column public.coop_memberships.provider_subscription_id is
  'Store or Stripe subscription id used by webhooks to find this membership.';

comment on column public.coop_memberships.stripe_customer_id is
  'Stripe customer id when they paid by card. Null for Apple / Google / promo.';

create index if not exists idx_coop_memberships_provider_sub
  on public.coop_memberships (provider_subscription_id)
  where provider_subscription_id is not null;

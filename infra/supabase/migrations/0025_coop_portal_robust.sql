-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Period-end cancel columns on membership, plus richer portal seed copy
-- (mission bodies, economics categories, roles, beta notes) from the old
-- Express coop seed — so the public multi-page portal has real substance.
-- ============================================

-- Period-end cancel: keep perks until dues_paid_through, then reconcile to free.
alter table public.coop_memberships
  add column if not exists cancel_at_period_end boolean not null default false;
alter table public.coop_memberships
  add column if not exists cancelled_at timestamptz;

-- Enrich mission principle bodies (idempotent update by slug)
update public.coop_mission_principles set body = v.body
from (values
  ('people-over-engagement', 'Bridger should help people spend less time scrolling and more time building real-world relationships.'),
  ('no-attention-traps', 'Bridger will not rely on addiction, endless feeds, or data extraction to make money.'),
  ('one-member-one-vote', 'Every member''s voice carries equal weight, no matter when they joined or how much they pay.'),
  ('mission-cant-be-sold', 'Bridger''s purpose is protected from buyers, investors, or pressure that would gut what it stands for, and it should grow and adapt without losing that purpose.'),
  ('value-stays-with-members', 'Bridger exists to serve the people who use it, not outside owners extracting profit from them.'),
  ('you-control-your-data', 'Members decide what they share, and their information is never sold or treated as the product.'),
  ('transparency-by-default', 'Costs, tradeoffs, and decisions should be visible so members can understand how the platform runs.')
) as v(slug, body)
where public.coop_mission_principles.slug = v.slug;

-- Replace thin economics with Express annual categories as monthly_cents (annual/12).
delete from public.coop_economics_assumptions;
insert into public.coop_economics_assumptions (category, label, monthly_cents, notes, sort_order)
values
  ('hosting', 'Hosting (VPS / cloud)', 100, 'Annual $1,200 → monthly', 0),
  ('matching', 'Matching compute', 100, 'Friend overlap; never photos. Annual $1,200', 1),
  ('storage', 'Media storage', 50, 'Annual $600', 2),
  ('email_sms', 'Email / SMS', 50, 'Annual $600', 3),
  ('legal', 'Legal', 208, 'Annual $2,500', 4),
  ('accounting', 'Accounting', 100, 'Annual $1,200', 5),
  ('development', 'Development', 1667, 'Annual $20,000', 6),
  ('moderation', 'Moderation', 417, 'Annual $5,000', 7),
  ('marketing', 'Marketing', 833, 'Annual $10,000', 8),
  ('support', 'Support', 250, 'Annual $3,000', 9),
  ('events', 'Events', 417, 'Annual $5,000', 10),
  ('community', 'Community activities', 208, 'Annual $2,500', 11);

-- Enrich roles with Express responsibilities / hours / risks
delete from public.coop_roles;
insert into public.coop_roles (title, responsibilities, hours_week, risks, sort_order)
values
  (
    'Founder / CEO',
    E'Product strategy (6 hrs/week)\nRoadmap prioritization (4 hrs/week)\nPartnership strategy (2 hrs/week)\nEvent strategy (2 hrs/week)\nBusiness formation (2 hrs/week)\nConflict management (1 hr/week)\nCommunity expectations (1 hr/week)\nBudgeting (3 hrs/week)\nFunding development (2 hrs/week)\nInfrastructure decisions (2 hrs/week)\nVendor management (1 hr/week)\nLegal coordination (1 hr/week)\nAccounting coordination (1 hr/week)\nMarketing (5 hrs/week)\nOperations (4 hrs/week)\nSocial media (1.5 hrs/week)\nHiring decisions (1 hr/week)\nContributor coordination (2 hrs/week)\nRelease decisions (2 hrs/week)\nLong-term mission stewardship (2 hrs/week)',
    '12–45',
    E'Financial risk\nReputation risk\nLegal risk\nProduct failure risk\nCommunity accountability\nTime burden',
    0
  ),
  (
    'Developer',
    E'Build product features (12 hrs/week)\nMaintain codebase (8 hrs/week)\nManage bugs (6 hrs/week)\nImprove performance (4 hrs/week)\nSupport security (3 hrs/week)\nMaintain integrations (2 hrs/week)\nSupport app releases (2 hrs/week)',
    '8–37',
    null,
    1
  ),
  (
    'Designer',
    E'User experience (4 hrs/week)\nUser interface (4 hrs/week)\nBrand consistency (2 hrs/week)\nAccessibility (2 hrs/week)\nVisual systems (1 hr/week)\nUsability testing (1 hr/week)',
    '3–14',
    null,
    2
  ),
  (
    'Moderator',
    E'Community support (5 hrs/week)\nConflict de-escalation (3 hrs/week)\nRule enforcement (3 hrs/week)\nWelcoming new members (3 hrs/week)\nReporting concerns (2 hrs/week)\nProtecting community health (2 hrs/week)',
    '4–18',
    null,
    3
  ),
  (
    'Social Media / Marketing',
    E'Social media content (4 hrs/week)\nCampaign planning (3 hrs/week)\nCommunity programming (3 hrs/week)\nMember onboarding (2 hrs/week)\nStorytelling (2 hrs/week)',
    '3–15',
    null,
    4
  );

-- Enrich open Beta 0.2 narrative (keep BRIDGER-BETA hash)
update public.coop_beta_versions
set
  release_notes = E'• Smoother onboarding and profile editing\n• Faster, clearer friend discovery\n• Daily bulletin reliability fixes\n• Several performance and accessibility improvements',
  known_issues = 'Theme previews can flicker when switching presets quickly.',
  unfinished = E'• Group activities and event planning are not built yet\n• Notifications are limited and may be delayed\n• Some profile theme presets are placeholders\n• Search and discovery filters are still basic',
  test_url = coalesce(nullif(test_url, ''), '/')
where label = 'Beta 0.2';

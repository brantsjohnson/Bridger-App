-- ============================================
-- WHAT THIS FILE DOES (plain English):
-- Parks the emoji-bomb gift so it is not live on profiles. Code stays; admin
-- can turn it back on later. Does not drop tables or gift history.
-- ============================================

update public.delights
set
  enabled = false,
  status = 'built',
  notes = 'Parked. Gift: friend sends; rains emojis on recipient next open. Flip enabled + status=live to restore.'
where slug = 'emoji-bomb';

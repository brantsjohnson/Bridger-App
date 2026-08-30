-- ============================================
-- WHAT THIS MIGRATION DOES (plain English):
-- Marks the "Which J name are you?" quiz as the live Home quiz in admin_config
-- so operators and the generic /quizzes/current path agree with the standing
-- J-name card. Does not create new tables (those landed in 0043_jname_quiz).
-- ============================================

update public.admin_config
set live_quiz_slug = 'what-j-name'
where live_quiz_slug is null
   or live_quiz_slug = '';

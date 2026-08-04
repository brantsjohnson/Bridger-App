// ============================================
// WHAT THIS FILE DOES (plain English):
// Compatibility re-exports. Prefer importing from data/* and hooks/* —
// this file only exists so older relative imports keep typechecking while
// we finish the migration. Do not add new demo data here.
// ============================================
export {
  COMING_UP,
  COOP_ANNOUNCEMENTS,
  EVENTS,
  FREE_SIGNALS,
  HOME_POLLS,
  ME,
  MY_STORY,
  NOTIFICATIONS,
  PEOPLE,
  QUIZ,
  STORIES,
  STORY_REPLIES,
  WEEKLY_ACTIVITY,
  type HomePoll
} from '../data/fixtures/catalog';

export { personById } from '../data/people';

// The generated database shape (tables, columns, enums) straight from Supabase.
// Import { Database, Tables } from '@bridger/shared' to type Supabase queries.
export * from './database.types';

export * from './model/profile-attribute';
export * from './model/tier';
export * from './model/person';
export * from './model/story';
export * from './model/event';
export * from './model/event-recurrence';
export * from './model/connection';
export * from './model/cover';
export * from './model/coop';
export * from './coop/cost-model';
export * from './coop/format-number';
export * from './model/profile-theme';
export * from './model/profile-presentation';
export * from './model/profile-page';
export * from './model/music';
export * from './model/message';
export * from './model/quiz';
export * from './model/jname';
export * from './model/disclosure';
export * from './model/weekly-activity';
export * from './model/delight';
export * from './model/admin-config';
export * from './model/demo-week';
export * from './model/assistant';
export * from './model/billy';
export * from './model/matching';
export * from './model/recap';
export * from './model/not-found-hit';
export * from './model/notification';

// Analytics: taxonomy IDs + consent-gated emit client (PostHog-ready).
// Export IDs straight from ids.ts (not only via nested `export *`) so Metro
// always gets a real COOP binding. Do not also `export *` the same names first —
// TypeScript emits `exports.COOP = void 0` which blocks star-reexports.
export * from './analytics/types';
export * from './analytics/sanitize';
export * from './analytics/client';
export {
  AUTH,
  ONBOARDING,
  WELCOME_CELEBRATION,
  CHROME,
  HOME,
  SECTION_INFO_TOOLTIP,
  TOUCH_GRASS_SHEET,
  GRASS_SIGNAL_SHEET,
  DISCOVER,
  CONNECT_OVER,
  BEHIND_THE_SCENES,
  YOUR_FUNNY_BONE,
  YOUR_VIBE,
  THE_FRIEND_ZONE,
  WHAT_GETS_YOU_GOING,
  FRIENDS,
  RECAP_RECORDER,
  RECAP_PLAYER,
  PROFILE,
  CUSTOMIZE,
  ASK_SHEET,
  EVENTS,
  CREATE_EVENT,
  STORY,
  STICKER_TRAY,
  STICKER_STUDIO,
  CIRCLE_RECORDER,
  CATCH_UP,
  POST_COMPOSER,
  MESSAGES,
  NEW_MESSAGE_SHEET,
  REVEAL,
  QUIZ,
  END_QUIZ_SHEET,
  ACTIVITY,
  ACTIVITY_CAPTURE,
  ADD_INSIDE_JOKE_SHEET,
  NOTIFICATIONS,
  NEWS,
  NOT_FOUND,
  COOP,
  DELIGHT,
  SEND_DELIGHT_SHEET,
  ASSISTANT,
  INVITE_ACCESS,
  ADMIN,
  aid,
  parseAnalyticsId
} from './analytics/ids';

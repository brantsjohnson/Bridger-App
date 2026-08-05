// The generated database shape (tables, columns, enums) straight from Supabase.
// Import { Database, Tables } from '@bridger/shared' to type Supabase queries.
export * from './database.types';

export * from './model/profile-attribute';
export * from './model/tier';
export * from './model/person';
export * from './model/story';
export * from './model/event';
export * from './model/connection';
export * from './model/cover';
export * from './model/coop';
export * from './coop/cost-model';
export * from './coop/format-number';
export * from './model/profile-theme';
export * from './model/message';
export * from './model/quiz';
export * from './model/weekly-activity';
export * from './model/delight';
export * from './model/admin-config';
export * from './model/recap';
export * from './model/not-found-hit';
export * from './model/notification';

// Analytics: taxonomy IDs + consent-gated emit client (PostHog-ready).
// Re-export IDs by name (not only `export *`) so Metro/Expo always bind them —
// nested `export *` can leave COOP undefined at runtime ("reading 'portal'").
export {
  AUTH,
  ONBOARDING,
  CHROME,
  HOME,
  SECTION_INFO_TOOLTIP,
  TOUCH_GRASS_SHEET,
  GRASS_SIGNAL_SHEET,
  DISCOVER,
  CONNECT_OVER,
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
  ACTIVITY,
  ACTIVITY_CAPTURE,
  NOTIFICATIONS,
  NOT_FOUND,
  COOP,
  DELIGHT,
  ADMIN,
  aid,
  parseAnalyticsId
} from './analytics/ids';
export * from './analytics';

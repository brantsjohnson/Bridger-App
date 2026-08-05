// ============================================
// WHAT THIS FILE DOES (plain English):
// Front door for Bridger analytics — IDs from the taxonomy, the emit client,
// and the shared types. Screens and UI primitives import from here (via
// @bridger/shared) so every event uses the same names.
// ============================================

export * from './types';
export * from './ids';
export * from './client';

// Named re-exports so bundlers that mishandle nested `export *` still get IDs.
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
} from './ids';

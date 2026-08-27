// ============================================
// WHAT THIS FILE DOES (plain English):
// Analytics taxonomy IDs for the mobile app. Imports straight from the shared
// ids module (not the @bridger/shared barrel) so Metro never gets an undefined
// COOP from nested `export *` + `exports.COOP = void 0` interop.
// ============================================
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
  END_QUIZ_SHEET,
  ACTIVITY,
  ACTIVITY_CAPTURE,
  NOTIFICATIONS,
  NOT_FOUND,
  COOP,
  DELIGHT,
  ADMIN
} from '../../../packages/shared/src/analytics/ids';

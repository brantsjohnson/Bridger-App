// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes used by Bridger analytics. UI events use a small set of action
// names (click, dead_click, swipe…); product events use their own names
// (friend_retiered, touch_grass_sent…). Properties stay snake_case and match
// ANALYTICS-TAXONOMY.md so PostHog funnels group cleanly.
// ============================================

/** UI actions that PostHog receives as the event name. */
export type AnalyticsUiAction =
  | 'click'
  | 'double_click'
  | 'long_press'
  | 'swipe'
  | 'drag'
  | 'scroll_v'
  | 'scroll_h'
  | 'focus'
  | 'blur'
  | 'submit'
  | 'view'
  | 'dead_click'
  | 'rage_click'
  | 'misclick'
  | 'surface_opened'
  | 'surface_dismissed'
  | 'page_viewed'
  | 'flow_started'
  | 'flow_step'
  | 'flow_completed'
  | 'flow_abandoned';

/** How a choice was made (QR vs link, swipe vs dropdown, etc.). */
export type AnalyticsMethod =
  | 'qr'
  | 'link'
  | 'scan'
  | 'suggestion'
  | 'photo'
  | 'video'
  | 'text'
  | 'voice'
  | 'comment'
  | 'sticker'
  | 'reaction'
  | 'swipe'
  | 'dropdown'
  | 'hover'
  | 'tap'
  | 'google'
  | 'apple'
  | 'email';

/** Named product outcomes from ANALYTICS-TAXONOMY.md §3b. */
export type AnalyticsProductEvent =
  | 'quiz_started'
  | 'quiz_question_answered'
  | 'quiz_question_skipped'
  | 'quiz_adapted'
  | 'quiz_abandoned'
  | 'quiz_completed'
  | 'delight_gifted'
  | 'delight_played'
  | 'activity_posted'
  | 'activity_hearted'
  | 'home_layout_saved'
  | 'notification_opened'
  | 'notification_see_all'
  | 'notification_pref_changed'
  /** Mark all as read on the Notifications page */
  | 'notifications_marked_read'
  | 'module_started'
  | 'module_completed'
  | 'module_item_added'
  | 'friend_added'
  | 'friend_retiered'
  | 'friend_removed'
  | 'friend_blocked'
  | 'friend_reported'
  /** private note / date / check-in saved on a friend (never note text) */
  | 'friend_note_added'
  | 'friend_note_deleted'
  /** soft check-in nudge fired for the author */
  | 'friend_check_in_reminded'
  | 'story_posted'
  | 'response_posted'
  /** someone made their own sticker (no image data — just that they made one) */
  | 'sticker_created'
  | 'touch_grass_sent'
  | 'touch_grass_answered'
  | 'touch_grass_declined'
  /** posted your weekly recap (voice answers) — counts only, never audio */
  | 'recap_posted'
  /** played the weekly recap podcast */
  | 'recap_played'
  /** sent a sticker/emoji reaction to someone's recap (never the emoji itself) */
  | 'recap_reaction_sent'
  /** suggested a question for a future recap week */
  | 'recap_question_submitted'
  /** upvoted a submitted recap question */
  | 'recap_question_voted'
  | 'poll_created'
  | 'poll_answered'
  | 'event_created'
  | 'event_assignment_added'
  | 'event_assignment_taken'
  | 'event_assignment_released'
  | 'event_assignment_done'
  | 'event_shared'
  | 'event_introduction_notified'
  | 'rsvp_going'
  | 'rsvp_cant'
  | 'inside_joke_posted'
  | 'bucket_item_checked'
  | 'bucket_item_updated'
  | 'bucket_item_deleted'
  | 'profile_customized'
  | 'connection_revealed'
  /** soft or paid join — never receipt / PII */
  | 'coop_joined'
  | 'coop_left'
  /** scheduled leave; perks stay until paid-through */
  | 'coop_cancel_scheduled'
  | 'auth_signed_in'
  | 'auth_signed_up'
  | 'message_sent'
  | 'contact_shared'
  /** unmatched route or broken connection path — path trail goes to admin */
  | 'screen_not_found';

/** Shared properties stamped on every event. */
export type AnalyticsBaseProps = {
  /** Full `screen.section.element` id when this is a UI event. */
  id?: string;
  screen?: string;
  section?: string;
  element?: string;
  surface?: string;
  parent_screen?: string;
  interaction_index?: number;
  first_interaction?: boolean;
  method?: AnalyticsMethod | string;
  flow?: string;
  flow_step?: string;
  timestamp?: string;
  duration_since_screen_load?: number;
  dwell_ms?: number;
  time_to_complete_ms?: number;
  page_index?: number;
  carousel_depth?: number;
  platform?: string;
  app_version?: string;
  session_id?: string;
  /** Opaque consented user ref only — never name/email/phone. */
  user_ref?: string;
  count?: number;
  [key: string]: string | number | boolean | undefined | null;
};

export type AnalyticsSink = {
  capture: (event: string, properties: AnalyticsBaseProps) => void;
  identify?: (userRef: string) => void;
  reset?: () => void;
  optIn?: () => void;
  optOut?: () => void;
};

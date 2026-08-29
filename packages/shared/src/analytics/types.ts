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
  | 'double_tap'
  | 'a11y'
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
  /** Shared a quiz result: method = image | link | save_image (never result text) */
  | 'quiz_shared'
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
  /** Travel place starred as FAV (never place names) */
  | 'place_favorited'
  /** Home Announcements quick check: user confirmed the fact is still true */
  | 'quick_check_kept'
  /** Home Announcements quick check: user said the fact is no longer true */
  | 'quick_check_removed'
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
  /**
   * Invite link shared via SMS compose or OS share sheet (confirmed, not the tap).
   * Never names/phones. Props: method sms|share, context, optional slot 1|2|3.
   */
  | 'invite_link_shared'
  | 'story_posted'
  /** Mid-party capture nudge fired (story_prompt pref on, under daily cap). */
  | 'party_capture_prompt_sent'
  | 'response_posted'
  /** Finished every update in the Home tray (or a lone author) and saw the end screen */
  | 'stories_caught_up'
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
  /** Someone was added to an event invite list (host or attendee). Never names. */
  | 'event_guest_invited'
  | 'rsvp_going'
  | 'rsvp_cant'
  | 'inside_joke_posted'
  | 'bucket_item_checked'
  | 'bucket_item_updated'
  | 'bucket_item_deleted'
  | 'profile_customized'
  /**
   * Profile / About Me photo saved after Take or Upload (confirmed upload, not
   * the sheet open). method = camera | library. Never the image.
   */
  | 'profile_photo_updated'
  /** Theme tokens saved on customize (accent/background/font/mode). */
  | 'profile_theme_saved'
  /** Layout order of movable modules saved on customize. */
  | 'profile_layout_saved'
  | 'connection_revealed'
  /** soft or paid join — never receipt / PII. method includes 'promo' for auth codes. */
  | 'coop_joined'
  /** Redeemed a promo / auth code for a free year. Never logs the code string. */
  | 'coop_promo_redeemed'
  /**
   * Subscription renewed (RevenueCat RENEWAL / Stripe invoice cycle).
   * Server webhook only. Never receipt / PII.
   */
  | 'coop_renewed'
  /**
   * Membership ended after paid-through (RevenueCat EXPIRATION / Stripe
   * subscription deleted). Server webhook only. Never receipt / PII.
   */
  | 'coop_expired'
  | 'coop_left'
  /** scheduled leave; perks stay until paid-through */
  | 'coop_cancel_scheduled'
  | 'auth_signed_in'
  | 'auth_signed_up'
  /** Confirmed Log out from Profile Settings (not a mere tap on the button). */
  | 'auth_signed_out'
  /** Runtime demo unlocked (logo long-press confirmed). */
  | 'demo_mode_entered'
  /** Person left runtime demo from Settings. */
  | 'demo_mode_left'
  | 'message_sent'
  /** Double-tap heart on a friend's bubble. Never counts as a sent message. */
  | 'message_hearted'
  | 'contact_shared'
  /** unmatched route or broken connection path — path trail goes to admin */
  | 'screen_not_found'
  /** Assistant opt-in (never logs query/note/transcript text) */
  | 'assistant_enabled'
  | 'billy_allowance_exhausted'
  | 'billy_plus_started'
  | 'billy_plus_cancel_scheduled'
  | 'billy_vendor_outage_seen'
  | 'assistant_disabled'
  | 'assistant_opened'
  | 'assistant_query'
  | 'assistant_tool_proposed'
  | 'assistant_action_confirmed'
  | 'assistant_action_cancelled'
  | 'assistant_action_undone'
  | 'permission_result'
  /** Linked Spotify (or later Apple Music). Never logs track titles. */
  | 'music_connected'
  | 'music_disconnected'
  /** Confirmed ~30s preview started (not the tap alone if play failed). */
  | 'music_preview_played'
  /** Saved a catalog pick (listening / song of week / fav). */
  | 'music_pick_saved'
  /** Added a friend's track to the viewer's Spotify library/playlist. */
  | 'music_saved_to_library'
  /** Synced top artists for overlap (server-confirmed). */
  | 'music_taste_synced'
  /** Person turned product analytics on in Settings (after confirm). */
  | 'analytics_opted_in'
  /** Person turned product analytics off in Settings (fires before capture stops). */
  | 'analytics_opted_out';

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
  /** Invite path for event_guest_invited — host vs attendee, never names. */
  via?: 'host' | 'attendee';
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
  /** Push queued events now (used right before opt-out / person purge). */
  flush?: () => void | Promise<void>;
};

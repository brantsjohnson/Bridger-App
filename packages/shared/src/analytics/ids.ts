// ============================================
// WHAT THIS FILE DOES (plain English):
// Every measurable element's ID, copied from ANALYTICS-TAXONOMY.md so screens
// never invent names. Format is screen.section.element. Reuse element names
// across screens; the screen/surface field tells you where the tap happened.
// ============================================

/** Build a taxonomy id. Keeps call sites readable: aid('home', 'stories_row', 'your_story'). */
export function aid(screen: string, section: string, element: string): string {
  return `${screen}.${section}.${element}`;
}

/** Split an id into screen / section / element for event properties. */
export function parseAnalyticsId(id: string): {
  screen?: string;
  section?: string;
  element?: string;
} {
  const parts = id.split('.');
  if (parts.length < 3) return { element: id };
  const [screen, section, ...rest] = parts;
  return { screen, section, element: rest.join('.') };
}

// --- Auth (welcome + sign-in / sign-up) ---
export const AUTH = {
  welcome: {
    brand: aid('auth', 'welcome', 'brand'),
    beat_body: aid('auth', 'welcome', 'beat_body'),
    /** Fills over 5s after typing; not its own tap target (the Next button is). */
    progress_bar: aid('auth', 'welcome', 'progress_bar'),
    /** Appears after a CRT screen finishes typing. method tap | auto. */
    next: aid('auth', 'welcome', 'next')
  },
  sign_in: {
    page_title: aid('auth', 'sign_in', 'page_title'),
    /** Center Bridger mark; long-press unlocks demo when the build allows it. */
    brand_logo: aid('auth', 'sign_in', 'brand_logo'),
    google: aid('auth', 'sign_in', 'google'),
    apple: aid('auth', 'sign_in', 'apple'),
    /** Subtle link under OAuth to reveal the email + password form. */
    manual_link: aid('auth', 'sign_in', 'manual_link'),
    email: aid('auth', 'sign_in', 'email'),
    password: aid('auth', 'sign_in', 'password'),
    submit: aid('auth', 'sign_in', 'submit'),
    switch_to_sign_up: aid('auth', 'sign_in', 'switch_to_sign_up'),
    /** Phone number field (E.164). Never logs the digits. */
    phone: aid('auth', 'sign_in', 'phone'),
    /** Send the SMS one-time code. */
    send_code: aid('auth', 'sign_in', 'send_code'),
    /** One-time code field (iOS autofill). Never logs the code. */
    otp_code: aid('auth', 'sign_in', 'otp_code'),
    /** Confirm the SMS code. */
    verify: aid('auth', 'sign_in', 'verify'),
    /** Resend the SMS code after the cooldown. */
    resend_otp: aid('auth', 'sign_in', 'resend_otp')
  },
  sign_up: {
    page_title: aid('auth', 'sign_up', 'page_title'),
    google: aid('auth', 'sign_up', 'google'),
    apple: aid('auth', 'sign_up', 'apple'),
    /** Subtle link under OAuth to reveal the email sign-up form. */
    manual_link: aid('auth', 'sign_up', 'manual_link'),
    email: aid('auth', 'sign_up', 'email'),
    password: aid('auth', 'sign_up', 'password'),
    confirm_password: aid('auth', 'sign_up', 'confirm_password'),
    submit: aid('auth', 'sign_up', 'submit'),
    switch_to_sign_in: aid('auth', 'sign_up', 'switch_to_sign_in')
  }
} as const;

// --- Onboarding (post-auth Typeform flow) ---
export const ONBOARDING = {
  chrome: {
    continue: aid('onboarding', 'chrome', 'continue'),
    skip: aid('onboarding', 'chrome', 'skip'),
    back: aid('onboarding', 'chrome', 'back'),
    progress_bar: aid('onboarding', 'chrome', 'progress_bar'),
    step_title: aid('onboarding', 'chrome', 'step_title'),
    /** ⓘ that opens the claim-and-proof note on New info screens */
    info_note: aid('onboarding', 'chrome', 'info_note')
  },
  privacy: {
    acknowledge: aid('onboarding', 'privacy', 'acknowledge'),
    next_1: aid('onboarding', 'privacy', 'next_1'),
    next_2: aid('onboarding', 'privacy', 'next_2'),
    save_audience: aid('onboarding', 'privacy', 'save_audience'),
    group_option: aid('onboarding', 'privacy', 'group_option'),
    next_4: aid('onboarding', 'privacy', 'next_4'),
    next_5: aid('onboarding', 'privacy', 'next_5'),
    next_7: aid('onboarding', 'privacy', 'next_7'),
    /** dead — birthday / groups visual on the privacy story screens */
    visual: aid('onboarding', 'privacy', 'visual')
  },
  notifications: {
    pref: aid('onboarding', 'notifications', 'pref'),
    /** tap that turns every reminder on (or clears them all) */
    all: aid('onboarding', 'notifications', 'all')
  },
  name: {
    first_input: aid('onboarding', 'name', 'first_input'),
    last_input: aid('onboarding', 'name', 'last_input'),
    first_next: aid('onboarding', 'name', 'first_next'),
    last_next: aid('onboarding', 'name', 'last_next'),
    birthday_next: aid('onboarding', 'name', 'birthday_next')
  },
  // Step 2 — confirm profile (name + photo on one screen).
  confirm_profile: {
    first_input: aid('onboarding', 'confirm_profile', 'first_input'),
    last_input: aid('onboarding', 'confirm_profile', 'last_input'),
    /** big empty/filled photo square that opens the system Take / Upload sheet */
    photo_square: aid('onboarding', 'confirm_profile', 'photo_square'),
    take: aid('onboarding', 'confirm_profile', 'take'),
    upload: aid('onboarding', 'confirm_profile', 'upload'),
    retake: aid('onboarding', 'confirm_profile', 'retake'),
    filter_pop_art: aid('onboarding', 'confirm_profile', 'filter_pop_art'),
    filter_x_ray: aid('onboarding', 'confirm_profile', 'filter_x_ray'),
    filter_comic: aid('onboarding', 'confirm_profile', 'filter_comic'),
    filter_sepia: aid('onboarding', 'confirm_profile', 'filter_sepia'),
    /** dead — reassurance row under the filter pills when preview is on-device */
    local_processing_badge: aid('onboarding', 'confirm_profile', 'local_processing_badge'),
    /** Skip photo in New onboarding ("Add one later"). */
    photo_skip: aid('onboarding', 'confirm_profile', 'photo_skip')
  },
  groups: {
    invite: aid('onboarding', 'groups', 'invite'),
    /** dead — the three tier cards are explanatory, not tappable */
    tier_card: aid('onboarding', 'groups', 'tier_card'),
    next_1: aid('onboarding', 'groups', 'next_1'),
    next_2: aid('onboarding', 'groups', 'next_2'),
    next_3: aid('onboarding', 'groups', 'next_3'),
    /** dead — nested groups visual */
    visual: aid('onboarding', 'groups', 'visual')
  },
  // Before Privacy & Control: teach Close / Friends / Acquaintances + caps.
  circles: {
    /** dead — animated padlock graphic (same as profile intro) */
    lock: aid('onboarding', 'circles', 'lock'),
    /** dead — the three meaning + size cards are explanatory, not tappable */
    tier_card: aid('onboarding', 'circles', 'tier_card')
  },
  // The four "the internet promised X" interstitials between steps.
  stat: {
    /** the little i icon / "Where this comes from" link that reveals sources */
    info: aid('onboarding', 'stat', 'info'),
    /** the "Let's try again" bridge button */
    bridge: aid('onboarding', 'stat', 'bridge'),
    /**
     * DEPRECATED: the interactive hours picker was replaced by the life-bar
     * visual. Keep the id so old events still resolve; do not emit new ones.
     */
    adjust: aid('onboarding', 'stat', 'adjust'),
    /** dead — the animated visual body is not tappable */
    visual: aid('onboarding', 'stat', 'visual'),
    /** dead — the display-font headline is not tappable */
    headline: aid('onboarding', 'stat', 'headline'),
    /** dead — the changing "you'll spend X years" line on the life story */
    caption: aid('onboarding', 'stat', 'caption'),
    /** screentime only: tap the story to skip to the next beat */
    advance: aid('onboarding', 'stat', 'advance'),
    /** screentime only: tap a filled color band to open/close its years row */
    band: aid('onboarding', 'stat', 'band')
  },
  // Step 5 — connect contacts to find friends already here.
  contacts: {
    sync: aid('onboarding', 'contacts', 'sync'),
    invite: aid('onboarding', 'contacts', 'invite'),
    /** one of the three invite slots #1 / #2 / #3 (`slot`: 1|2|3) */
    invite_slot: aid('onboarding', 'contacts', 'invite_slot'),
    contact_row: aid('onboarding', 'contacts', 'contact_row'),
    contacts_cancel: aid('onboarding', 'contacts', 'contacts_cancel'),
    /** Focus the contacts search box in the invite sheet (never logs query). */
    contact_search: aid('onboarding', 'contacts', 'contact_search'),
    /** Dead: the "AWESOME! We'll notify you…" success banner after sync / invite */
    awesome_banner: aid('onboarding', 'contacts', 'awesome_banner'),
    skip: aid('onboarding', 'contacts', 'skip')
  },
  // Step 7 — how you want friends-of-friends matched to you.
  friends_of_friends: {
    style: aid('onboarding', 'friends_of_friends', 'style'),
    /** tap that turns every matching style on (or clears them all) */
    all: aid('onboarding', 'friends_of_friends', 'all'),
    skip: aid('onboarding', 'friends_of_friends', 'skip')
  },
  basics: {
    answer: aid('onboarding', 'basics', 'answer'),
    image_option: aid('onboarding', 'basics', 'image_option'),
    continue: aid('onboarding', 'basics', 'continue')
  },
  photo: {
    take: aid('onboarding', 'photo', 'take'),
    upload: aid('onboarding', 'photo', 'upload'),
    retake: aid('onboarding', 'photo', 'retake'),
    skip: aid('onboarding', 'photo', 'skip')
  },
  meet: {
    nearby: aid('onboarding', 'meet', 'nearby'),
    anywhere: aid('onboarding', 'meet', 'anywhere'),
    city_input: aid('onboarding', 'meet', 'city_input'),
    skip: aid('onboarding', 'meet', 'skip')
  },
  // Step 10 — "Taste of Bridger" intro + its light sub-questions.
  taste: {
    start: aid('onboarding', 'taste', 'start'),
    /** dead — the excited "Let's fill out your profile a bit" headline */
    preview_list: aid('onboarding', 'taste', 'preview_list'),
    current_input: aid('onboarding', 'taste', 'current_input'),
    dream_input: aid('onboarding', 'taste', 'dream_input'),
    spotify: aid('onboarding', 'taste', 'spotify'),
    apple: aid('onboarding', 'taste', 'apple'),
    song_input: aid('onboarding', 'taste', 'song_input'),
    /** Search button inside the post-connect song picker sheet (never logs query). */
    song_search: aid('onboarding', 'taste', 'song_search'),
    /** Tap a search result in the song picker sheet (never title/artist). */
    song_result: aid('onboarding', 'taste', 'song_result'),
    /** Dismiss the song picker without picking. */
    song_search_cancel: aid('onboarding', 'taste', 'song_search_cancel'),
    nights_option: aid('onboarding', 'taste', 'nights_option'),
    color_swatch: aid('onboarding', 'taste', 'color_swatch'),
    /** Fine-tune slider under the spectrum (saturation; method=`slider`). */
    color_slider: aid('onboarding', 'taste', 'color_slider'),
    hometown_input: aid('onboarding', 'taste', 'hometown_input'),
    /** Private vs Close friends only under Hometown (method=private|close). */
    hometown_privacy: aid('onboarding', 'taste', 'hometown_privacy'),
    current_town_input: aid('onboarding', 'taste', 'current_town_input'),
    /** Private vs Close friends only under Current town. */
    current_town_privacy: aid('onboarding', 'taste', 'current_town_privacy'),
    favorite_place_input: aid('onboarding', 'taste', 'favorite_place_input'),
    /** Private vs Close friends only under favorite place. */
    favorite_place_privacy: aid('onboarding', 'taste', 'favorite_place_privacy'),
    /** Focus the favorite-place search box (never logs query text). */
    place_search: aid('onboarding', 'taste', 'place_search'),
    /** Dead-click: "Tap a place to pin it" hint above search matches. */
    place_pick_hint: aid('onboarding', 'taste', 'place_pick_hint'),
    /** Confirmed pick from favorite-place search results (never place names). */
    place_result: aid('onboarding', 'taste', 'place_result'),
    /** @deprecated Onboarding Recap step archived 2026-08-28. Kept for history. */
    recap_record: aid('onboarding', 'taste', 'recap_record'),
    /** @deprecated Onboarding Recap step archived 2026-08-28. Kept for history. */
    recap_play: aid('onboarding', 'taste', 'recap_play'),
    /** @deprecated Onboarding Recap step archived 2026-08-28. Kept for history. */
    recap_type: aid('onboarding', 'taste', 'recap_type'),
    skip: aid('onboarding', 'taste', 'skip')
  },
  review: {
    row_audience: aid('onboarding', 'review', 'row_audience'),
    set_all: aid('onboarding', 'review', 'set_all'),
    /** Open the edit sheet for one privacy row (`field` = row id). */
    row_edit: aid('onboarding', 'review', 'row_edit'),
    /** Save the edited text (never logs content). */
    row_edit_save: aid('onboarding', 'review', 'row_edit_save'),
    /** Dismiss the edit sheet without saving. */
    row_edit_cancel: aid('onboarding', 'review', 'row_edit_cancel'),
    terms: aid('onboarding', 'review', 'terms'),
    privacy_policy: aid('onboarding', 'review', 'privacy_policy')
  },
  /** Blue splash before the join page: plain-language "what a co-op is". */
  coop_intro: {
    /** green "See what you get" button that moves to the join page */
    continue: aid('onboarding', 'coop_intro', 'continue'),
    /** dead — the explainer paragraphs are not tappable */
    body: aid('onboarding', 'coop_intro', 'body')
  },
  coop: {
    join: aid('onboarding', 'coop', 'join'),
    /** Option A — invite 3 friends for free access */
    invite_free: aid('onboarding', 'coop', 'invite_free'),
    /** Option B — join directly (paid membership); opens the join method sheet */
    join_paid: aid('onboarding', 'coop', 'join_paid'),
    /** Store In-App Purchase method (Apple StoreKit); not the Apple Pay mark */
    apple_pay: aid('onboarding', 'coop', 'apple_pay'),
    /** Store In-App Purchase method (Google Play Billing); not the Google Pay mark */
    google_pay: aid('onboarding', 'coop', 'google_pay'),
    /** Card via Stripe Checkout (web / Android only) */
    card: aid('onboarding', 'coop', 'card'),
    /** In the join sheet: pick the monthly plan before paying */
    plan_monthly: aid('onboarding', 'coop', 'plan_monthly'),
    /** In the join sheet: pick the yearly plan (2 months free) before paying */
    plan_yearly: aid('onboarding', 'coop', 'plan_yearly'),
    /** After invite 3 friends only: continue with free access (no early free-tier skip) */
    use_free: aid('onboarding', 'coop', 'use_free'),
    /** expands the Free vs Co-op table from the top 5 to the full list */
    see_more: aid('onboarding', 'coop', 'see_more'),
    redeem_open: aid('onboarding', 'coop', 'redeem_open'),
    redeem_input: aid('onboarding', 'coop', 'redeem_input'),
    redeem_submit: aid('onboarding', 'coop', 'redeem_submit'),
    /** dead — the Free vs Co-op comparison table body is not tappable */
    plan_compare: aid('onboarding', 'coop', 'plan_compare'),
    /** dead — member perk bullet list (same as Co-op page) is not tappable */
    perks_grid: aid('onboarding', 'coop', 'perks_grid'),
    next_1: aid('onboarding', 'coop', 'next_1'),
    next_2: aid('onboarding', 'coop', 'next_2'),
    next_3: aid('onboarding', 'coop', 'next_3'),
    next_4: aid('onboarding', 'coop', 'next_4'),
    next_5: aid('onboarding', 'coop', 'next_5'),
    save_interests: aid('onboarding', 'coop', 'save_interests'),
    interest_option: aid('onboarding', 'coop', 'interest_option'),
    skip_to_product: aid('onboarding', 'coop', 'skip_to_product'),
    /** dead — ads vs members visual */
    visual: aid('onboarding', 'coop', 'visual'),
    /** New: expand extra member benefits */
    see_more_benefits: aid('onboarding', 'coop', 'see_more_benefits'),
    /** New: open Priority support detail */
    benefit_support: aid('onboarding', 'coop', 'benefit_support'),
    /** New: open Early access detail */
    benefit_early: aid('onboarding', 'coop', 'benefit_early')
  },
  /**
   * @deprecated The "You're in" screen was removed 2026-08-28. Finishing Co-op
   * now completes onboarding and lands on Home, which plays the welcome
   * fireworks (see WELCOME_CELEBRATION). Ids kept so old events still parse.
   */
  welcome_in: {
    lets_go: aid('onboarding', 'welcome_in', 'lets_go'),
    /** dead — the three "what happens next" cards are not tappable */
    next_cards: aid('onboarding', 'welcome_in', 'next_cards')
  },
  // New onboarding (2026-09): story-driven education after name / photo / birthday.
  why: {
    next_1: aid('onboarding', 'why', 'next_1'),
    next_2: aid('onboarding', 'why', 'next_2'),
    /** dead — fragmented-life / swiss-knife visual */
    visual: aid('onboarding', 'why', 'visual')
  },
  custom_groups: {
    to_coop: aid('onboarding', 'custom_groups', 'to_coop'),
    member_interest: aid('onboarding', 'custom_groups', 'member_interest'),
    /** dead — default groups + custom group teaser */
    visual: aid('onboarding', 'custom_groups', 'visual')
  },
  route: {
    custom_groups_join: aid('onboarding', 'route', 'custom_groups_join'),
    custom_groups_free: aid('onboarding', 'route', 'custom_groups_free'),
    vote_join: aid('onboarding', 'route', 'vote_join'),
    vote_later: aid('onboarding', 'route', 'vote_later'),
    no_ads_join: aid('onboarding', 'route', 'no_ads_join'),
    no_ads_invite: aid('onboarding', 'route', 'no_ads_invite'),
    /** dead — membership routing visual */
    visual: aid('onboarding', 'route', 'visual')
  },
  free: {
    choose_friends: aid('onboarding', 'free', 'choose_friends'),
    continue: aid('onboarding', 'free', 'continue'),
    skip: aid('onboarding', 'free', 'skip'),
    /** dead — three empty friend slots */
    visual: aid('onboarding', 'free', 'visual')
  },
  product: {
    next_1: aid('onboarding', 'product', 'next_1'),
    save_help: aid('onboarding', 'product', 'save_help'),
    option: aid('onboarding', 'product', 'option'),
    /** dead — group-chat-expands visual */
    visual: aid('onboarding', 'product', 'visual'),
    /** New: Keep going on a picked feature tour screen */
    feature_next: aid('onboarding', 'product', 'feature_next'),
    /** New: expand the extra feature chips */
    see_more: aid('onboarding', 'product', 'see_more')
  },
  plans: {
    next_1: aid('onboarding', 'plans', 'next_1'),
    next_2: aid('onboarding', 'plans', 'next_2'),
    branch_next: aid('onboarding', 'plans', 'branch_next'),
    /** dead — Touch Grass / availability visual */
    visual: aid('onboarding', 'plans', 'visual')
  },
  friendsb: {
    next_1: aid('onboarding', 'friendsb', 'next_1'),
    next_2: aid('onboarding', 'friendsb', 'next_2'),
    branch_next: aid('onboarding', 'friendsb', 'branch_next'),
    /** dead — friend notes visual */
    visual: aid('onboarding', 'friendsb', 'visual')
  },
  memories: {
    next_1: aid('onboarding', 'memories', 'next_1'),
    next_2: aid('onboarding', 'memories', 'next_2'),
    next_3: aid('onboarding', 'memories', 'next_3'),
    branch_next: aid('onboarding', 'memories', 'branch_next'),
    option: aid('onboarding', 'memories', 'option'),
    /** dead — scrapbook page visual */
    visual: aid('onboarding', 'memories', 'visual')
  },
  discover: {
    next_1: aid('onboarding', 'discover', 'next_1'),
    next_2: aid('onboarding', 'discover', 'next_2'),
    branch_suggest: aid('onboarding', 'discover', 'branch_suggest'),
    branch_browse: aid('onboarding', 'discover', 'branch_browse'),
    /** dead — friends-of-friends visual */
    visual: aid('onboarding', 'discover', 'visual')
  }
} as const;

// --- Welcome fireworks (own surface, parent Home; plays once right after
//     onboarding finishes: fireworks + "You did it! Welcome to Bridger!!!") ---
export const WELCOME_CELEBRATION = {
  overlay: {
    /** dead — the fireworks + celebration words are not tappable themselves */
    body: aid('welcome_celebration', 'overlay', 'body'),
    /** tap anywhere / the hint to leave the party and land on Home */
    continue: aid('welcome_celebration', 'overlay', 'continue')
  }
} as const;

// --- Demo week invite access gate ---
export const INVITE_ACCESS = {
  body: aid('invite_access', 'main', 'body'),
  invite_button: aid('invite_access', 'main', 'invite_button'),
  contact_row: aid('invite_access', 'contacts_sheet', 'contact_row'),
  contacts_cancel: aid('invite_access', 'contacts_sheet', 'cancel'),
  /** Focus search in the invite contacts sheet (never logs query text). */
  contact_search: aid('invite_access', 'contacts_sheet', 'contact_search')
} as const;

// --- Floating tab bar (global chrome) ---
export const CHROME = {
  tab_bar: {
    tab_home: aid('chrome', 'tab_bar', 'tab_home'),
    tab_friends: aid('chrome', 'tab_bar', 'tab_friends'),
    // Retired from the pill: Messages moved to the header (see *.top_nav.messages_icon).
    // Kept so older events still parse.
    tab_messages: aid('chrome', 'tab_bar', 'tab_messages'),
    tab_events: aid('chrome', 'tab_bar', 'tab_events'),
    tab_discover: aid('chrome', 'tab_bar', 'tab_discover'),
    tab_news: aid('chrome', 'tab_bar', 'tab_news'),
    // Single-person icon on the far-right of the pill — opens your Profile page.
    // Replaces the old header avatar (`*.top_nav.profile_icon`, retired).
    // Visual: line icon (not photo) so selected state matches the other tab pills.
    profile_icon: aid('chrome', 'tab_bar', 'profile_icon')
  }
} as const;

// --- Home ---
export const HOME = {
  top_nav: {
    search: aid('home', 'top_nav', 'search'),
    messages_icon: aid('home', 'top_nav', 'messages_icon'),
    header_logo: aid('home', 'top_nav', 'header_logo'),
    page_title: aid('home', 'top_nav', 'page_title'),
    profile_icon: aid('home', 'top_nav', 'profile_icon'),
    edit_layout: aid('home', 'top_nav', 'edit_layout')
  },
  /** Localhost / preview only: jump to CRT intro or onboarding from Home. */
  dev_preview: {
    crt_intro: aid('home', 'dev_preview', 'crt_intro'),
    onboarding: aid('home', 'dev_preview', 'onboarding')
  },
  announcements: {
    carousel: aid('home', 'announcements', 'carousel'),
    card: aid('home', 'announcements', 'card'),
    touch_grass_im_in: aid('home', 'announcements', 'touch_grass_im_in'),
    touch_grass_details: aid('home', 'announcements', 'touch_grass_details'),
    touch_grass_dismiss: aid('home', 'announcements', 'touch_grass_dismiss'),
    quick_check_yes: aid('home', 'announcements', 'quick_check_yes'),
    quick_check_edit: aid('home', 'announcements', 'quick_check_edit'),
    quick_check_dismiss: aid('home', 'announcements', 'quick_check_dismiss'),
    /** Dead: the question body / "Quick check" label (not a button). */
    quick_check_body: aid('home', 'announcements', 'quick_check_body'),
    /** Dead: the "Kept it." / "Removed…" confirmation banner. */
    quick_check_result: aid('home', 'announcements', 'quick_check_result'),
    /**
     * One-time intro card (no live announcements yet): tap card or Got it
     * dismisses forever. intro_body is dead_click on the copy block.
     */
    intro_card: aid('home', 'announcements', 'intro_card'),
    intro_dismiss: aid('home', 'announcements', 'intro_dismiss'),
    intro_body: aid('home', 'announcements', 'intro_body'),
    coop_card: aid('home', 'announcements', 'coop_card'),
    coming_up_card: aid('home', 'announcements', 'coming_up_card'),
    section_header: aid('home', 'announcements', 'section_header'),
    info: aid('home', 'announcements', 'info')
  },
  // Opt-in Billy widget under Stories (AGENT.md). Hidden until Settings on.
  assistant: {
    open_card: aid('home', 'assistant', 'open_card'),
    section_header: aid('home', 'assistant', 'section_header'),
    info: aid('home', 'assistant', 'info'),
    transcript: aid('home', 'assistant', 'transcript'),
    empty_state: aid('home', 'assistant', 'empty_state'),
    composer: aid('home', 'assistant', 'composer'),
    send: aid('home', 'assistant', 'send'),
    confirm: aid('home', 'assistant', 'confirm'),
    cancel: aid('home', 'assistant', 'cancel'),
    open: aid('home', 'assistant', 'open'),
    mic: aid('home', 'assistant', 'mic'),
    stop_listen: aid('home', 'assistant', 'stop_listen'),
    suggestion: aid('home', 'assistant', 'suggestion'),
    dismiss: aid('home', 'assistant', 'dismiss'),
    draft_approve: aid('home', 'assistant', 'draft_approve'),
    draft_edit: aid('home', 'assistant', 'draft_edit'),
    mark: aid('home', 'assistant', 'mark'),
    body: aid('home', 'assistant', 'body'),
    /** Fixed event-template preview card (dead_click on body). */
    event_preview: aid('home', 'assistant', 'event_preview'),
    event_approve: aid('home', 'assistant', 'event_approve')
  },
  stories_row: {
    your_story: aid('home', 'stories_row', 'your_story'),
    story_tile: aid('home', 'stories_row', 'story_tile'),
    tier_filter: aid('home', 'stories_row', 'tier_filter'),
    add_after_post: aid('home', 'stories_row', 'add_after_post'),
    stories_header: aid('home', 'stories_row', 'stories_header'),
    info: aid('home', 'stories_row', 'info'),
    /** Empty Stories CTA: "Post a story!" */
    post_prompt: aid('home', 'stories_row', 'post_prompt')
  },
  responses: {
    response: aid('home', 'responses', 'response'),
    reply: aid('home', 'responses', 'reply'),
    responses_header: aid('home', 'responses', 'responses_header')
  },
  touch_grass_button: {
    send: aid('home', 'touch_grass_button', 'send')
  },
  notifications_preview: {
    row: aid('home', 'notifications_preview', 'row'),
    see_all: aid('home', 'notifications_preview', 'see_all'),
    section_header: aid('home', 'notifications_preview', 'section_header'),
    info: aid('home', 'notifications_preview', 'info'),
    /** Dead-click target for the "All caught up!" null state. */
    empty_body: aid('home', 'notifications_preview', 'empty_body'),
    /** Seeded Notification Example when the preview is empty (self-hides after tap). */
    example_row: aid('home', 'notifications_preview', 'example_row'),
    /** Dead-click: the "Example" pill on the notification placeholder. */
    example_badge: aid('home', 'notifications_preview', 'example_badge')
  },
  inside_jokes_strip: {
    note: aid('home', 'inside_jokes_strip', 'note'),
    add: aid('home', 'inside_jokes_strip', 'add'),
    sticky_note_body: aid('home', 'inside_jokes_strip', 'sticky_note_body')
  },
  ask_the_group: {
    create_poll: aid('home', 'ask_the_group', 'create_poll'),
    ask_question: aid('home', 'ask_the_group', 'ask_question'),
    see_previous_polls: aid('home', 'ask_the_group', 'see_previous_polls'),
    section_header: aid('home', 'ask_the_group', 'section_header'),
    info: aid('home', 'ask_the_group', 'info')
  },
  this_week: {
    play_recap: aid('home', 'this_week', 'play_recap'),
    add_recap: aid('home', 'this_week', 'add_recap'),
    take_quiz: aid('home', 'this_week', 'take_quiz'),
    next_event: aid('home', 'this_week', 'next_event'),
    /** Empty This week tap → Events tab. */
    open_events: aid('home', 'this_week', 'open_events'),
    /** Seeded Event Example when there is no next event (self-hides after tap). */
    example_card: aid('home', 'this_week', 'example_card'),
    /** Dead-click: the "Example" pill on the event placeholder. */
    example_badge: aid('home', 'this_week', 'example_badge'),
    section_header: aid('home', 'this_week', 'section_header'),
    info: aid('home', 'this_week', 'info')
  },
  coming_up: {
    section_header: aid('home', 'coming_up', 'section_header'),
    info: aid('home', 'coming_up', 'info'),
    /** Dead-click target for the empty Coming up teach card body. */
    empty_body: aid('home', 'coming_up', 'empty_body'),
    /** X on the empty Coming up teach card (hides section until real items). */
    empty_dismiss: aid('home', 'coming_up', 'empty_dismiss')
  },
  activity: {
    section_header: aid('home', 'activity', 'section_header'),
    info: aid('home', 'activity', 'info'),
    open: aid('home', 'activity', 'open'),
    heart: aid('home', 'activity', 'heart'),
    post: aid('home', 'activity', 'post')
  },
  quiz: {
    section_header: aid('home', 'quiz', 'section_header'),
    info: aid('home', 'quiz', 'info'),
    take: aid('home', 'quiz', 'take'),
    open_result: aid('home', 'quiz', 'open_result'),
    share: aid('home', 'quiz', 'share'),
    /** Standing "Which J name are you?" prompt when no live quiz payload yet. */
    take_prompt: aid('home', 'quiz', 'take_prompt')
  },
  coop: {
    section_header: aid('home', 'coop', 'section_header'),
    info: aid('home', 'coop', 'info'),
    open_portal: aid('home', 'coop', 'open_portal'),
    join: aid('home', 'coop', 'join'),
    use_free: aid('home', 'coop', 'use_free')
  },
  cold_start: {
    body: aid('home', 'cold_start', 'body'),
    cta: aid('home', 'cold_start', 'cta')
  }
} as const;

// --- Section info tooltip (own surface — short "what is this?" bubble) ---
export const SECTION_INFO_TOOLTIP = {
  chrome: {
    dismiss: aid('section_info_tooltip', 'chrome', 'dismiss')
  },
  body: {
    body: aid('section_info_tooltip', 'body', 'body')
  }
} as const;

// --- Touch Grass sheet (own surface) ---
export const TOUCH_GRASS_SHEET = {
  who: {
    close: aid('touch_grass_sheet', 'who', 'close'),
    friends: aid('touch_grass_sheet', 'who', 'friends'),
    /** Retired: Touch Grass no longer offers Everyone. Id kept so old events still group. */
    everyone: aid('touch_grass_sheet', 'who', 'everyone')
  },
  when: {
    now: aid('touch_grass_sheet', 'when', 'now'),
    tonight: aid('touch_grass_sheet', 'when', 'tonight'),
    weekend: aid('touch_grass_sheet', 'when', 'weekend')
  },
  why: {
    input: aid('touch_grass_sheet', 'why', 'input')
  },
  actions: {
    send: aid('touch_grass_sheet', 'actions', 'send'),
    dismiss: aid('touch_grass_sheet', 'actions', 'dismiss')
  }
} as const;

// --- Grass signal DETAIL sheet (own surface — opened from a friend's card) ---
export const GRASS_SIGNAL_SHEET = {
  actions: {
    im_in: aid('grass_signal_sheet', 'actions', 'im_in'),
    quietly_decline: aid('grass_signal_sheet', 'actions', 'quietly_decline'),
    dismiss: aid('grass_signal_sheet', 'actions', 'dismiss')
  }
} as const;

// --- Discover ---
export const DISCOVER = {
  top_nav: {
    settings_icon: aid('discover', 'top_nav', 'settings_icon'),
    messages_icon: aid('discover', 'top_nav', 'messages_icon'),
    page_title: aid('discover', 'top_nav', 'page_title'),
    profile_icon: aid('discover', 'top_nav', 'profile_icon')
  },
  wants_to_connect: {
    card: aid('discover', 'wants_to_connect', 'card'),
    approve: aid('discover', 'wants_to_connect', 'approve'),
    decline: aid('discover', 'wants_to_connect', 'decline'),
    info: aid('discover', 'wants_to_connect', 'info')
  },
  people_to_meet: {
    suggestion_card: aid('discover', 'people_to_meet', 'suggestion_card'),
    add: aid('discover', 'people_to_meet', 'add'),
    dismiss: aid('discover', 'people_to_meet', 'dismiss'),
    spotlight_card: aid('discover', 'people_to_meet', 'spotlight_card'),
    shared_thread_headline: aid('discover', 'people_to_meet', 'shared_thread_headline'),
    section_header: aid('discover', 'people_to_meet', 'section_header'),
    info: aid('discover', 'people_to_meet', 'info')
  },
  // Dormant "friend radar" slot under People to meet (nearby map, not built yet).
  local_map: {
    section_header: aid('discover', 'local_map', 'section_header'),
    teaser_card: aid('discover', 'local_map', 'teaser_card'),
    info: aid('discover', 'local_map', 'info')
  },
  discover_me: {
    answer: aid('discover', 'discover_me', 'answer'),
    image_option: aid('discover', 'discover_me', 'image_option'),
    continue: aid('discover', 'discover_me', 'continue')
  },
  // Personality quizzes preview at the top of Discover (id stays connect_over).
  connect_over: {
    // dead: the section title
    section_header: aid('discover', 'connect_over', 'section_header'),
    module_tile: aid('discover', 'connect_over', 'module_tile'),
    see_more: aid('discover', 'connect_over', 'see_more'),
    info: aid('discover', 'connect_over', 'info')
  },
  // Shared overlaps on a connection detail (request / suggestion) before you add them.
  in_common: {
    section_header: aid('discover', 'in_common', 'section_header'),
    info: aid('discover', 'in_common', 'info')
  },
  maps: {
    node: aid('discover', 'maps', 'node'),
    map_toggle: aid('discover', 'maps', 'map_toggle')
  },
  gate: {
    body: aid('discover', 'gate', 'body'),
    get_started: aid('discover', 'gate', 'get_started'),
    /** The charging bar shown before Get started unlocks (dead-click region). */
    cta_loading: aid('discover', 'gate', 'cta_loading')
  },
  settings_sheet: {
    discoverable_toggle: aid('discover', 'settings_sheet', 'discoverable_toggle'),
    source_toggle: aid('discover', 'settings_sheet', 'source_toggle'),
    /** One About-me category row (Foods, Hobbies, …) */
    about_me_toggle: aid('discover', 'settings_sheet', 'about_me_toggle'),
    dismiss: aid('discover', 'settings_sheet', 'dismiss')
  }
} as const;

// --- Personality quizzes (own screen; analytics name stays connect_over) ---
export const CONNECT_OVER = {
  list: {
    // dead: the screen title
    page_title: aid('connect_over', 'list', 'page_title'),
    back: aid('connect_over', 'list', 'back'),
    module_tile: aid('connect_over', 'list', 'module_tile')
  }
} as const;

// --- Your Funny Bone (humor Discover quiz — own surface) ---
// PRIVACY: never log explain text, option labels, or media titles — only option ids / counts.
export const YOUR_FUNNY_BONE = {
  chrome: {
    back: aid('your_funny_bone', 'chrome', 'back'),
    progress: aid('your_funny_bone', 'chrome', 'progress')
  },
  intro: {
    body: aid('your_funny_bone', 'intro', 'body'),
    start: aid('your_funny_bone', 'intro', 'start')
  },
  take: {
    option: aid('your_funny_bone', 'take', 'option'),
    explain: aid('your_funny_bone', 'take', 'explain'),
    next: aid('your_funny_bone', 'take', 'next'),
    options_more: aid('your_funny_bone', 'take', 'options_more'),
    note_toggle: aid('your_funny_bone', 'take', 'note_toggle')
  },
  result: {
    body: aid('your_funny_bone', 'result', 'body'),
    done: aid('your_funny_bone', 'result', 'done')
  }
} as const;

// --- What Gets You Going (values Discover quiz — own surface) ---
// PRIVACY: never log explain text or option labels — only option ids / counts.
export const WHAT_GETS_YOU_GOING = {
  chrome: {
    back: aid('what_gets_you_going', 'chrome', 'back'),
    progress: aid('what_gets_you_going', 'chrome', 'progress')
  },
  intro: {
    body: aid('what_gets_you_going', 'intro', 'body'),
    start: aid('what_gets_you_going', 'intro', 'start')
  },
  take: {
    option: aid('what_gets_you_going', 'take', 'option'),
    explain: aid('what_gets_you_going', 'take', 'explain'),
    next: aid('what_gets_you_going', 'take', 'next'),
    skip: aid('what_gets_you_going', 'take', 'skip'),
    options_more: aid('what_gets_you_going', 'take', 'options_more'),
    note_toggle: aid('what_gets_you_going', 'take', 'note_toggle')
  },
  result: {
    body: aid('what_gets_you_going', 'result', 'body'),
    done: aid('what_gets_you_going', 'result', 'done')
  }
} as const;

// --- The Friend Zone (attachment Discover quiz — own surface) ---
// PRIVACY: never log explain text or option labels — only option ids / counts.
export const THE_FRIEND_ZONE = {
  chrome: {
    back: aid('the_friend_zone', 'chrome', 'back'),
    progress: aid('the_friend_zone', 'chrome', 'progress')
  },
  intro: {
    body: aid('the_friend_zone', 'intro', 'body'),
    start: aid('the_friend_zone', 'intro', 'start')
  },
  take: {
    option: aid('the_friend_zone', 'take', 'option'),
    explain: aid('the_friend_zone', 'take', 'explain'),
    next: aid('the_friend_zone', 'take', 'next'),
    options_more: aid('the_friend_zone', 'take', 'options_more'),
    note_toggle: aid('the_friend_zone', 'take', 'note_toggle')
  },
  result: {
    body: aid('the_friend_zone', 'result', 'body'),
    done: aid('the_friend_zone', 'result', 'done')
  }
} as const;

// --- Your Vibe (personality Discover quiz — own surface) ---
// PRIVACY: never log explain text or option labels — only option ids / counts.
export const YOUR_VIBE = {
  chrome: {
    back: aid('your_vibe', 'chrome', 'back'),
    progress: aid('your_vibe', 'chrome', 'progress')
  },
  intro: {
    body: aid('your_vibe', 'intro', 'body'),
    start: aid('your_vibe', 'intro', 'start')
  },
  take: {
    option: aid('your_vibe', 'take', 'option'),
    explain: aid('your_vibe', 'take', 'explain'),
    next: aid('your_vibe', 'take', 'next'),
    options_more: aid('your_vibe', 'take', 'options_more'),
    note_toggle: aid('your_vibe', 'take', 'note_toggle')
  },
  result: {
    body: aid('your_vibe', 'result', 'body'),
    done: aid('your_vibe', 'result', 'done')
  }
} as const;

// --- Behind the Scenes (disclosure pre-quiz — own surface) ---
// PRIVACY: never log free-text notes, custom labels, or condition names beyond
// opaque condition_key enums already in the product model.
export const BEHIND_THE_SCENES = {
  chrome: {
    back: aid('behind_the_scenes', 'chrome', 'back'),
    skip: aid('behind_the_scenes', 'chrome', 'skip'),
    progress: aid('behind_the_scenes', 'chrome', 'progress')
  },
  intro: {
    card_body: aid('behind_the_scenes', 'intro', 'card_body'),
    next: aid('behind_the_scenes', 'intro', 'next'),
    share: aid('behind_the_scenes', 'intro', 'share'),
    skip: aid('behind_the_scenes', 'intro', 'skip')
  },
  conditions: {
    option: aid('behind_the_scenes', 'conditions', 'option'),
    continue: aid('behind_the_scenes', 'conditions', 'continue')
  },
  other_label: {
    input: aid('behind_the_scenes', 'other_label', 'input'),
    continue: aid('behind_the_scenes', 'other_label', 'continue')
  },
  impact: {
    option: aid('behind_the_scenes', 'impact', 'option'),
    note_input: aid('behind_the_scenes', 'impact', 'note_input'),
    continue: aid('behind_the_scenes', 'impact', 'continue')
  },
  match_weight: {
    option: aid('behind_the_scenes', 'match_weight', 'option'),
    continue: aid('behind_the_scenes', 'match_weight', 'continue')
  },
  close: {
    body: aid('behind_the_scenes', 'close', 'body'),
    start_fun: aid('behind_the_scenes', 'close', 'start_fun'),
    support_link: aid('behind_the_scenes', 'close', 'support_link')
  }
} as const;

// --- Friends ---
export const FRIENDS = {
  top_nav: {
    settings_icon: aid('friends', 'top_nav', 'settings_icon'),
    search: aid('friends', 'top_nav', 'search'),
    // Header messages shortcut (moved off the bottom pill).
    messages_icon: aid('friends', 'top_nav', 'messages_icon'),
    page_title: aid('friends', 'top_nav', 'page_title'),
    profile_icon: aid('friends', 'top_nav', 'profile_icon'),
    add: aid('friends', 'top_nav', 'add'),
    /** Retired in UI. Edit now lives beside Your circle (`roster.edit`). */
    edit: aid('friends', 'top_nav', 'edit')
  },
  roster: {
    row: aid('friends', 'roster', 'row'),
    drag_handle: aid('friends', 'roster', 'drag_handle'),
    tier_header: aid('friends', 'roster', 'tier_header'),
    birthday_row: aid('friends', 'roster', 'birthday_row'),
    info: aid('friends', 'roster', 'info'),
    // Same Add friend control as top_nav.add, placed beside Your circle.
    add: aid('friends', 'roster', 'add'),
    /** Edit / Done for moving people between circles. Beside Your circle. */
    edit: aid('friends', 'roster', 'edit'),
    pending_row: aid('friends', 'roster', 'pending_row'),
    pending_header: aid('friends', 'roster', 'pending_header'),
    /** Filters the roster under Your circle. Query text is never logged. */
    search: aid('friends', 'roster', 'search')
  },
  add_sheet: {
    invite_link: aid('friends', 'add_sheet', 'invite_link'),
    qr: aid('friends', 'add_sheet', 'qr'),
    scan: aid('friends', 'add_sheet', 'scan'),
    scan_enable: aid('friends', 'add_sheet', 'scan_enable'),
    connect_contacts: aid('friends', 'add_sheet', 'connect_contacts'),
    contact_row: aid('friends', 'add_sheet', 'contact_row'),
    contacts_cancel: aid('friends', 'add_sheet', 'contacts_cancel')
  },
  cold_start: {
    body: aid('friends', 'cold_start', 'body'),
    connect_contacts: aid('friends', 'cold_start', 'connect_contacts'),
    cta: aid('friends', 'cold_start', 'cta')
  },
  inside_jokes: {
    note: aid('friends', 'inside_jokes', 'note'),
    add: aid('friends', 'inside_jokes', 'add'),
    note_body: aid('friends', 'inside_jokes', 'note_body'),
    section_header: aid('friends', 'inside_jokes', 'section_header'),
    info: aid('friends', 'inside_jokes', 'info')
  },
  pod: {
    play: aid('friends', 'pod', 'play'),
    /** Chevron / card body: open the player without starting audio. */
    open: aid('friends', 'pod', 'open'),
    record: aid('friends', 'pod', 'record'),
    submit_question: aid('friends', 'pod', 'submit_question'),
    vote_question: aid('friends', 'pod', 'vote_question'),
    section_header: aid('friends', 'pod', 'section_header'),
    info: aid('friends', 'pod', 'info')
  }
} as const;

// --- Card you made for someone not on Bridger yet ---
export const PENDING_PROFILE = {
  top_nav: {
    page_title: aid('pending_profile', 'top_nav', 'page_title'),
    back: aid('pending_profile', 'top_nav', 'back')
  },
  header: {
    name: aid('pending_profile', 'header', 'name'),
    status: aid('pending_profile', 'header', 'status')
  },
  notes: {
    section_header: aid('pending_profile', 'notes', 'section_header')
  },
  actions: {
    invite: aid('pending_profile', 'actions', 'invite')
  }
} as const;

// --- Weekly recap recorder (own surface: record 5 answers by voice) ---
export const RECAP_RECORDER = {
  question: {
    body: aid('recap_recorder', 'question', 'body'),
    /** Full list shown before recording starts (dead — they read, then Start). */
    list: aid('recap_recorder', 'question', 'list'),
    /** Jump to a question by tapping its segment in the swipeable deck. */
    segment: aid('recap_recorder', 'question', 'segment')
  },
  record: {
    start: aid('recap_recorder', 'record', 'start'),
    stop: aid('recap_recorder', 'record', 'stop'),
    /** Play back the take you just recorded (before Next / Re-record). */
    play: aid('recap_recorder', 'record', 'play'),
    pause: aid('recap_recorder', 'record', 'pause'),
    rerecord: aid('recap_recorder', 'record', 'rerecord'),
    next: aid('recap_recorder', 'record', 'next')
  },
  audience: {
    close: aid('recap_recorder', 'audience', 'close'),
    friends: aid('recap_recorder', 'audience', 'friends'),
    everyone: aid('recap_recorder', 'audience', 'everyone')
  },
  actions: {
    /** Leaves the preview list and begins Q1. */
    start: aid('recap_recorder', 'actions', 'start'),
    /** Record phase → review: confirm who hears it. */
    review: aid('recap_recorder', 'actions', 'review'),
    /** Review → back to the questions. */
    back: aid('recap_recorder', 'actions', 'back'),
    post: aid('recap_recorder', 'actions', 'post'),
    /** Close the "You're in this week" confirmation once you have seen it. */
    done: aid('recap_recorder', 'actions', 'done'),
    dismiss: aid('recap_recorder', 'actions', 'dismiss')
  }
} as const;

// --- Weekly recap player (own surface / full page: play the stitched podcast) ---
export const RECAP_PLAYER = {
  transport: {
    play: aid('recap_player', 'transport', 'play'),
    pause: aid('recap_player', 'transport', 'pause'),
    back: aid('recap_player', 'transport', 'back'),
    skip: aid('recap_player', 'transport', 'skip'),
    scrub: aid('recap_player', 'transport', 'scrub'),
    /** playback rate chip — 1 / 1.3 / 1.5 / 2 (method = rate) */
    speed: aid('recap_player', 'transport', 'speed')
  },
  filter: {
    /** Close / Friends / Acquaintances chip (method = tier) */
    chip: aid('recap_player', 'filter', 'chip')
  },
  weeks: {
    /** dead — "This week / earlier" strip */
    body: aid('recap_player', 'weeks', 'body'),
    /** pick a locked week (method = current | past). Never the week label. */
    row: aid('recap_player', 'weeks', 'row'),
    /** Free Lite: opens co-op join for earlier weeks */
    join: aid('recap_player', 'weeks', 'join')
  },
  speaker: {
    body: aid('recap_player', 'speaker', 'body')
  },
  expiry: {
    /** "Expires in N days" label (dead — informational) */
    label: aid('recap_player', 'expiry', 'label')
  },
  in_this_week: {
    body: aid('recap_player', 'in_this_week', 'body'),
    /** tap a friend's face to jump to / relisten to their clips */
    voice: aid('recap_player', 'in_this_week', 'voice')
  },
  questions: {
    /** dead — this week's five questions, shown on the page */
    body: aid('recap_player', 'questions', 'body'),
    /** dead — one numbered question row */
    row: aid('recap_player', 'questions', 'row')
  },
  suggest: {
    input: aid('recap_player', 'suggest', 'input'),
    send: aid('recap_player', 'suggest', 'send'),
    vote: aid('recap_player', 'suggest', 'vote')
  },
  react: {
    open: aid('recap_player', 'react', 'open'),
    emoji: aid('recap_player', 'react', 'emoji')
  },
  actions: {
    /** Open the recorder from the recap page ("Add your recap"). */
    record: aid('recap_player', 'actions', 'record'),
    /** Record one more answer after you are already in this week. */
    record_another: aid('recap_player', 'actions', 'record_another'),
    dismiss: aid('recap_player', 'actions', 'dismiss')
  }
} as const;

// --- Profile (own) ---
export const PROFILE = {
  tabs: {
    profile: aid('profile', 'tabs', 'profile'),
    stories: aid('profile', 'tabs', 'stories'),
    inside_jokes: aid('profile', 'tabs', 'inside_jokes'),
    bucket_list: aid('profile', 'tabs', 'bucket_list')
  },
  header: {
    avatar: aid('profile', 'header', 'avatar'),
    name: aid('profile', 'header', 'name'),
    /** Quiet city line under the name (dead_click). */
    city: aid('profile', 'header', 'city'),
    /** Friend profiles: "N mutuals" beside the name → In common tab */
    mutuals: aid('profile', 'header', 'mutuals'),
    /** @deprecated Superseded by Current Obsession / play_recap. Kept for history. */
    song: aid('profile', 'header', 'song'),
    /** Own profile: gear next to Edit (opens Settings). Was profile.tabs.settings_gear. */
    settings_gear: aid('profile', 'header', 'settings_gear'),
    play_recap: aid('profile', 'header', 'play_recap'),
    story_tile: aid('profile', 'header', 'story_tile'),
    /** Own profile, empty story tile → opens post composer (same idea as Home post_prompt). */
    post_prompt: aid('profile', 'header', 'post_prompt'),
    tier_control: aid('profile', 'header', 'tier_control'),
    edit: aid('profile', 'header', 'edit'),
    view_as: aid('profile', 'header', 'view_as'),
    /** Search this profile from the action row (never logs query text). */
    search: aid('profile', 'header', 'search'),
    /** @deprecated Moved to header.search in the action row. Kept for history. */
    overflow: aid('profile', 'header', 'overflow'),
    header_bg: aid('profile', 'header', 'header_bg'),
    /** Opens co-op Customize (theme) from rearrange mode. */
    customize_look: aid('profile', 'header', 'customize_look'),
    /** Photo look pills on the Edit → Photo look sheet. */
    filter_pop_art: aid('profile', 'header', 'filter_pop_art'),
    filter_comic: aid('profile', 'header', 'filter_comic'),
    filter_sepia: aid('profile', 'header', 'filter_sepia'),
    filter_x_ray: aid('profile', 'header', 'filter_x_ray'),
    /** Save the chosen look on the Photo look sheet. */
    photo_look_save: aid('profile', 'header', 'photo_look_save'),
    /** Dismiss Photo look without saving. */
    photo_look_dismiss: aid('profile', 'header', 'photo_look_dismiss')
  },
  card: {
    /** @deprecated Absorbed into obsession squares. Kept for history. */
    currently: aid('profile', 'card', 'currently'),
    mutuals: aid('profile', 'card', 'mutuals'),
    top5: aid('profile', 'card', 'top5'),
    top5_row: aid('profile', 'card', 'top5_row'),
    about_me: aid('profile', 'card', 'about_me'),
    about_me_toggle: aid('profile', 'card', 'about_me_toggle'),
    /** Own profile: turn on About me edit (reorder + per-field Edit). */
    about_me_edit: aid('profile', 'card', 'about_me_edit'),
    /** Expand the truncated bio ("Rest of bio"). */
    about_me_bio_more: aid('profile', 'card', 'about_me_bio_more'),
    /** Edit one about-me field or the bio while About me edit is on. */
    about_me_field_edit: aid('profile', 'card', 'about_me_field_edit'),
    /** Reorder an about-me field (method=up|down). */
    about_me_reorder: aid('profile', 'card', 'about_me_reorder'),
    /** Own Edit mode: tap About me photo to Take / Upload (updates avatar). */
    about_me_photo: aid('profile', 'card', 'about_me_photo'),
    upcoming: aid('profile', 'card', 'upcoming'),
    upcoming_row: aid('profile', 'card', 'upcoming_row'),
    obsession: aid('profile', 'card', 'obsession'),
    obsession_square: aid('profile', 'card', 'obsession_square'),
    favorites: aid('profile', 'card', 'favorites'),
    favorites_tile: aid('profile', 'card', 'favorites_tile'),
    favorites_to_start: aid('profile', 'card', 'favorites_to_start'),
    see_all: aid('profile', 'card', 'see_all'),
    greatest_hits: aid('profile', 'card', 'greatest_hits'),
    /** One Greatest hits photo body (dead_click when not interactive). */
    greatest_hits_photo: aid('profile', 'card', 'greatest_hits_photo'),
    where_met: aid('profile', 'card', 'where_met'),
    hobbies_widget: aid('profile', 'card', 'hobbies_widget'),
    this_or_that_row: aid('profile', 'card', 'this_or_that_row'),
    places_map: aid('profile', 'card', 'places_map'),
    places_pin: aid('profile', 'card', 'places_pin'),
    favs: aid('profile', 'card', 'favs'),
    /** empty-state CTAs that open a fill module */
    add_details: aid('profile', 'card', 'add_details'),
    add_hobbies: aid('profile', 'card', 'add_hobbies'),
    add_favs: aid('profile', 'card', 'add_favs'),
    add_places: aid('profile', 'card', 'add_places'),
    take_this_or_that: aid('profile', 'card', 'take_this_or_that'),
    add_module: aid('profile', 'card', 'add_module'),
    /** Pencil on a widget card: edit that section's contents. */
    widget_edit: aid('profile', 'card', 'widget_edit'),
    /** Move a widget up/down while rearranging (method=up|down). */
    widget_reorder: aid('profile', 'card', 'widget_reorder')
  },
  /** Shared ModuleFlow share-mode audience + matchable controls on Profile */
  module: {
    audience_set_all: aid('profile', 'module', 'audience_set_all'),
    audience_row: aid('profile', 'module', 'audience_row'),
    matchable_toggle: aid('profile', 'module', 'matchable_toggle'),
    matchable_row: aid('profile', 'module', 'matchable_row'),
    continue: aid('profile', 'module', 'continue'),
    cancel: aid('profile', 'module', 'cancel'),
    hobby_select: aid('profile', 'module', 'hobby_select'),
    /** Focus the hobbies search box. Never logs the query text. */
    hobby_search: aid('profile', 'module', 'hobby_search'),
    /** Dead: category title above a hobby group. */
    hobby_category: aid('profile', 'module', 'hobby_category'),
    hobby_add_own: aid('profile', 'module', 'hobby_add_own'),
    hobby_custom_name: aid('profile', 'module', 'hobby_custom_name'),
    hobby_custom_emoji: aid('profile', 'module', 'hobby_custom_emoji'),
    hobby_custom_save: aid('profile', 'module', 'hobby_custom_save'),
    hobby_custom_remove: aid('profile', 'module', 'hobby_custom_remove'),
    place_search: aid('profile', 'module', 'place_search'),
    place_result: aid('profile', 'module', 'place_result')
  },
  /** One-time mandatory intro before first fill (PROFILE.md §0). */
  intro: {
    body: aid('profile_intro', 'content', 'body'),
    continue: aid('profile_intro', 'actions', 'continue')
  },
  stories_calendar: {
    day: aid('profile', 'stories_calendar', 'day'),
    month_nav: aid('profile', 'stories_calendar', 'month_nav'),
    storage_bar: aid('profile', 'stories_calendar', 'storage_bar')
  },
  inside_jokes: {
    note: aid('profile', 'inside_jokes', 'note'),
    add: aid('profile', 'inside_jokes', 'add'),
    filter: aid('profile', 'inside_jokes', 'filter'),
    note_body: aid('profile', 'inside_jokes', 'note_body')
  },
  bucket_list: {
    item: aid('profile', 'bucket_list', 'item'),
    add: aid('profile', 'bucket_list', 'add'),
    check_off: aid('profile', 'bucket_list', 'check_off'),
    /** Toggle Edit / Done next to the + */
    edit: aid('profile', 'bucket_list', 'edit'),
    /** Open the edit sheet for one row (Edit mode) */
    edit_item: aid('profile', 'bucket_list', 'edit_item'),
    /** Delete via swipe, trash, or edit sheet — use method prop */
    delete: aid('profile', 'bucket_list', 'delete'),
    /** Save on add_bucket_sheet / edit_bucket_sheet */
    save: aid('profile', 'bucket_list', 'save'),
    add_dismiss: aid('add_bucket_sheet', 'actions', 'dismiss'),
    edit_dismiss: aid('edit_bucket_sheet', 'actions', 'dismiss')
  },
  /** Taken + untaken quizzes that live on Profile after Home rotates. */
  quizzes: {
    untaken_row: aid('profile', 'quizzes', 'untaken_row'),
    section_header: aid('profile', 'quizzes', 'section_header'),
    /** Card body for a finished quiz (dead). */
    taken_row: aid('profile', 'quizzes', 'taken_row'),
    see_result: aid('profile', 'quizzes', 'see_result'),
    share: aid('profile', 'quizzes', 'share'),
    retake: aid('profile', 'quizzes', 'retake'),
    /** Visible invite URL (dead). Never log the URL. */
    share_url: aid('profile', 'quizzes', 'share_url'),
    copy_link: aid('profile', 'quizzes', 'copy_link'),
    preview_link: aid('profile', 'quizzes', 'preview_link')
  },
  settings: {
    who_sees_what: aid('profile', 'settings', 'who_sees_what'),
    customize_profile: aid('profile', 'settings', 'customize_profile'),
    discover_toggle: aid('profile', 'settings', 'discover_toggle'),
    coop: aid('profile', 'settings', 'coop'),
    notifications: aid('profile', 'settings', 'notifications'),
    account: aid('profile', 'settings', 'account'),
    delete_account: aid('profile', 'settings', 'delete_account'),
    analytics_toggle: aid('profile', 'settings', 'analytics_toggle'),
    log_out: aid('profile', 'settings', 'log_out'),
    appearance: aid('profile', 'settings', 'appearance'),
    blocked_people: aid('profile', 'settings', 'blocked_people'),
    storage_plan: aid('profile', 'settings', 'storage_plan'),
    always_original: aid('profile', 'settings', 'always_original'),
    /** Opt-in Assistant toggle (hidden unless admin-eligible). */
    assistant_toggle: aid('profile', 'settings', 'assistant_toggle'),
    /** Open the Assistant surface after opt-in. */
    assistant_open: aid('profile', 'settings', 'assistant_open'),
    /** Billy allowance status card (dead_click). */
    billy_status: aid('profile', 'settings', 'billy_status'),
    /** Start Billy+ (soft stub or future IAP). */
    billy_plus_cta: aid('profile', 'settings', 'billy_plus_cta'),
    /** Cancel Billy+ at period end. */
    billy_plus_cancel: aid('profile', 'settings', 'billy_plus_cancel'),
    /** Connect or manage linked Spotify (account link, not login). */
    connect_spotify: aid('profile', 'settings', 'connect_spotify'),
    /** Disconnect Spotify after confirm. */
    disconnect_spotify: aid('profile', 'settings', 'disconnect_spotify'),
    /** Connect Apple Music (account link, not Bridger login). */
    connect_apple_music: aid('profile', 'settings', 'connect_apple_music'),
    /** Disconnect Apple Music after confirm. */
    disconnect_apple_music: aid('profile', 'settings', 'disconnect_apple_music'),
    /** Surprises section header (dead_click). */
    surprises_header: aid('profile', 'settings', 'surprises_header'),
    /** Demo/QA: queue emoji-bomb gift for yourself. */
    play_emoji_bomb: aid('profile', 'settings', 'play_emoji_bomb'),
    /** Demo/QA: preview reusable emoji rain. */
    preview_emoji_rain: aid('profile', 'settings', 'preview_emoji_rain'),
    /** Leave runtime demo and return to real Sign in. */
    leave_demo: aid('profile', 'settings', 'leave_demo')
  },
  /** Music pick / preview controls on profile + Catch-Up. */
  music: {
    preview_play: aid('profile', 'music', 'preview_play'),
    preview_pause: aid('profile', 'music', 'preview_pause'),
    open_spotify: aid('profile', 'music', 'open_spotify'),
    open_apple_music: aid('profile', 'music', 'open_apple_music'),
    add_playlist: aid('profile', 'music', 'add_playlist'),
    track_search: aid('profile', 'music', 'track_search'),
    track_result: aid('profile', 'music', 'track_result'),
    pick_save: aid('profile', 'music', 'pick_save'),
    actions_sheet: aid('music_track_sheet', 'chrome', 'body'),
    actions_dismiss: aid('music_track_sheet', 'actions', 'dismiss')
  },
  top_nav: {
    page_title: aid('profile', 'top_nav', 'page_title'),
    edit: aid('profile', 'top_nav', 'edit'),
    back: aid('profile', 'top_nav', 'back'),
    /** Search this profile's visible fields (never logs query text). */
    search: aid('profile', 'top_nav', 'search')
  },
  // Friend view of a profile
  about_them: {
    about_me: aid('profile', 'about_them', 'about_me'),
    this_or_that_row: aid('profile', 'about_them', 'this_or_that_row'),
    hobbies_widget: aid('profile', 'about_them', 'hobbies_widget'),
    places_map: aid('profile', 'about_them', 'places_map')
  },
  friend_tabs: {
    about_them: aid('profile', 'tabs', 'about_them'),
    in_common: aid('profile', 'tabs', 'in_common'),
    inside_jokes: aid('profile', 'tabs', 'inside_jokes'),
    bucket_list: aid('profile', 'tabs', 'bucket_list'),
    /** Private Notes & reminders tab on a friend's profile */
    notes: aid('profile', 'tabs', 'notes')
  },
  in_common: {
    info: aid('profile', 'in_common', 'info'),
    section_header: aid('profile', 'in_common', 'section_header'),
    /** A mutual friend's face in the In common strip */
    mutual_row: aid('profile', 'in_common', 'mutual_row'),
    /** dead — empty In common copy when nothing overlaps at this circle */
    empty_body: aid('profile', 'in_common', 'empty_body'),
    /** opens Personality quizzes (connect_over). Click only; quiz_completed later. */
    personality_quizzes: aid('profile', 'in_common', 'personality_quizzes')
  },
  actions: {
    message: aid('profile', 'actions', 'message'),
    /** Friend profile: open the emoji-bomb gift confirm sheet. */
    emoji_bomb: aid('profile', 'actions', 'emoji_bomb'),
    how_you_met: aid('profile', 'actions', 'how_you_met'),
    private_note: aid('profile', 'actions', 'private_note'),
    overflow: aid('profile', 'actions', 'overflow')
  },
  /**
   * Private notes & reminders on a friend's profile (author-only).
   * Never log note body text — only kind / cadence.
   */
  notes_reminders: {
    section_header: aid('profile', 'notes_reminders', 'section_header'),
    kind: aid('profile', 'notes_reminders', 'kind'),
    cadence: aid('profile', 'notes_reminders', 'cadence'),
    add: aid('profile', 'notes_reminders', 'add'),
    delete: aid('profile', 'notes_reminders', 'delete'),
    /** Alias kept for older references to the whole block */
    private_note: aid('profile', 'actions', 'private_note')
  }
} as const;

// --- Profile customize (co-op Theme + Layout; presentation only) ---
// Product outcomes (types.ts): profile_customized, profile_theme_saved,
// profile_layout_saved. Fire on confirmed save only.
export const CUSTOMIZE = {
  top_nav: {
    page_title: aid('customize', 'top_nav', 'page_title'),
    back: aid('customize', 'top_nav', 'back')
  },
  style: {
    intro_body: aid('customize', 'style', 'intro_body'),
    accent_option: aid('customize', 'style', 'accent_option'),
    background_option: aid('customize', 'style', 'background_option'),
    font_option: aid('customize', 'style', 'font_option'),
    mode_option: aid('customize', 'style', 'mode_option'),
    preview: aid('customize', 'style', 'preview')
  },
  layout: {
    module_row: aid('customize', 'layout', 'module_row'),
    reorder: aid('customize', 'layout', 'reorder')
  },
  actions: {
    save: aid('customize', 'actions', 'save'),
    view_original: aid('customize', 'actions', 'view_original')
  }
} as const;

// --- Ask sheet (poll/question composer over Home) ---
export const ASK_SHEET = {
  fields: {
    prompt: aid('ask_sheet', 'fields', 'prompt'),
    option: aid('ask_sheet', 'fields', 'option')
  },
  actions: {
    add_option: aid('ask_sheet', 'actions', 'add_option'),
    remove_option: aid('ask_sheet', 'actions', 'remove_option'),
    post: aid('ask_sheet', 'actions', 'post')
  }
} as const;

// --- Events ---
export const EVENTS = {
  list: {
    tab: aid('events', 'list', 'tab'),
    event_card: aid('events', 'list', 'event_card'),
    page_title: aid('events', 'list', 'page_title'),
    create: aid('events', 'list', 'create'),
    // Header messages shortcut (moved off the bottom pill).
    messages_icon: aid('events', 'list', 'messages_icon'),
    profile_icon: aid('events', 'list', 'profile_icon')
  },
  /** Marketing gate before the user explores the Events tab */
  gate: {
    headline: aid('events', 'gate', 'headline'),
    idea_wall: aid('events', 'gate', 'idea_wall'),
    idea_chip: aid('events', 'gate', 'idea_chip'),
    touch_grass_mark: aid('events', 'gate', 'touch_grass_mark'),
    /** Dismisses the gate into the normal Events list (does not open create). */
    explore: aid('events', 'gate', 'explore'),
    /** The charging bar shown before Explore Events unlocks (dead-click region). */
    cta_loading: aid('events', 'gate', 'cta_loading'),
    /** Retired: Explore Events used to open create. Kept so old events still parse. */
    create: aid('events', 'gate', 'create'),
    body: aid('events', 'gate', 'body')
  },
  detail: {
    share: aid('events', 'detail', 'share'),
    /** Retired: native share sheet covers copy. Kept so old events still parse. */
    copy_link: aid('events', 'detail', 'copy_link'),
    going: aid('events', 'detail', 'going'),
    cant: aid('events', 'detail', 'cant'),
    going_count: aid('events', 'detail', 'going_count'),
    to_meet_count: aid('events', 'detail', 'to_meet_count'),
    map: aid('events', 'detail', 'map'),
    add_to_calendar: aid('events', 'detail', 'add_to_calendar'),
    cover_image: aid('events', 'detail', 'cover_image'),
    title_body: aid('events', 'detail', 'title_body'),
    /** Date square next to the title (dead_click). */
    date_chip: aid('events', 'detail', 'date_chip'),
    /** Flip-tile countdown under When (dead_click). */
    countdown: aid('events', 'detail', 'countdown'),
    /** Photo album section header (dead_click). */
    photo_album_header: aid('events', 'detail', 'photo_album_header'),
    /** One photo tile in the event album. */
    photo_album_tile: aid('events', 'detail', 'photo_album_tile'),
    details_body: aid('events', 'detail', 'details_body'),
    assignment_row: aid('events', 'detail', 'assignment_row'),
    assign_name: aid('events', 'detail', 'assign_name'),
    meet_row: aid('events', 'detail', 'meet_row'),
    back: aid('events', 'detail', 'back')
  },
  host: {
    edit: aid('events', 'host', 'edit'),
    going_count: aid('events', 'host', 'going_count'),
    invited_count: aid('events', 'host', 'invited_count'),
    /**
     * Retired: "brought" left the counts row; attribution is inside the people
     * sheet. Id kept so old events still parse.
     */
    brought_count: aid('events', 'host', 'brought_count'),
    add_cohost: aid('events', 'host', 'add_cohost'),
    chip_in_edit: aid('events', 'host', 'chip_in_edit'),
    reminders_toggle: aid('events', 'host', 'reminders_toggle'),
    reminders_header: aid('events', 'host', 'reminders_header'),
    introduction_row: aid('events', 'host', 'introduction_row'),
    introductions_header: aid('events', 'host', 'introductions_header')
  },
  /** Who's coming sheet opened from going / invited counts */
  people_sheet: {
    tab_going: aid('event_people_sheet', 'tabs', 'going'),
    tab_invited: aid('event_people_sheet', 'tabs', 'invited'),
    row: aid('event_people_sheet', 'list', 'row'),
    dismiss: aid('event_people_sheet', 'actions', 'dismiss')
  },
  touch_grass: {
    send: aid('events', 'touch_grass', 'send'),
    end: aid('events', 'touch_grass', 'end'),
    featured_signal: aid('events', 'touch_grass', 'featured_signal'),
    signal_row: aid('events', 'touch_grass', 'signal_row'),
    section_header: aid('events', 'touch_grass', 'section_header'),
    info: aid('events', 'touch_grass', 'info')
  },
  hosting: {
    section_header: aid('events', 'hosting', 'section_header'),
    info: aid('events', 'hosting', 'info')
  },
  going: {
    section_header: aid('events', 'going', 'section_header'),
    info: aid('events', 'going', 'info')
  },
  invited: {
    section_header: aid('events', 'invited', 'section_header'),
    info: aid('events', 'invited', 'info')
  },
  community: {
    section_header: aid('events', 'community', 'section_header'),
    info: aid('events', 'community', 'info'),
    // dead: the Coming soon teaser card (street illustration + copy)
    teaser_card: aid('events', 'community', 'teaser_card')
  }
} as const;

// --- Create event (own surface: a 4-step wizard launched from events) ---
export const CREATE_EVENT = {
  chrome: {
    back: aid('create_event', 'chrome', 'back'),
    next: aid('create_event', 'chrome', 'next'),
    close: aid('create_event', 'chrome', 'close'),
    // dead: the step title at the top of each screen
    step_title: aid('create_event', 'chrome', 'step_title')
  },
  details: {
    title: aid('create_event', 'details', 'title'),
    bio: aid('create_event', 'details', 'bio'),
    date: aid('create_event', 'details', 'date'),
    time: aid('create_event', 'details', 'time'),
    date_picker: aid('create_event', 'details', 'date_picker'),
    time_picker: aid('create_event', 'details', 'time_picker'),
    place: aid('create_event', 'details', 'place'),
    address: aid('create_event', 'details', 'address'),
    address_result: aid('create_event', 'details', 'address_result'),
    cohost: aid('create_event', 'details', 'cohost'),
    cohost_toggle: aid('create_event', 'details', 'cohost_toggle'),
    cohost_search: aid('create_event', 'details', 'cohost_search'),
    cohost_row: aid('create_event', 'details', 'cohost_row'),
    chip_in_amount: aid('create_event', 'details', 'chip_in_amount'),
    chip_in_method: aid('create_event', 'details', 'chip_in_method'),
    chip_in_handle: aid('create_event', 'details', 'chip_in_handle'),
    chip_in_toggle: aid('create_event', 'details', 'chip_in_toggle'),
    friends_invite_toggle: aid('create_event', 'details', 'friends_invite_toggle'),
    guest_cap: aid('create_event', 'details', 'guest_cap'),
    repeats_toggle: aid('create_event', 'details', 'repeats_toggle'),
    repeats_freq: aid('create_event', 'details', 'repeats_freq'),
    repeats_interval: aid('create_event', 'details', 'repeats_interval'),
    repeats_weekday: aid('create_event', 'details', 'repeats_weekday'),
    repeats_monthly_mode: aid('create_event', 'details', 'repeats_monthly_mode'),
    repeats_monthday: aid('create_event', 'details', 'repeats_monthday'),
    repeats_setpos: aid('create_event', 'details', 'repeats_setpos'),
    repeats_ends: aid('create_event', 'details', 'repeats_ends'),
    repeats_until: aid('create_event', 'details', 'repeats_until'),
    repeats_count: aid('create_event', 'details', 'repeats_count')
  },
  invite: {
    search: aid('create_event', 'invite', 'search'),
    invite_row: aid('create_event', 'invite', 'invite_row'),
    suggest_row: aid('create_event', 'invite', 'suggest_row')
  },
  extras: {
    add_cover: aid('create_event', 'extras', 'add_cover'),
    cover_mode: aid('create_event', 'extras', 'cover_mode'),
    cover_emoji: aid('create_event', 'extras', 'cover_emoji'),
    cover_color: aid('create_event', 'extras', 'cover_color'),
    cover_text: aid('create_event', 'extras', 'cover_text'),
    add_assignment: aid('create_event', 'extras', 'add_assignment'),
    assignment_row: aid('create_event', 'extras', 'assignment_row'),
    assign_name: aid('create_event', 'extras', 'assign_name')
  },
  preview: {
    // dead: the read-only preview card body
    summary: aid('create_event', 'preview', 'summary'),
    create: aid('create_event', 'preview', 'create')
  }
} as const;

// --- Story viewer (Updates player) ---
export const STORY = {
  viewer: {
    tap_next: aid('story', 'viewer', 'tap_next'),
    tap_prev: aid('story', 'viewer', 'tap_prev'),
    /** Center of the media: pause / resume the current post. */
    tap_pause: aid('story', 'viewer', 'tap_pause'),
    progress_bar: aid('story', 'viewer', 'progress_bar'),
    author: aid('story', 'viewer', 'author'),
    overflow: aid('story', 'viewer', 'overflow'),
    close: aid('story', 'viewer', 'close'),
    caption_body: aid('story', 'viewer', 'caption_body'),
    /** End-of-tray celebration body (dead-click). */
    caught_up_body: aid('story', 'viewer', 'caught_up_body'),
    /** Done / X on the "You're all caught up" screen. */
    caught_up_done: aid('story', 'viewer', 'caught_up_done')
  },
  reaction_rail: {
    record: aid('story', 'reaction_rail', 'record'),
    sticker: aid('story', 'reaction_rail', 'sticker'),
    comment: aid('story', 'reaction_rail', 'comment'),
    reaction: aid('story', 'reaction_rail', 'reaction')
  }
} as const;

// --- Sticker tray: the emoji strip that slides out beside the reaction rail
// (own surface, parent = story) ---
export const STICKER_TRAY = {
  picker: {
    emoji: aid('sticker_tray', 'picker', 'emoji'),
    custom_sticker: aid('sticker_tray', 'picker', 'custom_sticker'),
    strip: aid('sticker_tray', 'picker', 'strip'),
    dismiss: aid('sticker_tray', 'picker', 'dismiss')
  }
} as const;

// --- Sticker studio: make your own sticker from a photo you take
// (own surface, parent = sticker_tray) ---
export const STICKER_STUDIO = {
  capture: {
    shutter: aid('sticker_studio', 'capture', 'shutter'),
    switch_camera: aid('sticker_studio', 'capture', 'switch_camera'),
    retake: aid('sticker_studio', 'capture', 'retake'),
    use_it: aid('sticker_studio', 'capture', 'use_it'),
    dismiss: aid('sticker_studio', 'capture', 'dismiss')
  }
} as const;

// --- Circle recorder: the 10-second round video reply (own surface, parent = story) ---
export const CIRCLE_RECORDER = {
  capture: {
    record: aid('circle_recorder', 'capture', 'record'),
    stop: aid('circle_recorder', 'capture', 'stop'),
    retake: aid('circle_recorder', 'capture', 'retake'),
    send: aid('circle_recorder', 'capture', 'send'),
    switch_camera: aid('circle_recorder', 'capture', 'switch_camera'),
    dismiss: aid('circle_recorder', 'capture', 'dismiss'),
    permission_prompt: aid('circle_recorder', 'capture', 'permission_prompt')
  }
} as const;

// --- Catch-Up sheet (own surface, parent = story) ---
export const CATCH_UP = {
  top: {
    poll: aid('catch_up', 'top', 'poll'),
    event: aid('catch_up', 'top', 'event'),
    going: aid('catch_up', 'top', 'going'),
    question: aid('catch_up', 'top', 'question')
  },
  week: {
    day_card: aid('catch_up', 'week', 'day_card')
  },
  bottom: {
    answered_row: aid('catch_up', 'bottom', 'answered_row'),
    reply: aid('catch_up', 'bottom', 'reply')
  },
  currently: {
    /** Listening cell body (may open music actions). */
    listening: aid('catch_up', 'currently', 'listening'),
    /** Reading cell (dead_click region when non-interactive). */
    reading: aid('catch_up', 'currently', 'reading'),
    preview_play: aid('catch_up', 'currently', 'preview_play')
  },
  chrome: {
    peek: aid('catch_up', 'chrome', 'peek'),
    handle: aid('catch_up', 'chrome', 'handle'),
    dismiss: aid('catch_up', 'chrome', 'dismiss')
  }
} as const;

// --- Post composer / capture (own surface) ---
export const POST_COMPOSER = {
  capture: {
    photo: aid('post_composer', 'capture', 'photo'),
    hold_video: aid('post_composer', 'capture', 'hold_video'),
    switch_camera: aid('post_composer', 'capture', 'switch_camera'),
    /** Flash cycles off / on / auto (property flash_mode). */
    flash: aid('post_composer', 'capture', 'flash'),
    /** Camera-roll thumb bottom-left of the shutter (opens the OS picker). */
    roll: aid('post_composer', 'capture', 'roll'),
    /** Small thumbnail of a page you already made today; tap = edit that page. */
    today_page_thumb: aid('post_composer', 'capture', 'today_page_thumb'),
    /** @deprecated Removed from capture UI 2026-09-09. Keep id for historical events. */
    prompts_tray_open: aid('post_composer', 'capture', 'prompts_tray_open'),
    /** "2 photos" count pill (dead-click). Was "2/4", which looked like steps. */
    count_pill: aid('post_composer', 'capture', 'count_pill'),
    /** Zoom chip (.5 / 1 / 2 / 4). Property zoom_factor. Only chips the phone supports. */
    zoom: aid('post_composer', 'capture', 'zoom')
  },
  caption: {
    type: aid('post_composer', 'caption', 'type'),
    voice_to_text: aid('post_composer', 'caption', 'voice_to_text'),
    /** Done in the caption sheet. */
    done: aid('post_composer', 'caption', 'done')
  },
  /** The 8.5 x 11 page itself on the compose screen. */
  page: {
    /** Paper with nothing tappable under the finger (dead-click). */
    canvas: aid('post_composer', 'page', 'canvas'),
    photo_slot: aid('post_composer', 'page', 'photo_slot'),
    caption_slot: aid('post_composer', 'page', 'caption_slot'),
    stamp: aid('post_composer', 'page', 'stamp'),
    /** Chip row above the page after a photo is selected. */
    replace: aid('post_composer', 'page', 'replace'),
    remove: aid('post_composer', 'page', 'remove'),
    move_to_page: aid('post_composer', 'page', 'move_to_page')
  },
  layouts: {
    /** One layout thumbnail (method tap|swipe, page_index, carousel_depth, layout_id). */
    thumb: aid('post_composer', 'layouts', 'thumb')
  },
  /** Strip of today's pages (1 to 4). */
  pages: {
    page_thumb: aid('post_composer', 'pages', 'page_thumb'),
    new_page: aid('post_composer', 'pages', 'new_page')
  },
  suggested: {
    /** @deprecated Themed OOTD / Hot take squares removed from capture 2026-09-09. */
    suggested_prompt: aid('post_composer', 'suggested', 'suggested_prompt'),
    /** Opt-in random update nudges (Settings → Notifications; not on capture). */
    random_nudges_toggle: aid('post_composer', 'suggested', 'random_nudges_toggle'),
    /** @deprecated Was beside the capture-tray toggle. */
    random_nudges_label: aid('post_composer', 'suggested', 'random_nudges_label'),
    /** Event tag row when opened from a party capture nudge (dead-click). */
    event_tag_label: aid('post_composer', 'suggested', 'event_tag_label'),
    /** Remove the pre-filled event tag before posting. */
    event_tag_clear: aid('post_composer', 'suggested', 'event_tag_clear')
  },
  audience: {
    close: aid('post_composer', 'audience', 'close'),
    friends: aid('post_composer', 'audience', 'friends'),
    everyone: aid('post_composer', 'audience', 'everyone'),
    group: aid('post_composer', 'audience', 'group'),
    /** Owner-only page (DB tier `none`). */
    only_me: aid('post_composer', 'audience', 'only_me'),
    /** The "Friends" chip top-right of the page that opens the audience sheet. */
    chip: aid('post_composer', 'audience', 'chip')
  },
  actions: {
    /** Confirm inside the who-sees sheet ("Post to Friends"). */
    post: aid('post_composer', 'actions', 'post'),
    /** Compose bar CTA: opens the who-sees sheet so they pick audience, then post. */
    next: aid('post_composer', 'actions', 'next'),
    add_another: aid('post_composer', 'actions', 'add_another'),
    discard: aid('post_composer', 'actions', 'discard'),
    /** "+" in the composer bar: opens the add-media sheet. */
    add: aid('post_composer', 'actions', 'add'),
    /** Pencil in the composer bar: opens the customize tray. */
    customize: aid('post_composer', 'actions', 'customize'),
    /** Tiny "i" that explains the compose screen (opens section_info_tooltip). */
    info: aid('post_composer', 'actions', 'info'),
    info_dismiss: aid('post_composer', 'actions', 'info_dismiss'),
    /** The tip bubble body (dead-click). */
    info_body: aid('post_composer', 'actions', 'info_body'),
    undo: aid('post_composer', 'actions', 'undo'),
    /** Back chevron from the page to the camera (draft kept). */
    back: aid('post_composer', 'actions', 'back'),
    /** Add-media sheet choices. */
    add_camera: aid('post_composer', 'actions', 'add_camera'),
    add_roll: aid('post_composer', 'actions', 'add_roll'),
    /** Customize tray: paper color swatch. */
    background_swatch: aid('post_composer', 'actions', 'background_swatch'),
    /** Just-shot: leave the photo on today's page and post with last audience. */
    done: aid('post_composer', 'actions', 'done'),
    /** Just-shot: open the collage editor. */
    make_collage: aid('post_composer', 'actions', 'make_collage'),
    /** Just-shot: throw this take away and open the camera again. */
    retake: aid('post_composer', 'actions', 'retake'),
    /** Save the photo or finished page to the camera roll (confirmed save). */
    save_roll: aid('post_composer', 'actions', 'save_roll')
  },
  just_shot: {
    /** "On today's page" line (dead-click). */
    on_page: aid('post_composer', 'just_shot', 'on_page'),
    photo: aid('post_composer', 'just_shot', 'photo')
  }
} as const;

// --- Collage editor (optional second door after the camera) ---
export const COLLAGE_EDITOR = {
  chrome: {
    close: aid('collage_editor', 'chrome', 'close'),
    undo: aid('collage_editor', 'chrome', 'undo'),
    redo: aid('collage_editor', 'chrome', 'redo'),
    menu: aid('collage_editor', 'chrome', 'menu'),
    next: aid('collage_editor', 'chrome', 'next'),
    /** Title / empty paper (dead-click). */
    title: aid('collage_editor', 'chrome', 'title')
  },
  menu: {
    save_roll: aid('collage_editor', 'menu', 'save_roll'),
    learn: aid('collage_editor', 'menu', 'learn'),
    change_pack: aid('collage_editor', 'menu', 'change_pack'),
    clear: aid('collage_editor', 'menu', 'clear'),
    delete_page: aid('collage_editor', 'menu', 'delete_page')
  },
  page: {
    canvas: aid('collage_editor', 'page', 'canvas'),
    piece: aid('collage_editor', 'page', 'piece'),
    bin: aid('collage_editor', 'page', 'bin')
  },
  rail: {
    delete: aid('collage_editor', 'rail', 'delete'),
    duplicate: aid('collage_editor', 'rail', 'duplicate'),
    edit: aid('collage_editor', 'rail', 'edit'),
    rotate: aid('collage_editor', 'rail', 'rotate'),
    bring_front: aid('collage_editor', 'rail', 'bring_front')
  },
  toolbar: {
    text: aid('collage_editor', 'toolbar', 'text'),
    add: aid('collage_editor', 'toolbar', 'add'),
    camera: aid('collage_editor', 'toolbar', 'camera'),
    packs: aid('collage_editor', 'toolbar', 'packs'),
    voice: aid('collage_editor', 'toolbar', 'voice')
  }
} as const;

export const COLLAGE_HUB = {
  grid: {
    text: aid('collage_hub', 'grid', 'text'),
    camera: aid('collage_hub', 'grid', 'camera'),
    roll: aid('collage_hub', 'grid', 'roll'),
    voice: aid('collage_hub', 'grid', 'voice'),
    people: aid('collage_hub', 'grid', 'people'),
    layout: aid('collage_hub', 'grid', 'layout'),
    paper: aid('collage_hub', 'grid', 'paper'),
    cutout: aid('collage_hub', 'grid', 'cutout'),
    sticker: aid('collage_hub', 'grid', 'sticker')
  },
  chrome: {
    dismiss: aid('collage_hub', 'chrome', 'dismiss'),
    title: aid('collage_hub', 'chrome', 'title')
  }
} as const;

export const COLLAGE_PAPER = {
  swatch: {
    paper: aid('collage_paper', 'swatch', 'paper'),
    pack: aid('collage_paper', 'swatch', 'pack'),
    spectrum: aid('collage_paper', 'swatch', 'spectrum')
  },
  chrome: {
    dismiss: aid('collage_paper', 'chrome', 'dismiss'),
    done: aid('collage_paper', 'chrome', 'done'),
    title: aid('collage_paper', 'chrome', 'title')
  }
} as const;

export const COLLAGE_TEXT = {
  field: {
    type: aid('collage_text', 'field', 'type')
  },
  tools: {
    size: aid('collage_text', 'tools', 'size'),
    font: aid('collage_text', 'tools', 'font'),
    color: aid('collage_text', 'tools', 'color'),
    spectrum: aid('collage_text', 'tools', 'spectrum'),
    box: aid('collage_text', 'tools', 'box')
  },
  chrome: {
    dismiss: aid('collage_text', 'chrome', 'dismiss'),
    done: aid('collage_text', 'chrome', 'done'),
    title: aid('collage_text', 'chrome', 'title')
  }
} as const;

export const COLLAGE_VOICE = {
  capture: {
    record: aid('collage_voice', 'capture', 'record'),
    stop: aid('collage_voice', 'capture', 'stop'),
    play: aid('collage_voice', 'capture', 'play'),
    transcribe: aid('collage_voice', 'capture', 'transcribe'),
    add: aid('collage_voice', 'capture', 'add'),
    permission_prompt: aid('collage_voice', 'capture', 'permission_prompt')
  },
  chrome: {
    dismiss: aid('collage_voice', 'chrome', 'dismiss'),
    title: aid('collage_voice', 'chrome', 'title')
  }
} as const;

export const COLLAGE_PEOPLE = {
  list: {
    friend: aid('collage_people', 'list', 'friend'),
    empty: aid('collage_people', 'list', 'empty')
  },
  chrome: {
    dismiss: aid('collage_people', 'chrome', 'dismiss'),
    done: aid('collage_people', 'chrome', 'done'),
    title: aid('collage_people', 'chrome', 'title')
  }
} as const;

export const COLLAGE_CUTOUT = {
  tools: {
    subject: aid('collage_cutout', 'tools', 'subject'),
    shape: aid('collage_cutout', 'tools', 'shape'),
    add: aid('collage_cutout', 'tools', 'add')
  },
  chrome: {
    dismiss: aid('collage_cutout', 'chrome', 'dismiss'),
    title: aid('collage_cutout', 'chrome', 'title')
  }
} as const;

export const COLLAGE_LAYER = {
  tabs: {
    more: aid('collage_layer', 'tabs', 'more'),
    tilt: aid('collage_layer', 'tabs', 'tilt'),
    colour: aid('collage_layer', 'tabs', 'colour'),
    frame: aid('collage_layer', 'tabs', 'frame')
  },
  pick: {
    option: aid('collage_layer', 'pick', 'option'),
    swap: aid('collage_layer', 'pick', 'swap'),
    duplicate: aid('collage_layer', 'pick', 'duplicate'),
    delete: aid('collage_layer', 'pick', 'delete')
  },
  chrome: {
    dismiss: aid('collage_layer', 'chrome', 'dismiss'),
    done: aid('collage_layer', 'chrome', 'done'),
    title: aid('collage_layer', 'chrome', 'title')
  }
} as const;

export const COLLAGE_EXIT = {
  actions: {
    discard: aid('collage_exit', 'actions', 'discard'),
    save: aid('collage_exit', 'actions', 'save')
  },
  chrome: {
    title: aid('collage_exit', 'chrome', 'title'),
    body: aid('collage_exit', 'chrome', 'body')
  }
} as const;

export const COLLAGE_FINISH = {
  actions: {
    save_roll: aid('collage_finish', 'actions', 'save_roll'),
    share: aid('collage_finish', 'actions', 'share'),
    done: aid('collage_finish', 'actions', 'done')
  },
  chrome: {
    title: aid('collage_finish', 'chrome', 'title'),
    page: aid('collage_finish', 'chrome', 'page')
  }
} as const;

export const COLLAGE_PACK_BROWSER = {
  list: {
    use: aid('collage_packs', 'list', 'use'),
    card: aid('collage_packs', 'list', 'card')
  },
  chrome: {
    dismiss: aid('collage_packs', 'chrome', 'dismiss'),
    title: aid('collage_packs', 'chrome', 'title')
  }
} as const;

export const COLLAGE_LAYOUTS = {
  list: {
    thumb: aid('collage_layouts', 'list', 'thumb')
  },
  chrome: {
    dismiss: aid('collage_layouts', 'chrome', 'dismiss'),
    done: aid('collage_layouts', 'chrome', 'done'),
    title: aid('collage_layouts', 'chrome', 'title')
  }
} as const;

/** @deprecated Tray removed from capture 2026-09-09. Ids kept for historical events. */
export const PROMPTS_TRAY = {
  tray: {
    dismiss: aid('prompts_tray', 'tray', 'dismiss')
  }
} as const;

/** Half-height caption sheet: Type or Record (own surface). */
export const CAPTION_SHEET = {
  tabs: {
    type: aid('caption_sheet', 'tabs', 'type'),
    record: aid('caption_sheet', 'tabs', 'record')
  },
  actions: {
    done: aid('caption_sheet', 'actions', 'done'),
    dismiss: aid('caption_sheet', 'actions', 'dismiss')
  }
} as const;

/** Who-sees-this sheet wrapping AudiencePicker (own surface). */
export const AUDIENCE_SHEET = {
  actions: {
    dismiss: aid('audience_sheet', 'actions', 'dismiss')
  }
} as const;

/** "+" add-media sheet (own surface). */
export const ADD_MEDIA_SHEET = {
  actions: {
    dismiss: aid('add_media_sheet', 'actions', 'dismiss')
  }
} as const;

/** Pencil customize tray (own surface). */
export const CUSTOMIZE_TRAY = {
  actions: {
    dismiss: aid('customize_tray', 'actions', 'dismiss')
  }
} as const;

// --- Messages (capped inbox) ---
export const MESSAGES = {
  conversation: {
    bubble: aid('messages', 'conversation', 'bubble'),
    /** Double-tap a friend's bubble to heart. Does not count as a send. */
    heart: aid('messages', 'conversation', 'heart'),
    share_contact: aid('messages', 'conversation', 'share_contact'),
    /** Tap the Contact card chip on a shared-card bubble (opens dropdown). */
    contact_card_chip: aid('messages', 'conversation', 'contact_card_chip'),
    /** Retired: Make a plan left Messages. Id kept so old events still group. */
    make_a_plan: aid('messages', 'conversation', 'make_a_plan'),
    back: aid('messages', 'conversation', 'back'),
    maxed_notice: aid('messages', 'conversation', 'maxed_notice'),
    row: aid('messages', 'conversation', 'row'),
    section_header: aid('messages', 'conversation', 'section_header'),
    contact_card_row: aid('messages', 'conversation', 'contact_card_row'),
    cap_note: aid('messages', 'conversation', 'cap_note')
  },
  composer: {
    input: aid('messages', 'composer', 'input'),
    send: aid('messages', 'composer', 'send')
  },
  top_nav: {
    page_title: aid('messages', 'top_nav', 'page_title'),
    new_message: aid('messages', 'top_nav', 'new_message'),
    search: aid('messages', 'top_nav', 'search'),
    profile_icon: aid('messages', 'top_nav', 'profile_icon')
  },
  contact_card: {
    /** Retired: Share contact is `conversation.share_contact` on the thread. */
    edit: aid('messages', 'contact_card', 'edit'),
    field_toggle: aid('messages', 'contact_card', 'field_toggle'),
    /** Focus a field value box (never logs the typed text). */
    field_input: aid('messages', 'contact_card', 'field_input'),
    /** Retired: Share contact is `conversation.share_contact` on the thread. */
    share: aid('messages', 'contact_card', 'share'),
    field_row: aid('messages', 'contact_card', 'field_row')
  }
} as const;

// --- News (bottom-pill destination; placeholder feed for now) ---
export const NEWS = {
  top_nav: {
    page_title: aid('news', 'top_nav', 'page_title'),
    messages_icon: aid('news', 'top_nav', 'messages_icon'),
    profile_icon: aid('news', 'top_nav', 'profile_icon')
  },
  // The empty/coming-soon body — tagged so a tap logs a dead_click.
  feed: {
    empty_body: aid('news', 'feed', 'empty_body')
  }
} as const;

// --- New message sheet (own surface, parent = messages) ---
export const NEW_MESSAGE_SHEET = {
  search: aid('new_message_sheet', 'search', 'input'),
  friend_row: aid('new_message_sheet', 'list', 'friend_row'),
  dismiss: aid('new_message_sheet', 'chrome', 'dismiss')
} as const;

// --- Connection Reveal (own surface/flow — plays right after connect) ---
export const REVEAL = {
  flow: {
    how_you_met_choice: aid('reveal', 'flow', 'how_you_met_choice'),
    record_place_toggle: aid('reveal', 'flow', 'record_place_toggle'),
    /** optional Close / Friends / Acquaintances when they already know each other */
    tier_choice: aid('reveal', 'flow', 'tier_choice'),
    /** optional short how-you-met note (Discover path, when there is no place) */
    meet_note: aid('reveal', 'flow', 'meet_note'),
    /** tap "Add a note - optional" to open / close the box */
    meet_note_toggle: aid('reveal', 'flow', 'meet_note_toggle'),
    continue: aid('reveal', 'flow', 'continue'),
    see_profile: aid('reveal', 'flow', 'see_profile'),
    /** tap the right half of a story screen to go forward */
    tap_next: aid('reveal', 'flow', 'tap_next'),
    /** tap the left half of a story screen to go back */
    tap_prev: aid('reveal', 'flow', 'tap_prev'),
    /** X in the corner — leaves the story and opens the new connection's profile */
    close: aid('reveal', 'flow', 'close'),
    /** dead — decorative progress bars */
    progress: aid('reveal', 'flow', 'progress'),
    /** dead — decorative overlapping color circles (was the Venn) */
    orbs: aid('reveal', 'flow', 'orbs'),
    /** dead — legacy Venn id, kept so old events still resolve */
    venn: aid('reveal', 'flow', 'venn')
  },
  /** "How you line up" quiz compatibility scores on the others story beat. */
  quiz_matches: {
    /** i-icon — opens section_info_tooltip ("From the quizzes you both took") */
    info: aid('reveal', 'quiz_matches', 'info')
  },
  /** Screen 3 FoF suggestions (or the opt-in nudge when Discover is off). */
  suggestions: {
    /** dead — "People you might click with" heading */
    title: aid('reveal', 'suggestions', 'title'),
    /** dead — the FoF card body (Add is its own id) */
    card: aid('reveal', 'suggestions', 'card'),
    /** Add a FoF from the reveal */
    add: aid('reveal', 'suggestions', 'add'),
    /** Turn on Discover matching from the nudge */
    optin_toggle: aid('reveal', 'suggestions', 'optin_toggle')
  },
  /** Thin overlap: no shared quiz / hobby / granted-tier fact yet. */
  thin: {
    /** dead — the "nothing to line up yet" copy */
    body: aid('reveal', 'thin', 'body'),
    /** opens Personality quizzes. Click only; quiz_completed fires later. */
    personality_quizzes: aid('reveal', 'thin', 'personality_quizzes')
  }
} as const;

// --- Quiz take / result surface ---
export const QUIZ = {
  take: {
    option: aid('quiz', 'take', 'option'),
    explain: aid('quiz', 'take', 'explain'),
    next: aid('quiz', 'take', 'next'),
    back: aid('quiz', 'take', 'back'),
    progress: aid('quiz', 'take', 'progress'),
    /** Question slab body (dead_click). */
    question: aid('quiz', 'take', 'question'),
    /** Commentary / quip body (dead_click). */
    commentary: aid('quiz', 'take', 'commentary')
  },
  result: {
    label: aid('quiz', 'result', 'label'),
    share: aid('quiz', 'result', 'share'),
    who_got_who: aid('quiz', 'result', 'who_got_who'),
    see_more: aid('quiz', 'result', 'see_more'),
    done: aid('quiz', 'result', 'done'),
    /** "Connect with friends" headline (dead). */
    connect_header: aid('quiz', 'result', 'connect_header'),
    /** Invite copy under the headline (dead). */
    connect_body: aid('quiz', 'result', 'connect_body'),
    share_link: aid('quiz', 'result', 'share_link'),
    share_story: aid('quiz', 'result', 'share_story'),
    save_image: aid('quiz', 'result', 'save_image'),
    view_first: aid('quiz', 'result', 'view_first'),
    view_fun: aid('quiz', 'result', 'view_fun'),
    retake: aid('quiz', 'result', 'retake'),
    /** "Just for fun" note on a retake (dead). */
    fun_note: aid('quiz', 'result', 'fun_note'),
    empty_board: aid('quiz', 'result', 'empty_board'),
    invite_friends: aid('quiz', 'result', 'invite_friends'),
    /** You vs the friend who shared the link (dead). */
    duo_card: aid('quiz', 'result', 'duo_card'),
    make_account: aid('quiz', 'result', 'make_account'),
    add_friend: aid('quiz', 'result', 'add_friend'),
    /** Visible invite URL (dead). Never log the URL. */
    share_url: aid('quiz', 'result', 'share_url'),
    copy_link: aid('quiz', 'result', 'copy_link'),
    preview_link: aid('quiz', 'result', 'preview_link')
  }
} as const;

/** Public shared-result page (`/q/[token]`). Own surface. */
export const QUIZ_SHARE = {
  body: {
    card: aid('quiz_share', 'body', 'card'),
    headline: aid('quiz_share', 'body', 'headline'),
    /** "No account needed" helper (dead). */
    note: aid('quiz_share', 'body', 'note')
  },
  actions: {
    take: aid('quiz_share', 'actions', 'take'),
    make_account: aid('quiz_share', 'actions', 'make_account'),
    add_friend: aid('quiz_share', 'actions', 'add_friend')
  }
} as const;

/** Confirm sheet when Back is tapped mid-quiz. Own surface. */
export const END_QUIZ_SHEET = {
  body: aid('end_quiz_sheet', 'body', 'body'),
  end: aid('end_quiz_sheet', 'actions', 'end'),
  stay: aid('end_quiz_sheet', 'actions', 'stay'),
  dismiss: aid('end_quiz_sheet', 'actions', 'dismiss')
} as const;

// --- Weekly activity collage (opened from Home activity card) ---
export const ACTIVITY = {
  top_nav: {
    page_title: aid('activity', 'top_nav', 'page_title'),
    back: aid('activity', 'top_nav', 'back')
  },
  prompt: {
    /** Prompt card body — not tappable on purpose */
    prompt_card: aid('activity', 'prompt', 'prompt_card')
  },
  chrome: {
    post_yours: aid('activity', 'chrome', 'post')
  },
  grid: {
    polaroid: aid('activity', 'grid', 'polaroid'),
    /** Text-note card on a text Side Quest (dead single-tap) */
    text_note: aid('activity', 'grid', 'text_note'),
    heart: aid('activity', 'grid', 'heart'),
    empty_body: aid('activity', 'grid', 'empty_body'),
    dash_post: aid('activity', 'grid', 'dash_post')
  }
} as const;

/** Capture sheet over the collage — own surface with parent_screen=activity */
export const ACTIVITY_CAPTURE = {
  shutter: aid('activity_capture', 'chrome', 'shutter'),
  caption_input: aid('activity_capture', 'chrome', 'caption_input'),
  /** Main blurb field on a text Side Quest (Notes App Discovery) */
  blurb_input: aid('activity_capture', 'chrome', 'blurb_input'),
  audience_picker: aid('activity_capture', 'chrome', 'audience_picker'),
  post: aid('activity_capture', 'chrome', 'post'),
  close: aid('activity_capture', 'chrome', 'close')
} as const;

/** Add an Inside Joke — full-screen composer (surface name kept for history) */
export const ADD_INSIDE_JOKE_SHEET = {
  quote_input: aid('add_inside_joke_sheet', 'form', 'quote_input'),
  sticky_note: aid('add_inside_joke_sheet', 'form', 'sticky_note'),
  color_header: aid('add_inside_joke_sheet', 'form', 'color_header'),
  color_swatch: aid('add_inside_joke_sheet', 'form', 'color_swatch'),
  photo_add: aid('add_inside_joke_sheet', 'form', 'photo_add'),
  photo_remove: aid('add_inside_joke_sheet', 'form', 'photo_remove'),
  photo_locked: aid('add_inside_joke_sheet', 'form', 'photo_locked'),
  who_header: aid('add_inside_joke_sheet', 'form', 'who_header'),
  who_search: aid('add_inside_joke_sheet', 'form', 'who_search'),
  who_chip: aid('add_inside_joke_sheet', 'form', 'who_chip'),
  who_empty: aid('add_inside_joke_sheet', 'form', 'who_empty'),
  event_header: aid('add_inside_joke_sheet', 'form', 'event_header'),
  event_search: aid('add_inside_joke_sheet', 'form', 'event_search'),
  where_input: aid('add_inside_joke_sheet', 'form', 'where_input'),
  where_event_chip: aid('add_inside_joke_sheet', 'form', 'where_event_chip'),
  post: aid('add_inside_joke_sheet', 'actions', 'post'),
  never_mind: aid('add_inside_joke_sheet', 'actions', 'never_mind'),
  close: aid('add_inside_joke_sheet', 'chrome', 'close')
} as const;

// --- Notifications page (Alerts — opened from Home "See all") ---
export const NOTIFICATIONS = {
  top_nav: {
    page_title: aid('notifications', 'top_nav', 'page_title'),
    back: aid('notifications', 'top_nav', 'back')
  },
  list: {
    row: aid('notifications', 'list', 'row'),
    empty_body: aid('notifications', 'list', 'empty_body'),
    /** All / Home / Friends / Events / Discover chips */
    filter: aid('notifications', 'list', 'filter'),
    /** Clears unread on every listed alert */
    mark_all_read: aid('notifications', 'list', 'mark_all_read')
  },
  /** Profile → Settings → Notifications prefs screen */
  prefs: {
    page_title: aid('notification_prefs', 'top_nav', 'page_title'),
    back: aid('notification_prefs', 'top_nav', 'back'),
    /** Intro copy under the title — not tappable on purpose */
    intro_body: aid('notification_prefs', 'list', 'intro_body'),
    /** "Who can nudge you" section label */
    who_header: aid('notification_prefs', 'list', 'who_header'),
    /** Kind-group section labels (Events, Big moments, …) */
    section_header: aid('notification_prefs', 'list', 'section_header'),
    /** Per kind or circle; props: pref + pref_scope */
    toggle: aid('notification_prefs', 'list', 'toggle')
  }
} as const;


// --- 404 / broken path (Magic Patterns Windows dialog) ---
export const NOT_FOUND = {
  chrome: {
    dismiss: aid('not_found', 'chrome', 'dismiss')
  },
  dialog: {
    body: aid('not_found', 'dialog', 'body'),
    ok: aid('not_found', 'dialog', 'ok')
  }
} as const;

// --- Co-op portal (public governance surface; member writes) ---
export const COOP = {
  ideas: {
    nav: aid('coop', 'ideas', 'nav'),
    info: aid('coop', 'ideas', 'info'),
    idea_card: aid('coop', 'ideas', 'idea_card'),
    support: aid('coop', 'ideas', 'support'),
    comment: aid('coop', 'ideas', 'comment'),
    submit: aid('coop', 'ideas', 'submit'),
    open_submit: aid('coop', 'ideas', 'open_submit'),
    section_header: aid('coop', 'ideas', 'section_header')
  },
  vote: {
    nav: aid('coop', 'vote', 'nav'),
    info: aid('coop', 'vote', 'info'),
    beta_vote: aid('coop', 'vote', 'beta_vote'),
    dues_vote: aid('coop', 'vote', 'dues_vote'),
    mission_support: aid('coop', 'vote', 'mission_support'),
    verify: aid('coop', 'vote', 'verify'),
    section_header: aid('coop', 'vote', 'section_header')
  },
  mission: {
    nav: aid('coop', 'mission', 'nav'),
    info: aid('coop', 'mission', 'info'),
    page_title: aid('coop', 'mission', 'page_title'),
    principle_card: aid('coop', 'mission', 'principle_card'),
    support: aid('coop', 'mission', 'support'),
    section_header: aid('coop', 'mission', 'section_header')
  },
  model: {
    nav: aid('coop', 'model', 'nav'),
    info: aid('coop', 'model', 'info'),
    roadmap_info: aid('coop', 'model', 'roadmap_info'),
    compare_info: aid('coop', 'model', 'compare_info'),
    page_title: aid('coop', 'model', 'page_title'),
    phase_card: aid('coop', 'model', 'phase_card'),
    comparison: aid('coop', 'model', 'comparison'),
    section_header: aid('coop', 'model', 'section_header')
  },
  cost: {
    nav: aid('coop', 'cost', 'nav'),
    info: aid('coop', 'cost', 'info'),
    books_info: aid('coop', 'cost', 'books_info'),
    sim_info: aid('coop', 'cost', 'sim_info'),
    roles_info: aid('coop', 'cost', 'roles_info'),
    page_title: aid('coop', 'cost', 'page_title'),
    slider: aid('coop', 'cost', 'slider'),
    reset: aid('coop', 'cost', 'reset'),
    role_card: aid('coop', 'cost', 'role_card'),
    books: aid('coop', 'cost', 'books'),
    section_header: aid('coop', 'cost', 'section_header')
  },
  manage: {
    info: aid('coop', 'manage', 'info'),
    page_title: aid('coop', 'manage', 'page_title'),
    cancel: aid('coop', 'manage', 'cancel'),
    confirm_cancel: aid('coop', 'manage', 'confirm_cancel'),
    open: aid('coop', 'manage', 'open'),
    /** Opens RevenueCat Customer Center (store subscription manage). */
    customer_center: aid('coop', 'manage', 'customer_center')
  },
  benefits: {
    info: aid('coop', 'benefits', 'info'),
    free_info: aid('coop', 'benefits', 'free_info'),
    unlocks_info: aid('coop', 'benefits', 'unlocks_info'),
    page_title: aid('coop', 'benefits', 'page_title'),
    join: aid('coop', 'benefits', 'join'),
    use_free: aid('coop', 'benefits', 'use_free'),
    open_portal: aid('coop', 'benefits', 'open_portal'),
    hero: aid('coop', 'benefits', 'hero'),
    redeem_open: aid('coop', 'benefits', 'redeem_open'),
    redeem_input: aid('coop', 'benefits', 'redeem_input'),
    redeem_submit: aid('coop', 'benefits', 'redeem_submit'),
    /** Store In-App Purchase method (Apple StoreKit); not the Apple Pay mark */
    apple_pay: aid('coop', 'benefits', 'apple_pay'),
    /** Store In-App Purchase method (Google Play Billing); not the Google Pay mark */
    google_pay: aid('coop', 'benefits', 'google_pay'),
    /** Card via Stripe Checkout (web / Android only) */
    card: aid('coop', 'benefits', 'card'),
    /** In the join sheet: pick the monthly plan before paying */
    plan_monthly: aid('coop', 'benefits', 'plan_monthly'),
    /** In the join sheet: pick the yearly plan (2 months free) before paying */
    plan_yearly: aid('coop', 'benefits', 'plan_yearly'),
    /** Restore App Store / Play purchases onto this Bridger account. */
    restore: aid('coop', 'benefits', 'restore')
  },
  portal: {
    info: aid('coop', 'portal', 'info'),
    page_title: aid('coop', 'portal', 'page_title'),
    hero: aid('coop', 'portal', 'hero'),
    feedback: aid('coop', 'portal', 'feedback'),
    spend_body: aid('coop', 'portal', 'spend_body'),
    shipped_body: aid('coop', 'portal', 'shipped_body'),
    nav_overview: aid('coop', 'portal', 'nav_overview'),
    guide_card: aid('coop', 'portal', 'guide_card'),
    join_cta: aid('coop', 'portal', 'join_cta')
  }
} as const;

// --- Delight layer (gift / global easter eggs) ---
export const DELIGHT = {
  gift: {
    attribution: aid('delight', 'gift', 'attribution'),
    dismiss: aid('delight', 'gift', 'dismiss')
  }
} as const;

// --- Send delight gift sheet (own surface; parent_screen = person) ---
export const SEND_DELIGHT_SHEET = {
  sheet: {
    body: aid('send_delight', 'sheet', 'body'),
    send: aid('send_delight', 'sheet', 'send'),
    cancel: aid('send_delight', 'sheet', 'cancel')
  }
} as const;

// --- Assistant / Billy (opt-in relationship helper; never on default screens) ---
export const ASSISTANT = {
  chat: {
    /** Non-interactive header / title region. */
    header: aid('assistant', 'chat', 'header'),
    /** Message list body (dead_click). */
    transcript: aid('assistant', 'chat', 'transcript'),
    composer: aid('assistant', 'chat', 'composer'),
    send: aid('assistant', 'chat', 'send'),
    voice: aid('assistant', 'chat', 'voice'),
    close: aid('assistant', 'chat', 'close'),
    empty_state: aid('assistant', 'chat', 'empty_state'),
    suggestion: aid('assistant', 'chat', 'suggestion'),
    mark: aid('assistant', 'chat', 'mark'),
    working: aid('assistant', 'chat', 'working')
  },
  proposal: {
    preview: aid('assistant', 'proposal', 'preview'),
    confirm: aid('assistant', 'proposal', 'confirm'),
    cancel: aid('assistant', 'proposal', 'cancel')
  },
  draft: {
    body: aid('assistant', 'draft', 'body'),
    edit: aid('assistant', 'draft', 'edit'),
    approve: aid('assistant', 'draft', 'approve'),
    voice_edit: aid('assistant', 'draft', 'voice_edit'),
    outcome: aid('assistant', 'draft', 'outcome')
  },
  /** One fixed event-template preview before create-event handoff. */
  event: {
    body: aid('assistant', 'event', 'body'),
    approve: aid('assistant', 'event', 'approve')
  },
  /** Capsule that follows you off Home while Billy is live. */
  island: {
    open: aid('assistant', 'island', 'open'),
    mark: aid('assistant', 'island', 'mark'),
    line: aid('assistant', 'island', 'line'),
    /** Stop square while listening: discard the take (no send). */
    stop: aid('assistant', 'island', 'stop')
  },
  activity: {
    row: aid('assistant', 'activity', 'row'),
    undo: aid('assistant', 'activity', 'undo')
  }
} as const;

// --- Admin console (operator surface; first-party, de-identified) ---
export const ADMIN = {
  login: {
    password: aid('admin', 'login', 'password'),
    submit: aid('admin', 'login', 'submit')
  },
  nav: {
    live_quiz: aid('admin', 'nav', 'live_quiz'),
    registry: aid('admin', 'nav', 'registry'),
    activity: aid('admin', 'nav', 'activity'),
    coop: aid('admin', 'nav', 'coop'),
    portal: aid('admin', 'nav', 'portal'),
    members: aid('admin', 'nav', 'members'),
    promo_codes: aid('admin', 'nav', 'promo_codes'),
    home_defaults: aid('admin', 'nav', 'home_defaults'),
    prompts: aid('admin', 'nav', 'prompts'),
    delights: aid('admin', 'nav', 'delights'),
    not_found_hits: aid('admin', 'nav', 'not_found_hits'),
    logout: aid('admin', 'nav', 'logout')
  },
  actions: {
    set_live_quiz: aid('admin', 'actions', 'set_live_quiz'),
    new_quiz: aid('admin', 'actions', 'new_quiz'),
    save_quiz_design: aid('admin', 'actions', 'save_quiz_design'),
    save_activity: aid('admin', 'actions', 'save_activity'),
    toggle_activity: aid('admin', 'actions', 'toggle_activity'),
    publish_announcement: aid('admin', 'actions', 'publish_announcement'),
    save_home_defaults: aid('admin', 'actions', 'save_home_defaults'),
    save_prompts: aid('admin', 'actions', 'save_prompts'),
    toggle_delight: aid('admin', 'actions', 'toggle_delight'),
    new_delight: aid('admin', 'actions', 'new_delight')
  }
} as const;

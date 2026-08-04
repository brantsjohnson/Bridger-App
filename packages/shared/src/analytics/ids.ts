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
    progress_bar: aid('auth', 'welcome', 'progress_bar')
  },
  sign_in: {
    page_title: aid('auth', 'sign_in', 'page_title'),
    google: aid('auth', 'sign_in', 'google'),
    apple: aid('auth', 'sign_in', 'apple'),
    email: aid('auth', 'sign_in', 'email'),
    password: aid('auth', 'sign_in', 'password'),
    submit: aid('auth', 'sign_in', 'submit'),
    switch_to_sign_up: aid('auth', 'sign_in', 'switch_to_sign_up')
  },
  sign_up: {
    page_title: aid('auth', 'sign_up', 'page_title'),
    google: aid('auth', 'sign_up', 'google'),
    apple: aid('auth', 'sign_up', 'apple'),
    email: aid('auth', 'sign_up', 'email'),
    password: aid('auth', 'sign_up', 'password'),
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
    step_title: aid('onboarding', 'chrome', 'step_title')
  },
  privacy: {
    acknowledge: aid('onboarding', 'privacy', 'acknowledge')
  },
  notifications: {
    pref: aid('onboarding', 'notifications', 'pref')
  },
  name: {
    first_input: aid('onboarding', 'name', 'first_input'),
    last_input: aid('onboarding', 'name', 'last_input')
  },
  groups: {
    invite: aid('onboarding', 'groups', 'invite'),
    /** dead — the three tier cards are explanatory, not tappable */
    tier_card: aid('onboarding', 'groups', 'tier_card')
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
  review: {
    row_audience: aid('onboarding', 'review', 'row_audience'),
    set_all: aid('onboarding', 'review', 'set_all')
  },
  coop: {
    join: aid('onboarding', 'coop', 'join'),
    apple_pay: aid('onboarding', 'coop', 'apple_pay'),
    google_pay: aid('onboarding', 'coop', 'google_pay'),
    card: aid('onboarding', 'coop', 'card'),
    use_free: aid('onboarding', 'coop', 'use_free')
  },
  welcome_in: {
    lets_go: aid('onboarding', 'welcome_in', 'lets_go')
  }
} as const;

// --- Floating tab bar (global chrome) ---
export const CHROME = {
  tab_bar: {
    tab_home: aid('chrome', 'tab_bar', 'tab_home'),
    tab_friends: aid('chrome', 'tab_bar', 'tab_friends'),
    tab_messages: aid('chrome', 'tab_bar', 'tab_messages'),
    tab_events: aid('chrome', 'tab_bar', 'tab_events'),
    tab_discover: aid('chrome', 'tab_bar', 'tab_discover')
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
  announcements: {
    carousel: aid('home', 'announcements', 'carousel'),
    card: aid('home', 'announcements', 'card'),
    touch_grass_im_in: aid('home', 'announcements', 'touch_grass_im_in'),
    touch_grass_details: aid('home', 'announcements', 'touch_grass_details'),
    touch_grass_dismiss: aid('home', 'announcements', 'touch_grass_dismiss'),
    quick_check_yes: aid('home', 'announcements', 'quick_check_yes'),
    quick_check_edit: aid('home', 'announcements', 'quick_check_edit'),
    coop_card: aid('home', 'announcements', 'coop_card'),
    coming_up_card: aid('home', 'announcements', 'coming_up_card'),
    section_header: aid('home', 'announcements', 'section_header'),
    info: aid('home', 'announcements', 'info')
  },
  stories_row: {
    your_story: aid('home', 'stories_row', 'your_story'),
    story_tile: aid('home', 'stories_row', 'story_tile'),
    tier_filter: aid('home', 'stories_row', 'tier_filter'),
    add_after_post: aid('home', 'stories_row', 'add_after_post'),
    stories_header: aid('home', 'stories_row', 'stories_header'),
    info: aid('home', 'stories_row', 'info')
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
    info: aid('home', 'notifications_preview', 'info')
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
    section_header: aid('home', 'this_week', 'section_header'),
    info: aid('home', 'this_week', 'info')
  },
  coming_up: {
    section_header: aid('home', 'coming_up', 'section_header'),
    info: aid('home', 'coming_up', 'info')
  },
  activity: {
    section_header: aid('home', 'activity', 'section_header'),
    info: aid('home', 'activity', 'info')
  },
  quiz: {
    section_header: aid('home', 'quiz', 'section_header'),
    info: aid('home', 'quiz', 'info')
  },
  coop: {
    section_header: aid('home', 'coop', 'section_header'),
    info: aid('home', 'coop', 'info')
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
    decline: aid('discover', 'wants_to_connect', 'decline')
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
  discover_me: {
    answer: aid('discover', 'discover_me', 'answer'),
    image_option: aid('discover', 'discover_me', 'image_option'),
    continue: aid('discover', 'discover_me', 'continue')
  },
  // "Connect Over" — the private modules preview at the top of Discover.
  connect_over: {
    // dead: the section title
    section_header: aid('discover', 'connect_over', 'section_header'),
    module_tile: aid('discover', 'connect_over', 'module_tile'),
    see_more: aid('discover', 'connect_over', 'see_more'),
    info: aid('discover', 'connect_over', 'info')
  },
  maps: {
    node: aid('discover', 'maps', 'node'),
    map_toggle: aid('discover', 'maps', 'map_toggle')
  },
  gate: {
    body: aid('discover', 'gate', 'body'),
    get_started: aid('discover', 'gate', 'get_started')
  },
  settings_sheet: {
    discoverable_toggle: aid('discover', 'settings_sheet', 'discoverable_toggle'),
    source_toggle: aid('discover', 'settings_sheet', 'source_toggle'),
    dismiss: aid('discover', 'settings_sheet', 'dismiss')
  }
} as const;

// --- Connect Over (own screen: the full list of private modules) ---
export const CONNECT_OVER = {
  list: {
    // dead: the screen title
    page_title: aid('connect_over', 'list', 'page_title'),
    back: aid('connect_over', 'list', 'back'),
    module_tile: aid('connect_over', 'list', 'module_tile')
  }
} as const;

// --- Friends ---
export const FRIENDS = {
  top_nav: {
    settings_icon: aid('friends', 'top_nav', 'settings_icon'),
    search: aid('friends', 'top_nav', 'search'),
    page_title: aid('friends', 'top_nav', 'page_title'),
    profile_icon: aid('friends', 'top_nav', 'profile_icon'),
    add: aid('friends', 'top_nav', 'add'),
    edit: aid('friends', 'top_nav', 'edit')
  },
  roster: {
    row: aid('friends', 'roster', 'row'),
    drag_handle: aid('friends', 'roster', 'drag_handle'),
    tier_header: aid('friends', 'roster', 'tier_header'),
    birthday_row: aid('friends', 'roster', 'birthday_row'),
    info: aid('friends', 'roster', 'info')
  },
  add_sheet: {
    invite_link: aid('friends', 'add_sheet', 'invite_link'),
    qr: aid('friends', 'add_sheet', 'qr'),
    scan: aid('friends', 'add_sheet', 'scan')
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
    record: aid('friends', 'pod', 'record'),
    submit_question: aid('friends', 'pod', 'submit_question'),
    section_header: aid('friends', 'pod', 'section_header'),
    info: aid('friends', 'pod', 'info')
  }
} as const;

// --- Profile (own) ---
export const PROFILE = {
  tabs: {
    profile: aid('profile', 'tabs', 'profile'),
    stories: aid('profile', 'tabs', 'stories'),
    inside_jokes: aid('profile', 'tabs', 'inside_jokes'),
    bucket_list: aid('profile', 'tabs', 'bucket_list'),
    settings_gear: aid('profile', 'tabs', 'settings_gear')
  },
  header: {
    avatar: aid('profile', 'header', 'avatar'),
    name: aid('profile', 'header', 'name'),
    song: aid('profile', 'header', 'song'),
    overflow: aid('profile', 'header', 'overflow'),
    header_bg: aid('profile', 'header', 'header_bg')
  },
  card: {
    currently: aid('profile', 'card', 'currently'),
    hobbies_widget: aid('profile', 'card', 'hobbies_widget'),
    this_or_that_row: aid('profile', 'card', 'this_or_that_row'),
    places_map: aid('profile', 'card', 'places_map'),
    about_me: aid('profile', 'card', 'about_me'),
    favs: aid('profile', 'card', 'favs'),
    /** empty-state CTAs that open a fill module */
    add_details: aid('profile', 'card', 'add_details'),
    add_hobbies: aid('profile', 'card', 'add_hobbies'),
    add_favs: aid('profile', 'card', 'add_favs'),
    add_places: aid('profile', 'card', 'add_places'),
    take_this_or_that: aid('profile', 'card', 'take_this_or_that'),
    add_module: aid('profile', 'card', 'add_module')
  },
  /** Shared ModuleFlow share-mode audience controls on Profile */
  module: {
    audience_set_all: aid('profile', 'module', 'audience_set_all'),
    audience_row: aid('profile', 'module', 'audience_row'),
    hobby_select: aid('profile', 'module', 'hobby_select')
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
    check_off: aid('profile', 'bucket_list', 'check_off')
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
    blocked_people: aid('profile', 'settings', 'blocked_people')
  },
  top_nav: {
    page_title: aid('profile', 'top_nav', 'page_title'),
    edit: aid('profile', 'top_nav', 'edit'),
    back: aid('profile', 'top_nav', 'back')
  },
  // Friend view of a profile
  about_them: {
    about_me: aid('profile', 'about_them', 'about_me'),
    this_or_that_row: aid('profile', 'about_them', 'this_or_that_row'),
    hobbies_widget: aid('profile', 'about_them', 'hobbies_widget')
  },
  friend_tabs: {
    about_them: aid('profile', 'tabs', 'about_them'),
    in_common: aid('profile', 'tabs', 'in_common'),
    inside_jokes: aid('profile', 'tabs', 'inside_jokes'),
    bucket_list: aid('profile', 'tabs', 'bucket_list')
  },
  actions: {
    message: aid('profile', 'actions', 'message'),
    how_you_met: aid('profile', 'actions', 'how_you_met'),
    private_note: aid('profile', 'actions', 'private_note'),
    overflow: aid('profile', 'actions', 'overflow')
  }
} as const;

// --- Events ---
export const EVENTS = {
  list: {
    tab: aid('events', 'list', 'tab'),
    event_card: aid('events', 'list', 'event_card'),
    page_title: aid('events', 'list', 'page_title'),
    create: aid('events', 'list', 'create'),
    profile_icon: aid('events', 'list', 'profile_icon')
  },
  detail: {
    share: aid('events', 'detail', 'share'),
    copy_link: aid('events', 'detail', 'copy_link'),
    going: aid('events', 'detail', 'going'),
    cant: aid('events', 'detail', 'cant'),
    going_count: aid('events', 'detail', 'going_count'),
    to_meet_count: aid('events', 'detail', 'to_meet_count'),
    map: aid('events', 'detail', 'map'),
    add_to_calendar: aid('events', 'detail', 'add_to_calendar'),
    cover_image: aid('events', 'detail', 'cover_image'),
    assignment_row: aid('events', 'detail', 'assignment_row'),
    back: aid('events', 'detail', 'back')
  },
  host: {
    edit: aid('events', 'host', 'edit'),
    going_count: aid('events', 'host', 'going_count'),
    invited_count: aid('events', 'host', 'invited_count'),
    add_cohost: aid('events', 'host', 'add_cohost'),
    chip_in_edit: aid('events', 'host', 'chip_in_edit'),
    reminders_toggle: aid('events', 'host', 'reminders_toggle')
  },
  touch_grass: {
    send: aid('events', 'touch_grass', 'send'),
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
    info: aid('events', 'community', 'info')
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
    place: aid('create_event', 'details', 'place'),
    address: aid('create_event', 'details', 'address'),
    address_result: aid('create_event', 'details', 'address_result'),
    cohost: aid('create_event', 'details', 'cohost'),
    bring: aid('create_event', 'details', 'bring'),
    chip_in_amount: aid('create_event', 'details', 'chip_in_amount'),
    chip_in_method: aid('create_event', 'details', 'chip_in_method'),
    chip_in_handle: aid('create_event', 'details', 'chip_in_handle'),
    friends_invite_toggle: aid('create_event', 'details', 'friends_invite_toggle')
  },
  invite: {
    search: aid('create_event', 'invite', 'search'),
    invite_row: aid('create_event', 'invite', 'invite_row')
  },
  extras: {
    add_cover: aid('create_event', 'extras', 'add_cover'),
    cover_emoji: aid('create_event', 'extras', 'cover_emoji'),
    add_assignment: aid('create_event', 'extras', 'add_assignment'),
    assignment_row: aid('create_event', 'extras', 'assignment_row'),
    assign_name: aid('create_event', 'extras', 'assign_name'),
    chip_in: aid('create_event', 'extras', 'chip_in')
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
    progress_bar: aid('story', 'viewer', 'progress_bar'),
    author: aid('story', 'viewer', 'author'),
    overflow: aid('story', 'viewer', 'overflow'),
    close: aid('story', 'viewer', 'close'),
    caption_body: aid('story', 'viewer', 'caption_body')
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
    switch_camera: aid('post_composer', 'capture', 'switch_camera')
  },
  caption: {
    type: aid('post_composer', 'caption', 'type'),
    voice_to_text: aid('post_composer', 'caption', 'voice_to_text')
  },
  suggested: {
    suggested_prompt: aid('post_composer', 'suggested', 'suggested_prompt')
  },
  audience: {
    close: aid('post_composer', 'audience', 'close'),
    friends: aid('post_composer', 'audience', 'friends'),
    everyone: aid('post_composer', 'audience', 'everyone'),
    group: aid('post_composer', 'audience', 'group')
  },
  actions: {
    post: aid('post_composer', 'actions', 'post'),
    add_another: aid('post_composer', 'actions', 'add_another'),
    discard: aid('post_composer', 'actions', 'discard')
  }
} as const;

// --- Messages (capped inbox) ---
export const MESSAGES = {
  conversation: {
    bubble: aid('messages', 'conversation', 'bubble'),
    share_contact: aid('messages', 'conversation', 'share_contact'),
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
    edit: aid('messages', 'contact_card', 'edit'),
    field_toggle: aid('messages', 'contact_card', 'field_toggle'),
    share: aid('messages', 'contact_card', 'share'),
    field_row: aid('messages', 'contact_card', 'field_row')
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
    continue: aid('reveal', 'flow', 'continue'),
    see_profile: aid('reveal', 'flow', 'see_profile'),
    /** dead — decorative progress bars */
    progress: aid('reveal', 'flow', 'progress'),
    /** dead — decorative Venn diagram */
    venn: aid('reveal', 'flow', 'venn')
  }
} as const;

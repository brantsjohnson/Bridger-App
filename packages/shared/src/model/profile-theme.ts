// ============================================
// WHAT THIS FILE DOES (plain English):
// How a co-op member restyles their profile. Content stays in attributes;
// this file only stores the skin: theme colors, layout order of movable
// sections, optional decorative widgets, and the viewer's "always original"
// preference. Customization can never delete or hide real facts.
// ============================================
import { Tier } from './tier';

/** Header + tabs stay fixed at the top; customize cannot move them. */
export const ANCHORED_ORDER = ['header', 'tabs'] as const;
export type AnchoredChrome = (typeof ANCHORED_ORDER)[number];

/**
 * Movable content modules in the native Spotify order (PROFILE.md §2).
 * Co-op Layout customize may reorder these; modules with data cannot be removed.
 */
export const MOVABLE_MODULE_ORDER = [
  'mutuals',
  'top5',
  'aboutMe',
  'upcoming',
  'obsession',
  'favorites',
  'hobbies',
  'places',
  'whereMet',
  'recommendations',
  'timeline',
  'greatestHits'
] as const;

export type MovableModule = (typeof MOVABLE_MODULE_ORDER)[number];

/**
 * @deprecated Prefer ANCHORED_ORDER + MOVABLE_MODULE_ORDER. Kept so older
 * customize fixtures that still reference CoreWidget compile during migration.
 */
export const CORE_WIDGET_ORDER = [
  'header',
  'top5',
  'aboutMe',
  'obsession',
  'favorites',
  'hobbies',
  'places',
  'greatestHits'
] as const;

export type CoreWidget = (typeof CORE_WIDGET_ORDER)[number];

export type CustomWidgetType = 'photos' | 'text' | 'quote' | 'pinned' | 'link';

export interface CustomWidget {
  id: string;
  /** the insert slot it sits after (movable module id) */
  afterModule?: MovableModule | CoreWidget;
  /** @deprecated use afterModule — kept so older customize fixtures still typecheck */
  afterCoreWidget?: CoreWidget;
  /** among custom widgets in the same slot */
  order: number;
  type: CustomWidgetType;
  title?: string;
  body?: string;
  emoji?: string;
  visibleToTier: Tier;
}

/**
 * Everything a member can change about how their page LOOKS. Presentation
 * only: it never touches a field or its tier visibility.
 */
export interface ProfileTheme {
  /** a preset background, an uploaded photo, or nothing */
  backgroundId: string | null;
  backgroundUrl?: string;
  /** how much the page sits on top of the photo */
  backgroundVeil: 'clear' | 'soft' | 'heavy';
  /** behind everything when there is no photo */
  pageColor: string;
  /** the cards and panels */
  cardColor: string;
  /** all the words */
  textColor: string;
  /** buttons, pins, highlights */
  accentColor: string;
  font: ProfileFont;
  corners: 'round' | 'soft' | 'square';
  /** light / dark mode for the themed page */
  mode?: 'light' | 'dark';
}

/** No-code layout: order of movable modules only. */
export interface ProfileLayout {
  userId?: string;
  order: MovableModule[];
  decorativeWidgets: CustomWidget[];
}

/** Code-tier CSS/HTML skin (admin-gated; desktop editor). */
export interface ProfileCustomCode {
  userId: string;
  css?: string;
  htmlBlocks?: { slot: string; html: string }[];
  sanitizedAt: string;
  status: 'active' | 'reverted';
}

/** Honest storage meter for co-op media (Settings → Storage & plan). */
export interface StorageMeter {
  userId: string;
  usedBytes: number;
  includedBytes: number;
  overageBytes: number;
}

export type ProfileFont = 'clean' | 'serif' | 'pixel' | 'mono' | 'round';

export const PROFILE_FONT_STACK: Record<ProfileFont, string> = {
  clean: "'Inter', system-ui, sans-serif",
  serif: "'Playfair Display', Georgia, serif",
  pixel: "'Silkscreen', 'Courier New', monospace",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  round: "'Fredoka', 'Trebuchet MS', sans-serif"
};

/** What every profile looks like before anyone touches anything. */
export const DEFAULT_PROFILE_THEME: ProfileTheme = {
  backgroundId: null,
  backgroundVeil: 'soft',
  pageColor: '#FAF8F2',
  cardColor: '#FFFFFF',
  textColor: '#1C1B16',
  accentColor: '#6D3BEB',
  font: 'clean',
  corners: 'round',
  mode: 'light'
};

/** Default native layout order (View original always uses this). */
export const DEFAULT_PROFILE_LAYOUT: ProfileLayout = {
  order: [...MOVABLE_MODULE_ORDER],
  decorativeWidgets: []
};

/** One tap gets you a whole look. Then change any part of it. */
export interface ProfilePreset extends ProfileTheme {
  id: string;
  label: string;
}

export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    ...DEFAULT_PROFILE_THEME,
    id: 'default',
    label: 'Bridger'
  },
  {
    id: 'midnight',
    label: 'Midnight',
    backgroundId: 'stars',
    backgroundUrl: '/966660c5-24c7-4fcd-a65d-13ce87692c09.jpg',
    backgroundVeil: 'clear',
    pageColor: '#0F1A33',
    cardColor: '#1B2947',
    textColor: '#EDF1FB',
    accentColor: '#7FA8FF',
    font: 'mono',
    corners: 'soft',
    mode: 'dark'
  },
  {
    id: 'garden',
    label: 'Garden',
    backgroundId: 'flowers',
    backgroundUrl: '/3ffaae95-1799-465c-87aa-b50ba3a856b8.jpg',
    backgroundVeil: 'soft',
    pageColor: '#FBF3EE',
    cardColor: '#FFFDFB',
    textColor: '#3A2C29',
    accentColor: '#C2547A',
    font: 'serif',
    corners: 'round',
    mode: 'light'
  },
  {
    id: 'arcade',
    label: 'Arcade',
    backgroundId: 'grid',
    backgroundUrl: '/7cd46664-7919-40f1-b50b-85c78d7aadf4.jpg',
    backgroundVeil: 'clear',
    pageColor: '#180F2E',
    cardColor: '#2A1B4D',
    textColor: '#F4EEFF',
    accentColor: '#FF5FD2',
    font: 'pixel',
    corners: 'square',
    mode: 'dark'
  },
  {
    id: 'scrapbook',
    label: 'Scrapbook',
    backgroundId: 'paper',
    backgroundUrl: '/a0f8c065-bb88-49ba-b880-a9183cfed112.jpg',
    backgroundVeil: 'soft',
    pageColor: '#F6F1E6',
    cardColor: '#FFFEFA',
    textColor: '#2B2721',
    accentColor: '#D2691E',
    font: 'round',
    corners: 'soft',
    mode: 'light'
  },
  {
    id: 'dusk',
    label: 'Dusk',
    backgroundId: 'sunset',
    backgroundUrl: '/6450d932-0062-469b-865f-281d36984f1a.jpg',
    backgroundVeil: 'soft',
    pageColor: '#FDF0EC',
    cardColor: '#FFF8F5',
    textColor: '#3B2436',
    accentColor: '#B5537F',
    font: 'clean',
    corners: 'round',
    mode: 'light'
  }
];

/** The background photos anyone can pick, plus their own upload. */
export const PROFILE_BACKGROUNDS: Array<{ id: string; label: string; url: string }> = [
  {
    id: 'stars',
    label: 'Stars',
    url: '/966660c5-24c7-4fcd-a65d-13ce87692c09.jpg'
  },
  {
    id: 'flowers',
    label: 'Flowers',
    url: '/3ffaae95-1799-465c-87aa-b50ba3a856b8.jpg'
  },
  {
    id: 'grid',
    label: 'Grid',
    url: '/7cd46664-7919-40f1-b50b-85c78d7aadf4.jpg'
  },
  {
    id: 'paper',
    label: 'Paper',
    url: '/a0f8c065-bb88-49ba-b880-a9183cfed112.jpg'
  },
  {
    id: 'sunset',
    label: 'Sunset',
    url: '/6450d932-0062-469b-865f-281d36984f1a.jpg'
  }
];

export interface ViewerPref {
  /** a standing "show me the plain version" choice, for accessibility or taste */
  alwaysViewOriginal: boolean;
}

/** True once the page no longer looks like everyone else's. */
export function isCustomized(theme: ProfileTheme, widgets: CustomWidget[]): boolean {
  const d = DEFAULT_PROFILE_THEME;
  return (
    widgets.length > 0 ||
    theme.backgroundId !== d.backgroundId ||
    theme.pageColor !== d.pageColor ||
    theme.cardColor !== d.cardColor ||
    theme.textColor !== d.textColor ||
    theme.accentColor !== d.accentColor ||
    theme.font !== d.font ||
    theme.corners !== d.corners
  );
}

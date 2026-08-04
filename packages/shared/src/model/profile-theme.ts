import { Tier } from './tier';

/**
 * The core widgets render in the same order and the same positions on every
 * profile. This is a CONSTANT, never a per-user field, so the skeleton cannot
 * drift no matter what someone does in the editor.
 */
export const CORE_WIDGET_ORDER = [
'header',
'currently',
'hobbies',
'placesMap',
'thisOrThat',
'aboutMe',
'favs',
'insideJokes'] as
const;

export type CoreWidget = (typeof CORE_WIDGET_ORDER)[number];

export type CustomWidgetType = 'photos' | 'text' | 'quote' | 'pinned' | 'link';

export interface CustomWidget {
  id: string;
  /** the insert slot it sits after */
  afterCoreWidget: CoreWidget;
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
 * only: it never touches a field or its tier visibility, so who-sees-what is
 * identical on the custom page and the original.
 *
 * The point is MySpace-level expression with zero code — a background photo,
 * your own colors, a typeface, corner shape. Not freeform HTML, because that
 * lets people build broken and unreadable pages.
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
  corners: 'round'
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
  backgroundUrl: "/966660c5-24c7-4fcd-a65d-13ce87692c09.jpg",

  backgroundVeil: 'clear',
  pageColor: '#0F1A33',
  cardColor: '#1B2947',
  textColor: '#EDF1FB',
  accentColor: '#7FA8FF',
  font: 'mono',
  corners: 'soft'
},
{
  id: 'garden',
  label: 'Garden',
  backgroundId: 'flowers',
  backgroundUrl: "/3ffaae95-1799-465c-87aa-b50ba3a856b8.jpg",

  backgroundVeil: 'soft',
  pageColor: '#FBF3EE',
  cardColor: '#FFFDFB',
  textColor: '#3A2C29',
  accentColor: '#C2547A',
  font: 'serif',
  corners: 'round'
},
{
  id: 'arcade',
  label: 'Arcade',
  backgroundId: 'grid',
  backgroundUrl: "/7cd46664-7919-40f1-b50b-85c78d7aadf4.jpg",

  backgroundVeil: 'clear',
  pageColor: '#180F2E',
  cardColor: '#2A1B4D',
  textColor: '#F4EEFF',
  accentColor: '#FF5FD2',
  font: 'pixel',
  corners: 'square'
},
{
  id: 'scrapbook',
  label: 'Scrapbook',
  backgroundId: 'paper',
  backgroundUrl: "/a0f8c065-bb88-49ba-b880-a9183cfed112.jpg",

  backgroundVeil: 'soft',
  pageColor: '#F6F1E6',
  cardColor: '#FFFEFA',
  textColor: '#2B2721',
  accentColor: '#D2691E',
  font: 'round',
  corners: 'soft'
},
{
  id: 'dusk',
  label: 'Dusk',
  backgroundId: 'sunset',
  backgroundUrl: "/6450d932-0062-469b-865f-281d36984f1a.jpg",

  backgroundVeil: 'soft',
  pageColor: '#FDF0EC',
  cardColor: '#FFF8F5',
  textColor: '#3B2436',
  accentColor: '#B5537F',
  font: 'clean',
  corners: 'round'
}];


/** The background photos anyone can pick, plus their own upload. */
export const PROFILE_BACKGROUNDS: Array<{id: string;label: string;url: string;}> = [
{
  id: 'stars',
  label: 'Stars',
  url: "/966660c5-24c7-4fcd-a65d-13ce87692c09.jpg"
},
{
  id: 'flowers',
  label: 'Flowers',
  url: "/3ffaae95-1799-465c-87aa-b50ba3a856b8.jpg"
},
{
  id: 'grid',
  label: 'Grid',
  url: "/7cd46664-7919-40f1-b50b-85c78d7aadf4.jpg"
},
{
  id: 'paper',
  label: 'Paper',
  url: "/a0f8c065-bb88-49ba-b880-a9183cfed112.jpg"
},
{
  id: 'sunset',
  label: 'Sunset',
  url: "/6450d932-0062-469b-865f-281d36984f1a.jpg"
}];


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
    theme.corners !== d.corners);

}
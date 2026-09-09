// ============================================
// WHAT THIS FILE DOES (plain English):
// The shapes behind a Scrapbook page (user-facing name for what the code still
// calls a "story"). A page is a portrait 8.5 x 11 sheet. Everything you see on
// it (a photo, a caption, a date stamp) is an "element" with a position given
// as fractions of the page (0 to 1), so the same page draws the same on any
// phone, on web, and later on paper.
//
// This file is platform-neutral: it is compiled into the server too, so no
// React Native imports here.
// ============================================

// THIS SECTION DOES: the two numbers every screen shares. Change them here only.

/** How many photos + videos one person can put on their pages per day. */
export const DAILY_SCRAPBOOK_MEDIA_LIMIT = 4;

/** How many separate pages a day can be split into (one photo per page max). */
export const MAX_SCRAPBOOK_PAGES_PER_DAY = DAILY_SCRAPBOOK_MEDIA_LIMIT;

/** Portrait letter paper. Width divided by height. */
export const SCRAPBOOK_ASPECT_RATIO = 8.5 / 11;

/** Default paper color: the app's eggshell, so a page reads as paper on the dark composer. */
export const SCRAPBOOK_DEFAULT_BACKGROUND = '#F4F1E7';

// THIS SECTION DOES: where a photo came from. Kept so a printed book (or the
// viewer) can tell a live capture from an imported picture later.
export type MediaSource = 'bridger_camera' | 'camera_roll' | 'event' | 'shared';

// THIS SECTION DOES: a box on the page, as fractions of the page size.
export interface NormalizedRect {
  /** 0 = left edge, 1 = right edge */
  x: number;
  /** 0 = top edge, 1 = bottom edge */
  y: number;
  width: number;
  height: number;
}

/** A crop stored as fractions of the ORIGINAL image. The file is never changed. */
export interface CropConfig {
  x: number;
  y: number;
  width: number;
  height: number;
}

// THIS SECTION DOES: every kind of thing that can sit on a page. Phase 1 uses
// photo, video, text, and date. The rest are reserved for later phases so the
// database column never needs to change.
export type ScrapbookElementType =
  | 'photo'
  | 'video'
  | 'text'
  | 'voice'
  | 'person'
  | 'place'
  | 'map'
  | 'sticker'
  | 'cutout'
  | 'clipping'
  | 'frame'
  | 'shape'
  | 'image'
  | 'date'
  | 'event_reference';

/** Only these count toward DAILY_SCRAPBOOK_MEDIA_LIMIT. */
export const MEDIA_ELEMENT_TYPES: ReadonlyArray<ScrapbookElementType> = ['photo', 'video'];

// THIS SECTION DOES: one element on the page.
export interface ScrapbookElement extends NormalizedRect {
  id: string;
  type: ScrapbookElementType;
  /** degrees, clockwise */
  rotation: number;
  /** higher draws on top */
  zIndex: number;
  /** true = auto-layout must not move or resize this one */
  locked?: boolean;
  /** true once the person dragged, resized, or edited it by hand */
  userModified?: boolean;
  /** which template slot this element fills (so re-layout can map it) */
  slot?: number;
  /** for photo / video: where the picture came from */
  source?: MediaSource;
  /** for photo / video / voice: the `media` row id once uploaded */
  mediaId?: string;
  /**
   * Local file uri before upload (phone only), or a signed URL when the page
   * comes back from the API. Never stored in the database.
   */
  uri?: string;
  /** type-specific extras: text, crop, frame style, place data, etc. */
  data: ScrapbookElementData;
}

/** The loose bag of per-type settings. Keep keys snake-free and small. */
export interface ScrapbookElementData {
  /** text / date: what it says */
  text?: string;
  /** text: placeholder shown when text is empty (caption slot) */
  placeholder?: string;
  /** photo / video: non-destructive crop */
  crop?: CropConfig;
  /** photo: visual frame preset id (polaroid, thin, none) */
  frame?: 'none' | 'polaroid' | 'thin';
  /** video: length in ms once known */
  durationMs?: number;
  /** text: which font role to use */
  font?: 'sans' | 'pixel' | 'hand';
  /** text: size preset */
  size?: 'sm' | 'md' | 'lg';
  /** text: horizontal alignment */
  align?: 'left' | 'center' | 'right';
  /** any: hex color for text or shape */
  color?: string;
  [key: string]: unknown;
}

// THIS SECTION DOES: how the paper looks behind the elements.
export interface BackgroundConfig {
  kind: 'solid' | 'paper';
  /** solid: hex color */
  color?: string;
  /** paper: preset id (kraft, notebook, grid) */
  preset?: string;
}

/** The five ways a page can be arranged. Re-layout stays inside a family. */
export type LayoutFamily = 'simple' | 'caption' | 'editorial' | 'scrapbook' | 'freeform';

export const LAYOUT_FAMILIES: ReadonlyArray<LayoutFamily> = [
  'simple',
  'caption',
  'editorial',
  'scrapbook',
  'freeform'
];

// THIS SECTION DOES: one page. `revision` goes up every time the author changes
// it after posting, so friends' rings can light again.
export interface ScrapbookPage {
  id: string;
  /** the `stories` row this page belongs to (undefined while drafting) */
  storyId?: string;
  aspectRatio: number;
  background: BackgroundConfig;
  layoutId?: string;
  layoutFamily?: LayoutFamily;
  elements: ScrapbookElement[];
  revision: number;
}

/** Count the photos + videos on a page (the only things that use the daily limit). */
export function countMediaElements(page: Pick<ScrapbookPage, 'elements'>): number {
  return page.elements.filter((e) => MEDIA_ELEMENT_TYPES.includes(e.type)).length;
}

/** True when any element on the page is a video (co-op only to post). */
export function pageHasVideo(page: Pick<ScrapbookPage, 'elements'>): boolean {
  return page.elements.some((e) => e.type === 'video');
}

/** Elements sorted for drawing (lowest z first). */
export function sortedElements(page: Pick<ScrapbookPage, 'elements'>): ScrapbookElement[] {
  return [...page.elements].sort((a, b) => a.zIndex - b.zIndex);
}

// THIS SECTION DOES: a page as it travels over the wire. Same shape as
// ScrapbookPage; media elements carry a signed `uri` from the API.
export type ScrapbookPageDto = ScrapbookPage;

/** Who can see a page. `only_me` maps to DB tier `none` (owner only). */
export type ScrapbookAudience = 'only_me' | 'close' | 'friend' | 'everyone';

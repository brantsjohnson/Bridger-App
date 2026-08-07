// ============================================
// WHAT THIS FILE DOES (plain English):
// Spacing numbers for the Spotify-artist profile layout. Bridger keeps its
// own colors and components; these tokens copy the Valley-style breathing
// room (big gaps between sections, tight groups inside cards). Every profile
// section must import from here instead of inventing one-off padding.
// ============================================

/** Horizontal inset for all section content (Spotify ~16–20). */
export const PROFILE_GUTTER = 16;

/** Vertical gap between major sections (Popular → Artist pick feel). */
export const PROFILE_SECTION_GAP = 16;

/** Larger gap before lower blocks (Featuring → Music videos feel). */
export const PROFILE_SECTION_GAP_LG = 24;

/** Name/action block → tab underline row. */
export const PROFILE_HEADER_TO_TABS = 24;

/** Tab row → first content section (Mutuals). */
export const PROFILE_TABS_TO_CONTENT = 16;

/** Section title → first row/card under it. */
export const PROFILE_TITLE_TO_BODY = 12;

/** Between Top 5 rows / release-style rows. */
export const PROFILE_ROW_GAP = 16;

/** Between 2-up Favorites / Obsession squares. */
export const PROFILE_GRID_GAP = 12;

/** Title ↔ subtitle inside a card (tight grouping). */
export const PROFILE_META_GAP = 4;

/** Story tile · tier pill · search row. */
export const PROFILE_ACTION_ROW_GAP = 8;

/** Full-bleed hero height as a fraction of screen width (square bleed). */
export const PROFILE_HERO_ASPECT = 1;

/** Artist-title name size (pixel font). */
export const PROFILE_NAME_SIZE = 28;

/** Quiet city line under the name. */
export const PROFILE_CITY_SIZE = 14;

/** Bridger pixel section titles. */
export const PROFILE_SECTION_TITLE_SIZE = 18;

/** "See all" pill label. */
export const PROFILE_SEE_ALL_SIZE = 13;

/** Compact story cover in the action row (Home-style proportions, smaller). */
export const PROFILE_STORY_TILE_W = 56;
export const PROFILE_STORY_TILE_H = 72;

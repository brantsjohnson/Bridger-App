// ============================================
// WHAT THIS FILE DOES (plain English):
// The design values every Bridger component shares, straight from DESIGN.md and
// the Magic Patterns blueprint. Two shapes live here:
//
//  1. Tailwind CLASS tokens (ACCENTS, METAL_BEVEL) — ready-made class-name
//     bundles so a component just says ACCENTS['coral'].bg instead of
//     re-typing colors. This is how we deliver the playful accent palette and
//     the 90s-metallic button look consistently everywhere.
//
//  2. Raw COLOR values (THEME, ACCENT_HEX) — actual hex codes for the few
//     places code needs a real color instead of a class name, chiefly icons
//     (lucide icons take a color prop, not a class). THEME also lets us pick the
//     right light/dark color for those icons via the useThemeColors() hook.
//
// If you change a brand color, change it in BOTH here and tailwind.config.js.
// ============================================
import { useColorScheme } from 'react-native';
import type { Accent } from '@bridger/shared';

export type { Accent };

export const ACCENT_KEYS: Accent[] = [
  'purple',
  'coral',
  'teal',
  'amber',
  'pink',
  'blue',
  'green'
];

/** Raw accent hex codes — for icons/charts that need a real color, not a class. */
export const ACCENT_HEX: Record<Accent, string> = {
  purple: '#6B2FEA',
  coral: '#FF5A1F',
  teal: '#00A676',
  amber: '#FFB515',
  pink: '#FF3E8A',
  blue: '#1D6FE8',
  green: '#5FBF3A'
};

type AccentToken = {
  label: string;
  hex: string;
  /** solid vivid fill */
  bg: string;
  /** translucent wash — fine over a solid surface */
  tint: string;
  /** fully opaque pale fill — safe anywhere */
  tintSolid: string;
  /** legible text color to sit on the solid fill */
  text: string;
};

/**
 * The accent palette as ready-to-use class bundles. `text` is chosen so labels
 * stay legible on each vivid fill (dark ink on light-ish accents, white on deep
 * ones), matching the Magic Patterns blueprint.
 */
/**
 * tintSolid includes a dark: twin. Dark twins stay pastel-enough that
 * text-onaccent (near-black) still reads, while looking intentional on the
 * near-black canvas — not a bright white wash with light gray type.
 */
export const ACCENTS: Record<Accent, AccentToken> = {
  purple: { label: 'Purple', hex: '#6B2FEA', bg: 'bg-purple', tint: 'bg-purple/15', tintSolid: 'bg-[#D5C2FF] dark:bg-[#C4B0F5]', text: 'text-white' },
  coral: { label: 'Coral', hex: '#FF5A1F', bg: 'bg-coral', tint: 'bg-coral/20', tintSolid: 'bg-[#FFC7AC] dark:bg-[#E8A888]', text: 'text-onaccent' },
  teal: { label: 'Teal', hex: '#00A676', bg: 'bg-teal', tint: 'bg-teal/15', tintSolid: 'bg-[#9FE7CE] dark:bg-[#7BC4AC]', text: 'text-onaccent' },
  amber: { label: 'Amber', hex: '#FFB515', bg: 'bg-amber', tint: 'bg-amber/20', tintSolid: 'bg-[#FFDE99] dark:bg-[#E8C56A]', text: 'text-onaccent' },
  pink: { label: 'Pink', hex: '#FF3E8A', bg: 'bg-pink', tint: 'bg-pink/20', tintSolid: 'bg-[#FFC0D7] dark:bg-[#E89AB8]', text: 'text-white' },
  blue: { label: 'Blue', hex: '#1D6FE8', bg: 'bg-blue', tint: 'bg-blue/15', tintSolid: 'bg-[#BBD6FB] dark:bg-[#8EB4E8]', text: 'text-white' },
  green: { label: 'Green', hex: '#5FBF3A', bg: 'bg-green', tint: 'bg-green/20', tintSolid: 'bg-[#CDECB6] dark:bg-[#A8D090]', text: 'text-onaccent' }
};

/**
 * The metallic treatment: SQUARE (never rounded), light top/left + dark
 * bottom/right borders make the classic old-computer bevel. Borders only, no
 * shadow. Reserved for primary CTAs. (DESIGN.md §Buttons.)
 */
export const METAL_BEVEL =
  'rounded-none bg-metal-face border-2 border-t-metal-hi border-l-metal-hi border-b-metal-lo border-r-metal-lo';

/** The pressed-in version of the bevel — highlights and shadows swap sides. */
export const METAL_BEVEL_PRESSED =
  'rounded-none bg-[#D3D1C7] border-2 border-t-metal-lo border-l-metal-lo border-b-metal-hi border-r-metal-hi';

export type ThemeColors = {
  canvas: string;
  surface: string;
  ink: string;
  inkSoft: string;
  inkMute: string;
  inkLine: string;
  metalFace: string;
  metalHi: string;
  metalLo: string;
  carbon: string;
};

/**
 * Raw theme colors for both modes. Use these (via useThemeColors) for icon
 * `color` props, which cannot take a Tailwind class. Values mirror the CSS
 * variables in global.css so icons match the surfaces around them.
 */
export const THEME: { light: ThemeColors; dark: ThemeColors } = {
  light: {
    canvas: '#FAF8F2',
    surface: '#FFFFFF',
    ink: '#1C1B16',
    inkSoft: '#4A483F',
    inkMute: '#8A877B',
    inkLine: '#E4E2DA',
    metalFace: '#DEDCD2',
    metalHi: '#FFFFFF',
    metalLo: '#A7A498',
    carbon: '#151515'
  },
  dark: {
    canvas: '#0E0E0E',
    surface: '#1A1A1B',
    ink: '#F2F0EA',
    // bumped vs pure mid-gray so captions stay readable on near-black
    inkSoft: '#C6C4BC',
    inkMute: '#A8A69E',
    inkLine: '#373738',
    metalFace: '#3A3A38',
    metalHi: '#646460',
    metalLo: '#181816',
    carbon: '#080808'
  }
};

/** Returns the right color set for the current light/dark mode (for icons). */
export function useThemeColors(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === 'dark' ? THEME.dark : THEME.light;
}

/** Card corner radii per DESIGN.md (chips/buttons use pill radius). */
export const RADIUS = {
  card: 20,
  cardLg: 24,
  pill: 999
} as const;

/**
 * Magic Patterns "organic" card corners — uneven top-left / top-right so cards
 * feel hand-cut, not generic. Use as a React Native `style` prop (NativeWind
 * cannot express four different corner radii the way CSS can).
 *
 * soft   = 26 / 10 / 26 / 10  — announcements, quick check
 * bold   = 28 / 10 / 28 / 10  — activity half, "Create a poll"
 * flip   = 10 / 28 / 10 / 28  — quiz half, "Ask a question" (opposite lean)
 * banner = 40 / 16 / 40 / 16  — weekly activity full-width banner
 */
/**
 * Magic Patterns "blob" shapes for hobby chips — each chip gets one of six
 * uneven pill outlines so the wall feels hand-made. Style objects because
 * NativeWind cannot express four different radii in one class.
 */
export const BLOB_SHAPES = [
  { borderTopLeftRadius: 38, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderBottomLeftRadius: 38 },
  { borderTopLeftRadius: 999, borderTopRightRadius: 38, borderBottomRightRadius: 38, borderBottomLeftRadius: 999 },
  { borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomRightRadius: 44, borderBottomLeftRadius: 999 },
  { borderTopLeftRadius: 44, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderBottomLeftRadius: 999 },
  { borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderBottomLeftRadius: 999 },
  { borderTopLeftRadius: 56, borderTopRightRadius: 40, borderBottomRightRadius: 56, borderBottomLeftRadius: 40 }
] as const;

/**
 * Messages inbox card shapes — the OUTLINE of a conversation row tells you its
 * status at a glance, so you can scan the inbox without reading:
 *   • needsReply — they messaged last and the ball is in your court. Squared
 *     top-left corner, rounded everywhere else (leans toward you).
 *   • replied — you already answered; you're waiting on them. Squared
 *     bottom-right corner, rounded everywhere else (leans away, the mirror).
 *   • maxed — you've used all 5 messages for today with this friend. A fully
 *     rounded pill on both sides, so a "done for today" thread looks closed.
 */
export const MESSAGE_SHAPES = {
  needsReply: { borderTopLeftRadius: 44, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderBottomLeftRadius: 999 },
  replied: { borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomRightRadius: 44, borderBottomLeftRadius: 999 },
  maxed: { borderTopLeftRadius: 999, borderTopRightRadius: 999, borderBottomRightRadius: 999, borderBottomLeftRadius: 999 }
} as const;

export type MessageCardState = keyof typeof MESSAGE_SHAPES;

/**
 * TIER COLORS — how close someone is, shown as a color instead of a label.
 * Used for the ring around a story tile and for message cards, so the same
 * person reads the same color everywhere in the app:
 *   me           yellow  (your own update)
 *   close        green
 *   friend       blue
 *   acquaintance orange
 *
 * `strong` is the normal, vivid pair. `soft` is the same color lightened — it
 * means "nothing needed from you right now" (in Messages: you already replied
 * and are waiting on them).
 */
export type RingTone = 'me' | 'close' | 'friend' | 'acquaintance';

/**
 * Turn a friendship tier into a ring color. 'none' (someone you have not
 * placed in a circle yet) gets the loosest color rather than no color at all,
 * so a tile never renders ringless.
 */
export function ringToneForTier(tier: 'close' | 'friend' | 'acquaintance' | 'none'): RingTone {
  return tier === 'none' ? 'acquaintance' : tier;
}

export const TIER_GRADIENT: Record<RingTone, { strong: [string, string]; soft: [string, string] }> = {
  me: { strong: ['#FFD84A', '#FF9F1C'], soft: ['#FFEFB8', '#FFD98F'] },
  close: { strong: ['#8FE05C', '#2FA85B'], soft: ['#DDF3C6', '#B2E0A0'] },
  friend: { strong: ['#5AA0FF', '#1D6FE8'], soft: ['#CFE1FC', '#A6C4F2'] },
  acquaintance: { strong: ['#FFB05B', '#FF5A1F'], soft: ['#FFDCC4', '#FFBE9B'] }
};

export const ORGANIC = {
  soft: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 26,
    borderBottomLeftRadius: 10
  },
  bold: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 10,
    borderBottomRightRadius: 28,
    borderBottomLeftRadius: 10
  },
  flip: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 28,
    borderBottomRightRadius: 10,
    borderBottomLeftRadius: 28
  },
  banner: {
    borderTopLeftRadius: 40,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 40,
    borderBottomLeftRadius: 16
  }
} as const;

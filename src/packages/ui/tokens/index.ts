import { twMerge } from 'tailwind-merge';
import { Accent } from '../../shared';

export function cn(...classes: Array<string | false | null | undefined>): string {
  return twMerge(classes.filter(Boolean).join(' '));
}

export const CANVAS = {
  light: '#FFFFFF',
  dark: '#0E0E0E',
  ink: '#1C1B16'
};

export const METAL = {
  face: '#DEDCD2',
  hi: '#FFFFFF',
  lo: '#A7A498'
};

type AccentToken = {
  label: string;
  hex: string;
  bg: string;
  /** translucent wash — fine over solid surfaces */
  tint: string;
  /** fully opaque pale fill — use anywhere the grid must not show through */
  tintSolid: string;
  text: string;
};

export const ACCENTS: Record<Accent, AccentToken> = {
  purple: { label: 'Purple', hex: '#6B2FEA', bg: 'bg-purple', tint: 'bg-purple/15', tintSolid: 'bg-[#D5C2FF]', text: 'text-white' },
  coral: { label: 'Coral', hex: '#FF5A1F', bg: 'bg-coral', tint: 'bg-coral/20', tintSolid: 'bg-[#FFC7AC]', text: 'text-onaccent' },
  teal: { label: 'Teal', hex: '#00A676', bg: 'bg-teal', tint: 'bg-teal/15', tintSolid: 'bg-[#9FE7CE]', text: 'text-onaccent' },
  amber: { label: 'Amber', hex: '#FFB515', bg: 'bg-amber', tint: 'bg-amber/20', tintSolid: 'bg-[#FFDE99]', text: 'text-onaccent' },
  pink: { label: 'Pink', hex: '#FF3E8A', bg: 'bg-pink', tint: 'bg-pink/20', tintSolid: 'bg-[#FFC0D7]', text: 'text-white' },
  blue: { label: 'Blue', hex: '#1D6FE8', bg: 'bg-blue', tint: 'bg-blue/15', tintSolid: 'bg-[#BBD6FB]', text: 'text-white' },
  green: { label: 'Green', hex: '#5FBF3A', bg: 'bg-green', tint: 'bg-green/20', tintSolid: 'bg-[#CDECB6]', text: 'text-onaccent' }
};

/** Playful hover wash — hovers are colored, never a transparent grey. */
export const HOVER_WASH = 'hover:bg-[#F1ECFF]';

export const ACCENT_KEYS = Object.keys(ACCENTS) as Accent[];

/** Organic blob silhouettes for interest selectors. */
export const BLOBS = [
'rounded-[38px_999px_999px_38px]',
'rounded-[999px_38px_38px_999px]',
'rounded-[999px_999px_44px_999px]',
'rounded-[44px_999px_999px_999px]',
'rounded-[999px]',
'rounded-[56px_40px_56px_40px]'] as
const;

/**
 * The metallic treatment: SQUARE (never rounded), light top/left, dark bottom/right.
 * Borders only — no shadow. Reserved for primary CTAs and old-Windows chrome.
 */
export const METAL_BEVEL =
'rounded-none bg-metal-face border-2 border-t-metal-hi border-l-metal-hi border-b-metal-lo border-r-metal-lo text-ink';

export const METAL_BEVEL_PRESSED =
'rounded-none bg-[#D3D1C7] border-2 border-t-metal-lo border-l-metal-lo border-b-metal-hi border-r-metal-hi text-ink';
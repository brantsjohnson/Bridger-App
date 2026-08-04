// ============================================
// WHAT THIS FILE DOES (plain English):
// This is Bridger's design system, written as Tailwind settings. NativeWind
// reads it so we can style React Native screens (iOS, Android, web) with the
// SAME class names the Magic Patterns designs use — so the app matches the
// designs pixel-for-pixel.
//
// Two kinds of colors live here:
//  1. "Themed" colors (canvas, surface, ink, metal) point at CSS variables that
//     live in global.css. Those variables flip automatically in dark mode, so a
//     class like "bg-canvas" is eggshell in light mode and near-black in dark
//     without us writing two versions.
//  2. "Accent" colors (purple, coral, teal…) are fixed brand hues that stay
//     vivid in both light and dark, per DESIGN.md.
//
// Fonts: "pixel" is the retro header font (section titles only); "sans" is the
// clean body font. Never use pixel for body copy (DESIGN.md rule).
// "content" tells NativeWind which files to scan for class names.
// ============================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  // Web needs 'class' — NativeWind's media mode throws on Expo web when the
  // runtime tries to sync the document color scheme. Theme colors still flip
  // via prefers-color-scheme CSS variables in global.css.
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // --- The calm canvas + the white containers that sit on it ---
        canvas: {
          DEFAULT: 'rgb(var(--canvas) / <alpha-value>)',
          raised: 'rgb(var(--surface) / <alpha-value>)',
          dark: '#0E0E0E'
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        // --- Text + hairlines: ink is near-black, softer greys, and the line color ---
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          mute: 'rgb(var(--ink-mute) / <alpha-value>)',
          line: 'rgb(var(--ink-line) / <alpha-value>)'
        },
        // --- The 90s-metallic primary button surface + its bevel highlights ---
        metal: {
          face: 'rgb(var(--metal-face) / <alpha-value>)',
          hi: 'rgb(var(--metal-hi) / <alpha-value>)',
          lo: 'rgb(var(--metal-lo) / <alpha-value>)',
          edge: '#5F5D55'
        },
        // --- Always-dark text used on top of vivid accent fills (never flips) ---
        onaccent: '#1C1B16',
        // --- Always-dark panel (now-playing / pod player) ---
        carbon: 'rgb(var(--carbon) / <alpha-value>)',
        // --- The playful accent palette (cards, chips, selected states) ---
        purple: '#6B2FEA',
        coral: '#FF5A1F',
        teal: '#00A676',
        amber: '#FFB515',
        pink: '#FF3E8A',
        blue: '#1D6FE8',
        green: '#5FBF3A',
        success: { DEFAULT: '#2FA85B', soft: '#BEEBCD' }
      },
      // --- Fonts. React Native needs a separate family per weight, so body copy
      //     has explicit weight families (sans, sans-md, sans-sb, sans-b, sans-xb).
      //     "pixel" is the single retro header font. ---
      fontFamily: {
        sans: ['PlusJakartaSans_400Regular', 'system-ui', 'sans-serif'],
        'sans-md': ['PlusJakartaSans_500Medium'],
        'sans-sb': ['PlusJakartaSans_600SemiBold'],
        'sans-b': ['PlusJakartaSans_700Bold'],
        'sans-xb': ['PlusJakartaSans_800ExtraBold'],
        pixel: ['FeloniaPixel', 'Courier New', 'monospace']
      },
      borderRadius: {
        card: '20px',
        '3xl': '24px'
      }
    }
  },
  plugins: []
};

// ============================================
// WHAT THIS FILE DOES (plain English):
// Defines Bridger's Tailwind theme for the app — the exact brand colors from
// DESIGN.md (eggshell canvas, the accent palette, the metallic button colors).
// NativeWind reads this so we can style React Native screens with the same
// Tailwind class names the Magic Patterns designs use. "content" tells it which
// files to scan for class names (our app + the shared UI package).
// ============================================
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}'
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // The calm canvas that makes colorful elements pop.
        canvas: { light: '#F4F1E7', dark: '#0E0E0E' },
        ink: '#1C1B16',
        // The 90s-metallic primary button surface + bevel.
        metal: { face: '#DEDCD2', hi: '#FFFFFF', lo: '#A7A498' },
        // The playful accent palette (cards, chips, selected states).
        purple: '#7F77DD',
        coral: '#F0997B',
        teal: '#1D9E75',
        amber: '#EF9F27',
        pink: '#ED93B1',
        blue: '#378ADD',
        green: '#97C459'
      },
      borderRadius: {
        card: '16px',
        cardlg: '24px'
      }
    }
  },
  plugins: []
};

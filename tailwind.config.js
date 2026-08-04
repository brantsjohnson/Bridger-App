/** @type {import('tailwindcss').Config} */
export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Themed tokens — values live in index.css and flip under `.dark`.
        canvas: {
          DEFAULT: 'rgb(var(--canvas) / <alpha-value>)',
          raised: 'rgb(var(--surface) / <alpha-value>)',
          dark: '#0E0E0E',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        ink: {
          DEFAULT: 'rgb(var(--ink) / <alpha-value>)',
          soft: 'rgb(var(--ink-soft) / <alpha-value>)',
          mute: 'rgb(var(--ink-mute) / <alpha-value>)',
          line: 'rgb(var(--ink-line) / <alpha-value>)',
        },
        metal: {
          face: 'rgb(var(--metal-face) / <alpha-value>)',
          hi: 'rgb(var(--metal-hi) / <alpha-value>)',
          lo: 'rgb(var(--metal-lo) / <alpha-value>)',
          edge: '#5F5D55',
        },
        /** Always-dark text for vivid accent fills — never flips. */
        onaccent: '#1C1B16',
        /** Always-dark panel (now-playing, pod player) — never flips. */
        carbon: 'rgb(var(--carbon) / <alpha-value>)',
        purple: '#6B2FEA',
        coral: '#FF5A1F',
        teal: '#00A676',
        amber: '#FFB515',
        pink: '#FF3E8A',
        blue: '#1D6FE8',
        green: '#5FBF3A',
        success: {
          DEFAULT: '#2FA85B',
          soft: '#BEEBCD',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        pixel: ['"Felonia Pixel"', '"Courier New"', 'monospace'],
      },
      borderRadius: {
        card: '20px',
        '3xl': '24px',
      },
      keyframes: {
        drift: {
          '0%': { transform: 'translate3d(0, 0, 0)' },
          '100%': { transform: 'translate3d(0, -80px, 0)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translate3d(0, 10px, 0)' },
          '100%': { opacity: '1', transform: 'translate3d(0, 0, 0)' },
        },
      },
      animation: {
        drift: 'drift 18s linear infinite',
        rise: 'rise 420ms cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}

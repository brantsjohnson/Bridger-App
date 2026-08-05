// ============================================
// WHAT THIS FILE DOES (plain English):
// Tailwind setup for the admin console. Pulls Bridger color tokens into the
// theme so pages can use classes like bg-canvas and text-ink.
// ============================================
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: '#F4F1E7',
        ink: '#1C1B16',
        metal: {
          face: '#DEDCD2',
          hi: '#FFFFFF',
          lo: '#A7A498'
        },
        surface: '#FFFFFF',
        line: '#D9D4C8',
        muted: '#6B665A',
        danger: '#B42318',
        ok: '#1D9E75',
        accent: {
          purple: '#7F77DD',
          coral: '#F0997B',
          teal: '#1D9E75',
          amber: '#EF9F27',
          pink: '#ED93B1',
          blue: '#378ADD',
          green: '#97C459'
        }
      },
      fontFamily: {
        pixel: ['"Pixelify Sans"', 'monospace'],
        sans: [
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif'
        ]
      },
      borderRadius: {
        card: '16px',
        pill: '9999px'
      },
      minHeight: {
        tap: '44px'
      },
      minWidth: {
        tap: '44px'
      }
    }
  },
  plugins: []
};

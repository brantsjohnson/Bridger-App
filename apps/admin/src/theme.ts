// ============================================
// WHAT THIS FILE DOES (plain English):
// Color and type tokens for the admin console. Matches guide-docs/DESIGN.md
// so the back office feels like Bridger, not a generic dashboard.
// ============================================

export const theme = {
  canvas: '#F4F1E7',
  ink: '#1C1B16',
  surface: '#FFFFFF',
  line: '#D9D4C8',
  muted: '#6B665A',
  danger: '#B42318',
  ok: '#1D9E75',
  metal: {
    face: '#DEDCD2',
    hi: '#FFFFFF',
    lo: '#A7A498'
  },
  accent: {
    purple: '#7F77DD',
    coral: '#F0997B',
    teal: '#1D9E75',
    amber: '#EF9F27',
    pink: '#ED93B1',
    blue: '#378ADD',
    green: '#97C459'
  },
  font: {
    pixel: '"Pixelify Sans", monospace',
    body: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif'
  },
  radius: {
    card: '16px',
    pill: '9999px'
  }
} as const;

export type Theme = typeof theme;

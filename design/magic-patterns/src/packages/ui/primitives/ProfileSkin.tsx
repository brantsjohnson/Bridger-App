import React from 'react';
import {
  PROFILE_FONT_STACK,
  ProfileTheme } from
'../../shared/model/profile-theme';
import { cn } from '../tokens';

/** '#6D3BEB' → '109 59 235', the shape the theme tokens want. */
function channels(hex: string): string {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  return `${n >> 16 & 255} ${n >> 8 & 255} ${n & 255}`;
}

/** Mix a color toward white or black by `amount`, for derived text tones. */
function mix(hex: string, toward: 'white' | 'black', amount: number): string {
  const [r, g, b] = channels(hex).split(' ').map(Number);
  const t = toward === 'white' ? 255 : 0;
  const f = (c: number) => Math.round(c + (t - c) * amount);
  return `${f(r)} ${f(g)} ${f(b)}`;
}

function isDark(hex: string): boolean {
  const [r, g, b] = channels(hex).split(' ').map(Number);
  return (r * 299 + g * 587 + b * 114) / 1000 < 140;
}

const VEIL: Record<ProfileTheme['backgroundVeil'], number> = {
  clear: 0,
  soft: 0.45,
  heavy: 0.8
};

const CORNERS: Record<ProfileTheme['corners'], string> = {
  round: '20px',
  soft: '10px',
  square: '2px'
};

/**
 * Wraps a profile in its owner's look. It works by overriding the same theme
 * tokens the whole design system already reads, so every card, border and bit
 * of text inside re-skins itself with no component changes. Presentation only.
 */
export function ProfileSkin({
  theme,
  active = true,
  fill = false,
  children,
  className








}: {theme: ProfileTheme; /** false renders the plain original */active?: boolean; /** the skin owns a whole screen rather than sitting inside one */fill?: boolean;children: React.ReactNode;className?: string;}) {
  if (!active) return <>{children}</>;

  const dark = isDark(theme.pageColor);
  const ink = channels(theme.textColor);

  const style = {
    '--canvas': channels(theme.pageColor),
    '--surface': channels(theme.cardColor),
    '--ink': ink,
    '--ink-soft': mix(theme.textColor, dark ? 'black' : 'white', 0.25),
    '--ink-mute': mix(theme.textColor, dark ? 'black' : 'white', 0.5),
    '--ink-line': mix(theme.textColor, dark ? 'white' : 'black', 0.86),
    '--profile-accent': channels(theme.accentColor),
    '--profile-font': PROFILE_FONT_STACK[theme.font],
    '--profile-corners': CORNERS[theme.corners]
  } as React.CSSProperties;

  return (
    /*
     * `isolate` matters: it makes this element its own stacking context, so the
     * background layer below paints behind the profile and NOT behind the app
     * canvas. Without it the page's own background covers the skin entirely.
     */
    <div
      className={cn('profile-skin relative isolate', className)}
      style={{ ...style, backgroundColor: theme.pageColor }}>
      
      {theme.backgroundUrl &&
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
          <img
          src={theme.backgroundUrl}
          alt=""
          className="h-full w-full object-cover"
          /* a slow load must never flash the wrong page color */
          loading="eager" />
        
          <div
          className="absolute inset-0"
          style={{
            backgroundColor: theme.pageColor,
            opacity: VEIL[theme.backgroundVeil]
          }} />
        
        </div>
      }
      <div className={cn('relative z-10', fill && 'flex h-full flex-col')}>{children}</div>
    </div>);

}
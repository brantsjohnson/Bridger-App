// ============================================
// WHAT THIS FILE DOES (plain English):
// Remembers the signed-in person's grid-line tint (the color they picked in
// onboarding) so every Screen can paint SynthGrid with it. Default is the
// classic light purple until settings load.
// ============================================
import React, { useCallback, useMemo, useState } from 'react';

/** Classic Bridger purple used when no personal color is set (light canvas). */
export const DEFAULT_GRID_COLOR = 'rgba(127, 119, 221, 0.5)';

type GridColorContextValue = {
  /** Line color passed into SynthGrid (rgba or hex). */
  gridColor: string;
  /** Set from settings after auth (hex #RRGGBB or null to reset). */
  setGridColorHex: (hex: string | null) => void;
};

const GridColorContext = React.createContext<GridColorContextValue>({
  gridColor: DEFAULT_GRID_COLOR,
  setGridColorHex: () => undefined
});

/**
 * Turn #RRGGBB into a soft rgba line. SynthGrid boosts alpha further in dark
 * mode so the grid still shows on a near-black canvas.
 */
export function hexToGridLine(hex: string): string {
  const raw = hex.trim().replace(/^#/, '');
  if (!/^[0-9A-Fa-f]{6}$/.test(raw)) return DEFAULT_GRID_COLOR;
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, 0.55)`;
}

export function GridColorProvider({ children }: { children: React.ReactNode }) {
  const [gridColor, setGridColor] = useState(DEFAULT_GRID_COLOR);

  // THIS SECTION DOES: accept a hex from settings (or clear back to default).
  const setGridColorHex = useCallback((hex: string | null) => {
    if (!hex || !hex.trim()) {
      setGridColor(DEFAULT_GRID_COLOR);
      return;
    }
    setGridColor(hexToGridLine(hex));
  }, []);

  const value = useMemo(
    () => ({ gridColor, setGridColorHex }),
    [gridColor, setGridColorHex]
  );

  return (
    <GridColorContext.Provider value={value}>{children}</GridColorContext.Provider>
  );
}

/** Read the current grid line color + setter (used by Screen and the app root). */
export function useGridColor(): GridColorContextValue {
  return React.useContext(GridColorContext);
}

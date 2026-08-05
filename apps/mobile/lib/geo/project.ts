// ============================================
// WHAT THIS FILE DOES (plain English):
// Turns real lat/lng into SVG coordinates for the Places traveled world map.
// Equirectangular projection only — no live GPS, no map SDK. Also loads the
// bundled country outlines once and builds SVG path strings for each ISO code.
// ============================================

type LngLat = [number, number];

type GeoJsonGeometry =
  | { type: 'Polygon'; coordinates: LngLat[][] }
  | { type: 'MultiPolygon'; coordinates: LngLat[][][] };

type CountryFeature = {
  type: 'Feature';
  properties: { ISO_A2?: string; iso_a2?: string; ISO_A2_EH?: string; NAME?: string };
  geometry: GeoJsonGeometry;
};

type CountryCollection = {
  type: 'FeatureCollection';
  features: CountryFeature[];
};

/** SVG viewBox size used by WorldMapSvg (keep in sync with the component). */
export const MAP_VB = { w: 360, h: 180 } as const;

export type CountryPath = {
  /** ISO 3166-1 alpha-2 */
  code: string;
  name: string;
  /** SVG path `d` in viewBox space */
  d: string;
};

/** Equirectangular: lng -180..180 → x, lat 90..-90 → y */
export function projectLngLat(lng: number, lat: number): { x: number; y: number } {
  return {
    x: ((lng + 180) / 360) * MAP_VB.w,
    y: ((90 - lat) / 180) * MAP_VB.h
  };
}

/** Build SVG path `d` from a GeoJSON Polygon or MultiPolygon ([lng, lat] rings). */
export function geometryToPath(geometry: GeoJsonGeometry): string {
  const rings: LngLat[][] =
    geometry.type === 'Polygon'
      ? geometry.coordinates
      : geometry.coordinates.flatMap((poly) => poly);

  const parts: string[] = [];
  for (const ring of rings) {
    if (!ring.length) continue;
    const pts = ring.map(([lng, lat]) => projectLngLat(lng, lat));
    const [first, ...rest] = pts;
    let d = `M${round(first.x)} ${round(first.y)}`;
    for (const p of rest) {
      d += `L${round(p.x)} ${round(p.y)}`;
    }
    d += 'Z';
    parts.push(d);
  }
  return parts.join('');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

function normalizeCode(raw: unknown): string | null {
  const code = String(raw ?? '')
    .trim()
    .toUpperCase();
  if (!code || code === '-99' || code.length !== 2) return null;
  return code;
}

let cachedPaths: CountryPath[] | null = null;
let cachedCodes: Set<string> | null = null;

/** Load + normalize the bundled GeoJSON once. */
export function getCountryPaths(): CountryPath[] {
  if (cachedPaths) return cachedPaths;

  // Bundled Natural Earth 110m countries (slim ISO_A2 + geometry only).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const data = require('../../assets/geo/countries-110m.json') as CountryCollection;
  const out: CountryPath[] = [];

  for (const f of data.features ?? []) {
    const p = f.properties ?? {};
    const code = normalizeCode(p.ISO_A2 ?? p.ISO_A2_EH ?? p.iso_a2);
    if (!code || !f.geometry) continue;
    const d = geometryToPath(f.geometry);
    if (!d) continue;
    out.push({ code, name: p.NAME ?? code, d });
  }

  cachedPaths = out;
  cachedCodes = new Set(out.map((c) => c.code));
  return cachedPaths;
}

/** Set of ISO codes present in the asset (for validating Photon country codes). */
export function knownCountryCodes(): Set<string> {
  if (!cachedCodes) getCountryPaths();
  return cachedCodes ?? new Set();
}

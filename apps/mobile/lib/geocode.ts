// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared place lookup for Create event addresses, onboarding's favorite place,
// and the Places traveled module. Talks to Photon (Komoot / OpenStreetMap),
// with Nominatim as a fallback when Photon is blocked or offline.
//
// PRIVACY: the query text goes only to Photon/OSM to find a place. We never
// attach your name or account. Never log the query string to analytics.
// ============================================

export type GeocodeHit = {
  /** Short label for UI + TravelPlace.label (city or place name) */
  label: string;
  /** Longer line for secondary text if needed */
  displayName: string;
  lat: number;
  lng: number;
  /** ISO 3166-1 alpha-2 when the geocoder provides it; may be '' */
  countryCode: string;
  countryName?: string;
  /** Region / state when the geocoder provides it (e.g. "District of Columbia") */
  state?: string;
  /**
   * What kind of place this is. Used to prefer cities/countries over hotels
   * and stations when someone is picking a favorite trip.
   */
  kind?: 'city' | 'town' | 'state' | 'country' | 'other';
};

/** Options for searchPlaces. Onboarding passes layers so hotels do not crowd cities. */
export type SearchPlacesOptions = {
  /**
   * Photon layers to keep (city, country, state, …). When set, the request
   * asks Photon for those layers only so results stay map-pin friendly.
   */
  layers?: Array<'city' | 'locality' | 'district' | 'county' | 'state' | 'country'>;
};

/**
 * Turn a 2-letter country code (DE, US, …) into that country's flag emoji.
 * Uses the regional-indicator letters so 🇩🇪 comes from "DE". Returns '' if
 * the code is missing or not two letters.
 */
export function countryCodeToFlagEmoji(countryCode: string): string {
  const cc = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return '';
  // A → 🇦 (U+1F1E6), B → 🇧, …
  const A = 0x1f1e6;
  return String.fromCodePoint(
    ...[...cc].map((ch) => A + (ch.charCodeAt(0) - 65))
  );
}

/**
 * One clear line for a pick list: city + state + country so "Washington, DC"
 * does not look the same as Washington state or Washington, Texas.
 */
export function formatPlaceTitle(h: GeocodeHit): string {
  const state = shortenState(h.state);
  const parts: string[] = [];
  if (h.label) parts.push(h.label);
  // Skip state when it repeats the label (e.g. picking the state "Washington").
  if (state && state.toLowerCase() !== h.label.toLowerCase()) parts.push(state);
  if (h.countryName && h.countryName.toLowerCase() !== h.label.toLowerCase()) {
    parts.push(h.countryName);
  }
  if (parts.length > 0) return parts.join(', ');
  return h.displayName || h.label;
}

/** "District of Columbia" → "DC" so the row stays short and recognizable. */
function shortenState(state?: string): string | undefined {
  if (!state) return undefined;
  const s = state.trim();
  if (/^district of columbia$/i.test(s)) return 'DC';
  return s;
}

type PhotonFeature = {
  geometry?: { coordinates?: [number, number] };
  properties?: {
    name?: string;
    street?: string;
    housenumber?: string;
    city?: string;
    state?: string;
    country?: string;
    countrycode?: string;
    postcode?: string;
    district?: string;
    locality?: string;
    type?: string;
    osm_value?: string;
    osm_key?: string;
  };
};

/** Map Photon's type / osm_value onto our coarse kind bucket. */
function photonKind(p: PhotonFeature['properties']): GeocodeHit['kind'] {
  const t = String(p?.type ?? p?.osm_value ?? '').toLowerCase();
  if (t === 'country') return 'country';
  if (t === 'state') return 'state';
  if (t === 'city') return 'city';
  if (t === 'town' || t === 'village' || t === 'hamlet' || t === 'locality') return 'town';
  return 'other';
}

/** Build a hit from Photon's structured fields. */
function formatPhoton(f: PhotonFeature): GeocodeHit | null {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  if (!coords) return null;
  const [lon, lat] = coords;
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const street = [p.housenumber, p.street].filter(Boolean).join(' ').trim();
  const parts = [
    street || p.name,
    p.locality || p.city || p.district,
    p.state,
    p.country
  ].filter(Boolean) as string[];
  const unique: string[] = [];
  for (const part of parts) {
    if (unique[unique.length - 1] !== part) unique.push(part);
  }
  if (unique.length === 0) return null;

  const code = String(p.countrycode ?? '')
    .trim()
    .toUpperCase();

  return {
    displayName: unique.join(', '),
    label: p.name || street || unique[0],
    lat,
    lng: lon,
    countryCode: code.length === 2 ? code : '',
    countryName: p.country,
    state: p.state || undefined,
    kind: photonKind(p)
  };
}

/**
 * Search places by free text. Prefer Photon; fall back to Nominatim.
 * Pass an AbortSignal from the UI debounce so stale requests drop out.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal,
  options?: SearchPlacesOptions
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const layerQuery = (options?.layers ?? [])
    .map((layer) => `&layer=${encodeURIComponent(layer)}`)
    .join('');

  try {
    const photonUrl =
      'https://photon.komoot.io/api/?limit=8&lang=en&q=' +
      encodeURIComponent(q) +
      layerQuery;
    const res = await fetch(photonUrl, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'BridgerApp/0.1 (place lookup)'
      },
      signal
    });
    if (!res.ok) throw new Error('photon failed');
    const data = (await res.json()) as { features?: PhotonFeature[] };
    const mapped = (data.features ?? [])
      .map(formatPhoton)
      .filter((r): r is GeocodeHit => !!r);
    return rankHits(dedupeHits(mapped));
  } catch (err) {
    if (signal?.aborted) return [];
    // Fallback: Nominatim structured search if Photon is blocked/offline.
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BridgerApp/0.1 (place lookup)'
        },
        signal
      });
      const data = (await res.json()) as Array<{
        display_name: string;
        name?: string;
        lat: string;
        lon: string;
        type?: string;
        class?: string;
        address?: {
          country_code?: string;
          country?: string;
          state?: string;
          city?: string;
          town?: string;
        };
      }>;
      const mapped = (Array.isArray(data) ? data : [])
        .map((r) => {
          const code = String(r.address?.country_code ?? '')
            .trim()
            .toUpperCase();
          const type = String(r.type ?? '').toLowerCase();
          let kind: GeocodeHit['kind'] = 'other';
          if (type === 'country') kind = 'country';
          else if (type === 'state') kind = 'state';
          else if (type === 'city' || type === 'administrative') kind = 'city';
          else if (type === 'town' || type === 'village') kind = 'town';
          return {
            displayName: r.display_name,
            label: r.name?.trim() || r.display_name.split(',')[0].trim(),
            lat: Number(r.lat),
            lng: Number(r.lon),
            countryCode: code.length === 2 ? code : '',
            countryName: r.address?.country,
            state: r.address?.state || undefined,
            kind
          } satisfies GeocodeHit;
        })
        .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
      return rankHits(dedupeHits(mapped));
    } catch {
      if (signal?.aborted) return [];
      return [];
    }
  }
}

function dedupeHits(hits: GeocodeHit[]): GeocodeHit[] {
  const seen = new Set<string>();
  return hits.filter((r) => {
    // Key on coords + label + state so Washington DC and Washington state both stay.
    const key = `${r.label}|${r.state ?? ''}|${r.countryCode}|${r.lat.toFixed(2)}|${r.lng.toFixed(2)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Cities and countries first; hotels / stations sink to the bottom. */
function rankHits(hits: GeocodeHit[]): GeocodeHit[] {
  const weight = (k: GeocodeHit['kind']) => {
    if (k === 'city') return 0;
    if (k === 'town') return 1;
    if (k === 'state') return 2;
    if (k === 'country') return 3;
    return 4;
  };
  return [...hits].sort((a, b) => weight(a.kind) - weight(b.kind));
}

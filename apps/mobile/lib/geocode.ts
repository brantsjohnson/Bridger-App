// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared place lookup for Create event addresses and the Places traveled
// module. Talks to Photon (Komoot / OpenStreetMap), with Nominatim as a
// fallback when Photon is blocked or offline.
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
};

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
  };
};

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
    p.postcode,
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
    countryName: p.country
  };
}

/**
 * Search places by free text. Prefer Photon; fall back to Nominatim.
 * Pass an AbortSignal from the UI debounce so stale requests drop out.
 */
export async function searchPlaces(
  query: string,
  signal?: AbortSignal
): Promise<GeocodeHit[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  try {
    const photonUrl =
      'https://photon.komoot.io/api/?limit=8&lang=en&q=' + encodeURIComponent(q);
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
    return dedupeHits(mapped);
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
        address?: { country_code?: string; country?: string };
      }>;
      const mapped = (Array.isArray(data) ? data : []).map((r) => {
        const code = String(r.address?.country_code ?? '')
          .trim()
          .toUpperCase();
        return {
          displayName: r.display_name,
          label: r.name?.trim() || r.display_name.split(',')[0].trim(),
          lat: Number(r.lat),
          lng: Number(r.lon),
          countryCode: code.length === 2 ? code : '',
          countryName: r.address?.country
        } satisfies GeocodeHit;
      }).filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lng));
      return dedupeHits(mapped);
    } catch {
      if (signal?.aborted) return [];
      return [];
    }
  }
}

function dedupeHits(hits: GeocodeHit[]): GeocodeHit[] {
  const seen = new Set<string>();
  return hits.filter((r) => {
    if (seen.has(r.displayName)) return false;
    seen.add(r.displayName);
    return true;
  });
}

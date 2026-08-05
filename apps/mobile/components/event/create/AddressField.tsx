// ============================================
// WHAT THIS FILE DOES (plain English):
// The address box on the Create-event Details step. As you type, it looks up
// places with Photon (Komoot) — a free OpenStreetMap geocoder built for
// autocomplete and fuzzy matching, so you do not need a perfect spelling.
// Tapping a match fills the full address and a short place name. If you are
// offline or nothing matches, you can still type the address by hand.
//
// PRIVACY: the text you type is sent only to Photon/OSM to find the event's
// venue. We never attach your name or account. No lookup text is logged to
// analytics (we only record that a result was picked).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { MapPinIcon } from 'lucide-react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';

/** One suggestion from Photon (or Nominatim fallback). */
type PlaceResult = {
  display_name: string;
  name: string;
  lat: string;
  lon: string;
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
    postcode?: string;
    district?: string;
    locality?: string;
  };
};

/** Build a readable address line from Photon's structured fields. */
function formatPhoton(f: PhotonFeature): PlaceResult | null {
  const p = f.properties ?? {};
  const coords = f.geometry?.coordinates;
  if (!coords) return null;
  const [lon, lat] = coords;
  const street = [p.housenumber, p.street].filter(Boolean).join(' ').trim();
  const parts = [
    street || p.name,
    p.locality || p.city || p.district,
    p.state,
    p.postcode,
    p.country
  ].filter(Boolean) as string[];
  // Dedupe consecutive identical chunks (name sometimes equals street).
  const unique: string[] = [];
  for (const part of parts) {
    if (unique[unique.length - 1] !== part) unique.push(part);
  }
  if (unique.length === 0) return null;
  return {
    display_name: unique.join(', '),
    name: p.name || street || unique[0],
    lat: String(lat),
    lon: String(lon)
  };
}

export function AddressField({
  address,
  onChangeAddress,
  onPickPlace
}: {
  address: string;
  onChangeAddress: (value: string) => void;
  /** called with a short place label when a suggestion is chosen */
  onPickPlace: (place: string) => void;
}) {
  const c = useThemeColors();
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Set true once a suggestion is tapped, so we don't immediately re-search it.
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    const q = address.trim();
    // Start suggesting after 2 characters so partial place names work.
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(() => {
      void search(q);
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [address]);

  async function search(q: string) {
    setLoading(true);
    try {
      // Photon is better at autocomplete / typos than raw Nominatim search.
      const photonUrl =
        'https://photon.komoot.io/api/?limit=8&lang=en&q=' + encodeURIComponent(q);
      const res = await fetch(photonUrl, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'BridgerApp/0.1 (event address lookup)'
        }
      });
      if (!res.ok) throw new Error('photon failed');
      const data = (await res.json()) as { features?: PhotonFeature[] };
      const mapped = (data.features ?? [])
        .map(formatPhoton)
        .filter((r): r is PlaceResult => !!r);
      // Drop exact duplicate display lines.
      const seen = new Set<string>();
      const unique = mapped.filter((r) => {
        if (seen.has(r.display_name)) return false;
        seen.add(r.display_name);
        return true;
      });
      setResults(unique);
      setOpen(unique.length > 0);
    } catch {
      // Fallback: Nominatim structured search if Photon is blocked/offline.
      try {
        const url =
          'https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=8&q=' +
          encodeURIComponent(q);
        const res = await fetch(url, {
          headers: {
            Accept: 'application/json',
            'User-Agent': 'BridgerApp/0.1 (event address lookup)'
          }
        });
        const data = (await res.json()) as {
          display_name: string;
          name?: string;
          lat: string;
          lon: string;
        }[];
        const mapped = (Array.isArray(data) ? data : []).map((r) => ({
          display_name: r.display_name,
          name: r.name?.trim() || r.display_name.split(',')[0].trim(),
          lat: r.lat,
          lon: r.lon
        }));
        setResults(mapped);
        setOpen(mapped.length > 0);
      } catch {
        setResults([]);
        setOpen(false);
      }
    } finally {
      setLoading(false);
    }
  }

  function pick(r: PlaceResult) {
    justPicked.current = true;
    onChangeAddress(r.display_name);
    onPickPlace(r.name);
    setResults([]);
    setOpen(false);
  }

  return (
    <View className="w-full">
      <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Address</Text>
      <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-ink-line bg-canvas-raised px-4">
        <MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />
        <TextInput
          value={address}
          onChangeText={onChangeAddress}
          placeholder="Park, cafe, street — typos are ok"
          placeholderTextColor={c.inkMute}
          accessibilityLabel="Address"
          className="min-w-0 flex-1 font-sans-sb text-[14px] text-ink"
          style={{ padding: 0 }}
        />
        {loading ? <ActivityIndicator size="small" color={c.inkMute} /> : null}
      </View>

      {open && results.length > 0 ? (
        <View className="mt-1.5 overflow-hidden rounded-2xl border border-ink-line bg-surface">
          {results.map((r, i) => (
            <Pressable
              key={`${r.lat}-${r.lon}-${i}`}
              onPress={withAnalyticsPress(CREATE_EVENT.details.address_result, () => pick(r))}
              accessibilityRole="button"
              accessibilityLabel={r.display_name}
              className="border-b border-ink-line px-4 py-3 last:border-b-0 active:bg-[#F1ECFF]"
            >
              <Text numberOfLines={2} className="font-sans-sb text-[13px] leading-snug text-ink">
                {r.display_name}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text className="mt-1.5 font-sans-md text-[11px] text-ink-mute">
        Only people going or invited can see the address. You can also type it by hand.
      </Text>
    </View>
  );
}

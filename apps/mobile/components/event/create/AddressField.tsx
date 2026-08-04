// ============================================
// WHAT THIS FILE DOES (plain English):
// The address box on the Create-event Details step. As you type, it looks up
// real addresses from OpenStreetMap (free, no API key) and shows a dropdown of
// matches. Tapping one fills in the full address and a short place name. If
// you are offline or nothing matches, you can just type the address by hand.
//
// PRIVACY: the text you type is sent to OpenStreetMap only to find the event's
// location (the host's own venue). We never send it anywhere else, and we do
// not attach your name or account to the lookup. No lookup text is logged to
// analytics (we only record that a result was picked).
// ============================================
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';
import { MapPinIcon } from 'lucide-react-native';
import { CREATE_EVENT } from '@bridger/shared';
import { useThemeColors, withAnalyticsPress } from '@bridger/ui';

// One suggestion coming back from OpenStreetMap.
type OsmResult = {
  display_name: string;
  name?: string;
  lat: string;
  lon: string;
};

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
  const [results, setResults] = useState<OsmResult[]>([]);
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
    if (q.length < 3) {
      setResults([]);
      setOpen(false);
      return;
    }
    // Wait until typing pauses, then ask OpenStreetMap for matches.
    debounce.current = setTimeout(() => {
      void search(q);
    }, 400);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [address]);

  async function search(q: string) {
    setLoading(true);
    try {
      const url =
        'https://nominatim.openstreetmap.org/search?format=json&addressdetails=0&limit=5&q=' +
        encodeURIComponent(q);
      const res = await fetch(url, {
        headers: {
          Accept: 'application/json',
          // Identify the app per OpenStreetMap's usage policy.
          'User-Agent': 'BridgerApp/0.1 (event address lookup)'
        }
      });
      const data = (await res.json()) as OsmResult[];
      setResults(Array.isArray(data) ? data : []);
      setOpen(true);
    } catch {
      // Offline or blocked: fall back to plain manual entry, no dropdown.
      setResults([]);
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  function pick(r: OsmResult) {
    justPicked.current = true;
    onChangeAddress(r.display_name);
    // Short label = the first comma-separated chunk (e.g. "Rowan Park").
    onPickPlace(r.name?.trim() || r.display_name.split(',')[0].trim());
    setResults([]);
    setOpen(false);
  }

  return (
    <View className="w-full">
      <Text className="mb-1.5 font-sans-b text-[12px] text-ink-soft">Address</Text>
      <View className="rounded-2xl border border-ink-line bg-canvas-raised px-4 h-12 flex-row items-center gap-2">
        <MapPinIcon size={16} color={c.inkMute} strokeWidth={2.4} />
        <TextInput
          value={address}
          onChangeText={onChangeAddress}
          placeholder="Start typing an address"
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
        Only people going or invited can see the address.
      </Text>
    </View>
  );
}

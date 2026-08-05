// ============================================
// WHAT THIS FILE DOES (plain English):
// The address box on the Create-event Details step. As you type, it looks up
// places with Photon (Komoot) via the shared geocode helper. Tapping a match
// fills the full address and a short place name. If you are offline or nothing
// matches, you can still type the address by hand.
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
import { searchPlaces, type GeocodeHit } from '../../../lib/geocode';

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
  const [results, setResults] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);
  // Set true once a suggestion is tapped, so we don't immediately re-search it.
  const justPicked = useRef(false);

  useEffect(() => {
    if (justPicked.current) {
      justPicked.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    abort.current?.abort();
    const q = address.trim();
    // Start suggesting after 2 characters so partial place names work.
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounce.current = setTimeout(() => {
      void runSearch(q);
    }, 280);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      abort.current?.abort();
    };
  }, [address]);

  async function runSearch(q: string) {
    setLoading(true);
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    try {
      const hits = await searchPlaces(q, controller.signal);
      if (controller.signal.aborted) return;
      setResults(hits);
      setOpen(hits.length > 0);
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }

  function pick(r: GeocodeHit) {
    justPicked.current = true;
    onChangeAddress(r.displayName);
    onPickPlace(r.label);
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
              key={`${r.lat}-${r.lng}-${i}`}
              onPress={withAnalyticsPress(CREATE_EVENT.details.address_result, () => pick(r))}
              accessibilityRole="button"
              accessibilityLabel={r.displayName}
              className="border-b border-ink-line px-4 py-3 last:border-b-0 active:opacity-80"
            >
              <Text numberOfLines={2} className="font-sans-sb text-[13px] leading-snug text-ink">
                {r.displayName}
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

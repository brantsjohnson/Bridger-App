// ============================================
// WHAT THIS FILE DOES (plain English):
// The onboarding "favorite place" control: a small world map plus a search box.
// You type a city or country, pick a result, and a FAV pin lands on that
// country. Same geocoder as Places traveled on the profile. Never logs what
// you typed (PRIVACY).
// ============================================
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View
} from 'react-native';
import { ONBOARDING, trackUi } from '@bridger/shared';
import { withAnalyticsPress } from '@bridger/ui';
import type { GeocodeHit } from '../../lib/geocode';
import { searchPlaces } from '../../lib/geocode';
import type { TravelPlace } from '../../data/profile';
import { WorldMapSvg } from '../profile/WorldMapSvg';
import { OB, OB_BORDER } from './onboarding-theme';

/**
 * Map + search for the favorite trip. Hometown / current town stay as plain
 * text fields on PlacesStep; this is only the Places traveled seed.
 */
export function OnboardingPlacePicker({
  hit,
  onPick
}: {
  hit: GeocodeHit | null;
  onPick: (next: GeocodeHit | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abort = useRef<AbortController | null>(null);

  // THIS SECTION DOES: look up places after a short pause. Prefer hits that
  // carry a country code so the map can fill that country.
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    abort.current?.abort();
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setError(false);
      return;
    }
    debounce.current = setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(false);
        abort.current?.abort();
        const controller = new AbortController();
        abort.current = controller;
        try {
          const results = await searchPlaces(q, controller.signal);
          if (controller.signal.aborted) return;
          setHits(results.filter((r) => r.countryCode.length === 2));
        } catch {
          if (!controller.signal.aborted) {
            setHits([]);
            setError(true);
          }
        } finally {
          if (!controller.signal.aborted) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
      abort.current?.abort();
    };
  }, [query]);

  // Preview place for the map when we have a pick.
  const previewPlaces: TravelPlace[] = useMemo(() => {
    if (!hit) return [];
    return [
      {
        id: 'onb-fav-preview',
        label: hit.label,
        note: 'Favorite place',
        lat: hit.lat,
        lng: hit.lng,
        countryCode: hit.countryCode.toUpperCase(),
        emoji: '⭐',
        favorite: true
      }
    ];
  }, [hit]);

  const tagged = previewPlaces
    .map((p) => p.countryCode)
    .filter((c): c is string => !!c && c.length === 2);

  const pick = (next: GeocodeHit) => {
    onPick({
      ...next,
      countryCode: next.countryCode.toUpperCase()
    });
    setQuery('');
    setHits([]);
  };

  return (
    <View style={{ gap: 10 }}>
      <Text
        className="font-sans-sb text-[13px]"
        style={{ letterSpacing: 0.4, color: OB.navy }}
      >
        Favorite place you've visited
      </Text>
      <Text className="font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
        Search a city or country · pins your Places traveled map
      </Text>

      {/* THIS SECTION DOES: live map preview. Empty until a place is picked. */}
      <WorldMapSvg
        taggedCountryCodes={tagged}
        places={previewPlaces}
        activeId={previewPlaces[0]?.id ?? null}
        onPinPress={() => {}}
        height={168}
        pinAnalyticsId={ONBOARDING.taste.favorite_place_input}
      />

      {hit ? (
        <View
          style={{
            backgroundColor: OB.paper,
            borderWidth: OB_BORDER,
            borderColor: OB.green,
            paddingHorizontal: 14,
            paddingVertical: 12,
            gap: 2
          }}
        >
          <Text className="font-sans-b text-[15px]" style={{ color: OB.ink }}>
            {hit.label}
          </Text>
          <Text className="font-sans-sb text-[12px]" style={{ color: OB.inkSoft }}>
            Selected · search again to change
          </Text>
        </View>
      ) : null}

      {/* THIS SECTION DOES: the search box (navy outline like OBField). */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: OB.paper,
          borderWidth: OB_BORDER,
          borderColor: OB.navy,
          paddingHorizontal: 14,
          minHeight: 52
        }}
      >
        <TextInput
          value={query}
          onChangeText={setQuery}
          onFocus={() => {
            trackUi('focus', ONBOARDING.taste.place_search);
            trackUi('focus', ONBOARDING.taste.favorite_place_input);
          }}
          placeholder="Search a city or country"
          placeholderTextColor="rgba(0,0,0,0.35)"
          accessibilityLabel="Favorite place you've visited"
          accessibilityHint="Searches for a place to pin on your map"
          autoCapitalize="words"
          style={{
            flex: 1,
            fontSize: 17,
            color: OB.ink,
            paddingVertical: 14,
            minHeight: 52
          }}
        />
        {loading ? <ActivityIndicator size="small" color={OB.navy} /> : null}
      </View>

      {error ? (
        <Text className="font-sans-sb text-[13px]" style={{ color: OB.inkSoft }}>
          Couldn't look that up. Check your connection and try again.
        </Text>
      ) : null}

      {hits.length > 0 ? (
        <View
          style={{
            overflow: 'hidden',
            backgroundColor: OB.paper,
            borderWidth: OB_BORDER,
            borderColor: OB.navy
          }}
        >
          {hits.map((h, i) => (
            <Pressable
              key={`${h.lat}-${h.lng}-${i}`}
              onPress={withAnalyticsPress(ONBOARDING.taste.place_result, () =>
                pick(h)
              )}
              accessibilityRole="button"
              accessibilityLabel={`${h.label}${h.countryName ? `, ${h.countryName}` : ''}`}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 12,
                borderBottomWidth: i < hits.length - 1 ? OB_BORDER : 0,
                borderBottomColor: OB.borderMuted
              }}
            >
              <Text className="font-sans-b text-[14px]" style={{ color: OB.ink }}>
                {h.label}
              </Text>
              {h.countryName || h.displayName ? (
                <Text
                  numberOfLines={1}
                  className="mt-0.5 font-sans-sb text-[12px]"
                  style={{ color: OB.inkSoft }}
                >
                  {h.countryName ?? h.displayName}
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

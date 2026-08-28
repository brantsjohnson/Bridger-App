// ============================================
// WHAT THIS FILE DOES (plain English):
// The onboarding "favorite place" control: a search box (with a magnifying
// glass), a clear list of places to tap, then a small world map that shows the
// FAV pin. You type a city or country, tap a match, and the pin lands on that
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
import { ChevronRightIcon, MapPinIcon, SearchIcon } from 'lucide-react-native';
import { ONBOARDING, trackUi } from '@bridger/shared';
import { AnalyticsRegion, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import type { GeocodeHit } from '../../lib/geocode';
import { searchPlaces } from '../../lib/geocode';
import type { TravelPlace } from '../../data/profile';
import { WorldMapSvg } from '../profile/WorldMapSvg';
import { useOnboardingBodyScroll } from './OnboardingStep';
import { OB, OB_BORDER } from './onboarding-theme';

/** One clear line for a hit so city + country read as one choice. */
function hitTitle(h: GeocodeHit): string {
  if (h.countryName && h.label && h.label !== h.countryName) {
    return `${h.label}, ${h.countryName}`;
  }
  return h.displayName || h.label;
}

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
  // Anchor used to scroll this block above the keyboard when you tap in.
  const searchBlockRef = useRef<View>(null);
  const { ensureVisible } = useOnboardingBodyScroll();
  // Labels outside the white search box follow theme ink on the dark canvas.
  const theme = useThemeColors();

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

  // When matches appear, keep the search + list above the keyboard.
  useEffect(() => {
    if (hits.length === 0) return;
    ensureVisible(searchBlockRef.current);
  }, [hits.length, ensureVisible]);

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
        style={{ letterSpacing: 0.4, color: theme.ink }}
      >
        Favorite place you've visited
      </Text>
      <Text className="font-sans-sb text-[12px]" style={{ color: theme.inkSoft }}>
        Search a city or country · pins your Places traveled map
      </Text>

      {/* THIS SECTION DOES: search first (above the map) so the keyboard never
          hides the box under a tall map. Magnifying glass marks it as search. */}
      <View ref={searchBlockRef} style={{ gap: 8 }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            backgroundColor: OB.paper,
            borderWidth: OB_BORDER,
            borderColor: OB.navy,
            paddingHorizontal: 14,
            minHeight: 52
          }}
        >
          <View accessible={false} importantForAccessibility="no">
            <SearchIcon size={18} color={OB.navy} strokeWidth={2.4} />
          </View>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => {
              trackUi('focus', ONBOARDING.taste.place_search);
              trackUi('focus', ONBOARDING.taste.favorite_place_input);
              ensureVisible(searchBlockRef.current);
            }}
            placeholder="Search a city or country"
            placeholderTextColor="rgba(0,0,0,0.35)"
            accessibilityLabel="Favorite place you've visited"
            accessibilityHint="Searches for a place to pin on your map. Tap a match below to choose it."
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
          <Text className="font-sans-sb text-[13px]" style={{ color: theme.inkSoft }}>
            Couldn't look that up. Check your connection and try again.
          </Text>
        ) : null}

        {/* THIS SECTION DOES: matches as obvious tappable choices (not a quiet
            subtitle that looks like extra info under the search box). */}
        {hits.length > 0 ? (
          <View style={{ gap: 8 }}>
            <AnalyticsRegion analyticsId={ONBOARDING.taste.place_pick_hint} interactive={false}>
              <Text
                className="font-sans-sb text-[12px]"
                style={{ letterSpacing: 0.3, color: theme.ink }}
              >
                Tap a place to pin it
              </Text>
            </AnalyticsRegion>
            {hits.map((h, i) => {
              const title = hitTitle(h);
              return (
                <Pressable
                  key={`${h.lat}-${h.lng}-${i}`}
                  onPress={withAnalyticsPress(ONBOARDING.taste.place_result, () =>
                    pick(h)
                  )}
                  accessibilityRole="button"
                  accessibilityLabel={`Choose ${title}`}
                  accessibilityHint="Pins this place on your map"
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: pressed ? OB.periwinkle : OB.paper,
                    borderWidth: OB_BORDER,
                    borderColor: OB.navy,
                    paddingHorizontal: 14,
                    paddingVertical: 14,
                    minHeight: 52
                  })}
                >
                  <MapPinIcon size={18} color={OB.blue} strokeWidth={2.4} />
                  <Text
                    className="min-w-0 flex-1 font-sans-b text-[15px]"
                    style={{ color: OB.ink }}
                    numberOfLines={2}
                  >
                    {title}
                  </Text>
                  <Text
                    className="font-sans-sb text-[13px]"
                    style={{ color: OB.blue }}
                  >
                    Choose
                  </Text>
                  <ChevronRightIcon size={18} color={OB.blue} strokeWidth={2.6} />
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

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

      {/* THIS SECTION DOES: live map preview under the search. Empty until picked. */}
      <WorldMapSvg
        taggedCountryCodes={tagged}
        places={previewPlaces}
        activeId={previewPlaces[0]?.id ?? null}
        onPinPress={() => {}}
        height={168}
        pinAnalyticsId={ONBOARDING.taste.favorite_place_input}
      />
    </View>
  );
}

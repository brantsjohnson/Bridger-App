// ============================================
// WHAT THIS FILE DOES (plain English):
// The stylized world for Places traveled — real country outlines, soft fill
// for tagged countries, and coral pins at each place's lat/lng. Theme-aware
// strokes so dark mode stays readable. No map SDK; SVG only.
// ============================================
import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { PROFILE } from '@bridger/shared';
import { ACCENTS, useThemeColors, withAnalyticsPress } from '@bridger/ui';
import type { TravelPlace } from '../../data/profile';
import { MAP_VB, getCountryPaths, projectLngLat } from '../../lib/geo/project';

const DEFAULT_HEIGHT = 168;
const CORAL = ACCENTS.coral.hex;

export function WorldMapSvg({
  taggedCountryCodes,
  places,
  activeId,
  onPinPress,
  height = DEFAULT_HEIGHT,
  pinAnalyticsId = PROFILE.card.places_pin
}: {
  /** ISO codes to fill (visited countries) */
  taggedCountryCodes: string[];
  places: TravelPlace[];
  activeId: string | null;
  onPinPress: (id: string) => void;
  height?: number;
  pinAnalyticsId?: string;
}) {
  const c = useThemeColors();
  const paths = useMemo(() => getCountryPaths(), []);
  const tagged = useMemo(
    () => new Set(taggedCountryCodes.map((code) => code.toUpperCase())),
    [taggedCountryCodes]
  );

  // Only pin places with real coords (old rows without lat/lng stay list-only).
  const mappable = places.filter(
    (p) =>
      Number.isFinite(p.lat) &&
      Number.isFinite(p.lng) &&
      typeof p.countryCode === 'string' &&
      p.countryCode.length === 2
  );

  return (
    <View className="relative overflow-hidden rounded-card border border-ink-line bg-surface">
      <Svg
        viewBox={`0 0 ${MAP_VB.w} ${MAP_VB.h}`}
        width="100%"
        height={height}
        accessibilityLabel="Places traveled map"
      >
        {paths.map((country) => {
          const isTagged = tagged.has(country.code);
          return (
            <Path
              key={country.code}
              d={country.d}
              fill={isTagged ? CORAL : c.ink}
              fillOpacity={isTagged ? 0.35 : 0.06}
              stroke={c.ink}
              strokeOpacity={0.28}
              strokeWidth={0.35}
            />
          );
        })}
      </Svg>

      {/* Pins sit over the map at projected lat/lng — big hit targets for a11y */}
      {mappable.map((p) => {
        const { x, y } = projectLngLat(p.lng, p.lat);
        const selected = activeId === p.id;
        return (
          <Pressable
            key={p.id}
            onPress={withAnalyticsPress(pinAnalyticsId, () => onPinPress(p.id))}
            accessibilityRole="button"
            accessibilityLabel={p.label}
            accessibilityState={{ selected }}
            hitSlop={12}
            style={{
              position: 'absolute',
              left: `${(x / MAP_VB.w) * 100}%`,
              top: `${(y / MAP_VB.h) * 100}%`,
              marginLeft: -6,
              marginTop: -12,
              transform: [{ scale: selected ? 1.2 : 1 }]
            }}
          >
            <View className="h-3 w-3 rounded-full border-2 border-ink bg-coral" />
          </Pressable>
        );
      })}
    </View>
  );
}

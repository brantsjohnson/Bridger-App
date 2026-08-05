// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows how you and someone are linked: You — mutual friend — them, with real
// profile photos. Solid lines = friendships you already have. A dashed teal
// arc underneath is the suggested intro (you do not know them yet). Caption
// says who connects you in plain words.
//
// The dashed arc measures its container width and redraws, so it always spans
// from You to them when the card is narrow or wide (half-width Home widgets,
// full Discover detail, web resize).
// ============================================
import React, { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Person } from '@bridger/shared';
import { useThemeColors } from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { getMe } from '../../data/people';

/** Matches PersonAvatar size="xl" (h-24) so the arc ends under each face. */
const AVATAR_XL = 96;
/** Same horizontal inset as the avatar row's px-1. */
const ROW_PAD = 4;
const ARC_HEIGHT = 40;

export function ConnectionMap({
  person,
  via
}: {
  person: Person;
  via: Person;
}) {
  const c = useThemeColors();
  const me = getMe();
  const viaFirst = via.name.split(' ')[0];
  const themFirst = person.name.split(' ')[0];
  // Width of the map body — used to draw a dashed arc that fits this card.
  const [arcWidth, setArcWidth] = useState(0);

  const nodes: Array<{ key: string; label: string; person: Person }> = [
    { key: 'me', label: 'You', person: me },
    { key: via.id, label: viaFirst, person: via },
    { key: person.id, label: themFirst, person }
  ];

  function onArcLayout(e: LayoutChangeEvent) {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== arcWidth) setArcWidth(next);
  }

  // Endpoints sit under the centers of You and them (outer avatars).
  const inset = ROW_PAD + AVATAR_XL / 2;
  const arcPath =
    arcWidth > inset * 2
      ? `M ${inset} 8 Q ${arcWidth / 2} 36 ${arcWidth - inset} 8`
      : null;

  return (
    <View
      className="overflow-hidden rounded-2xl border border-ink-line bg-surface px-3 pb-4 pt-5"
      accessibilityLabel={`Connected through ${viaFirst}`}
    >
      {/* Profile photos in a row, with solid friendship lines between them */}
      <View className="flex-row items-center justify-between px-1">
        {nodes.map((n, i) => (
          <React.Fragment key={n.key}>
            {i > 0 ? (
              <View
                accessible={false}
                className="mx-1 h-[3px] min-w-[12px] flex-1 rounded-full"
                style={{ backgroundColor: c.ink }}
              />
            ) : null}
            <View className="items-center gap-2">
              <PersonAvatar id={n.person.id} size="xl" />
              <Text className="font-sans-b text-[12px] text-ink">{n.label}</Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Dashed teal arc = the intro you do not have yet (You ↔ them) */}
      <View
        className="mt-1 w-full"
        style={{ height: ARC_HEIGHT }}
        accessible={false}
        onLayout={onArcLayout}
      >
        {arcPath ? (
          <Svg width={arcWidth} height={ARC_HEIGHT}>
            <Path
              d={arcPath}
              stroke="#00B3A6"
              strokeWidth={2.5}
              strokeDasharray="7 6"
              strokeLinecap="round"
              fill="none"
              opacity={0.95}
            />
          </Svg>
        ) : null}
      </View>

      <Text className="mt-0.5 text-center font-sans-sb text-[12px] leading-snug text-ink">
        Connected through {viaFirst}
      </Text>
      <Text className="mt-0.5 text-center font-sans-md text-[11px] text-ink-mute">
        Dashed line is the new intro
      </Text>
    </View>
  );
}

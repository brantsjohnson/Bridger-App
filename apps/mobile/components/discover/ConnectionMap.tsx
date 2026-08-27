// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows how you and someone are linked: You — mutual friend — them, with real
// profile photos. Solid lines = friendships you already have. A dashed teal
// arc underneath is the suggested intro (you do not know them yet). Caption
// says who connects you in plain words.
//
// Faces and the arc both follow the card width, so a narrow phone, a wide
// web pane, or a resize never clips the last person or leaves the dashed
// intro short. No caption under the map: the faces and dashed line say it.
// ============================================
import React, { useMemo, useState } from 'react';
import { Text, View, useWindowDimensions, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Person } from '@bridger/shared';
import { useThemeColors } from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { getMe } from '../../data/people';

/** PersonAvatar size="xl" face (h-24). */
const FACE_XL = 96;
/** Story ring adds 3px on each side around an xl face. */
const RING = 6;
/** Design size of one column when there is room (face + ring). */
const COL_XL = FACE_XL + RING;
/** Smallest column we will shrink to so names stay readable. */
const COL_MIN = 52;
/** Shortest solid friendship bar between two faces. */
const GAP_MIN = 12;
const NODE_COUNT = 3;

export function ConnectionMap({
  person,
  via
}: {
  person: Person;
  via: Person;
}) {
  const c = useThemeColors();
  const { width: windowW } = useWindowDimensions();
  const me = getMe();
  const viaFirst = via.name.split(' ')[0];
  const themFirst = person.name.split(' ')[0];

  // Guess the row width before the first layout (page pad 20 + card pad 12, both sides).
  const guessedRow = Math.max(180, windowW - 40 - 24);
  const [rowW, setRowW] = useState(guessedRow);

  const nodes: Array<{ key: string; label: string; person: Person }> = [
    { key: 'me', label: 'You', person: me },
    { key: via.id, label: viaFirst, person: via },
    { key: person.id, label: themFirst, person }
  ];

  // THIS SECTION DOES: pick a face size that fits three people plus two bars in this card.
  const col = useMemo(() => {
    const maxCol = (rowW - GAP_MIN * (NODE_COUNT - 1)) / NODE_COUNT;
    return Math.round(Math.min(COL_XL, Math.max(COL_MIN, maxCol)));
  }, [rowW]);
  const scale = col / COL_XL;
  const arcH = Math.round(28 + scale * 14);

  function onRowLayout(e: LayoutChangeEvent) {
    const next = Math.round(e.nativeEvent.layout.width);
    if (next > 0 && next !== rowW) setRowW(next);
  }

  // THIS SECTION DOES: put the dashed intro under You and them, using the
  // same column math as the faces (You is first, them is last).
  const leftX = col / 2;
  const rightX = rowW - col / 2;
  const midX = rowW / 2;
  const arcPath =
    rightX - leftX > 16 ? `M ${leftX} 8 Q ${midX} ${arcH - 6} ${rightX} 8` : null;

  return (
    <View
      className="rounded-2xl border border-ink-line bg-surface px-3 pb-4 pt-5"
      accessibilityLabel={`Connected through ${viaFirst}`}
    >
      {/* Profile photos in a row, sized to this card, with solid friendship lines */}
      <View className="flex-row items-center justify-between" onLayout={onRowLayout}>
        {nodes.map((n, i) => (
          <React.Fragment key={n.key}>
            {i > 0 ? (
              <View
                accessible={false}
                className="mx-1 h-[3px] min-w-[8px] flex-1 rounded-full"
                style={{ backgroundColor: c.ink }}
              />
            ) : null}
            <View className="items-center gap-1.5" style={{ width: col }}>
              {/* Clip the scaled xl avatar into this column so rings never spill. */}
              <View
                className="items-center justify-center overflow-hidden"
                style={{ width: col, height: col }}
              >
                <View style={{ transform: [{ scale }] }}>
                  <PersonAvatar id={n.person.id} size="xl" />
                </View>
              </View>
              <Text
                numberOfLines={1}
                className="w-full text-center font-sans-b text-[12px] text-ink"
              >
                {n.label}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Dashed teal arc = the intro you do not have yet (You ↔ them) */}
      <View className="mt-1 w-full" style={{ height: arcH }} accessible={false}>
        {arcPath ? (
          <Svg width="100%" height={arcH} viewBox={`0 0 ${rowW} ${arcH}`}>
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

    </View>
  );
}

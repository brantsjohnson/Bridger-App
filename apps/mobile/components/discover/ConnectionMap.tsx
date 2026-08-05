// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows how you and someone are linked: You — mutual friend — them, with real
// profile photos. Solid lines = friendships you already have. A dashed teal
// arc underneath is the suggested intro (you do not know them yet). Caption
// says who connects you in plain words.
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { Person } from '@bridger/shared';
import { useThemeColors } from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { getMe } from '../../data/people';

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

  const nodes: Array<{ key: string; label: string; person: Person }> = [
    { key: 'me', label: 'You', person: me },
    { key: via.id, label: viaFirst, person: via },
    { key: person.id, label: themFirst, person }
  ];

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
      <View className="mt-1 h-10 w-full px-6" accessible={false}>
        <Svg width="100%" height="40" viewBox="0 0 260 40">
          <Path
            d="M 20 8 Q 130 38 240 8"
            stroke="#00B3A6"
            strokeWidth={2.5}
            strokeDasharray="7 6"
            strokeLinecap="round"
            fill="none"
            opacity={0.95}
          />
        </Svg>
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

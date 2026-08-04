// ============================================
// WHAT THIS FILE DOES (plain English):
// Map A: You — your mutual friend (middle) — the person to meet. Solid edges
// are friendships you already have; the dashed edge is the suggested intro.
// Clean white card over Discover's synth grid (DESIGN.md).
// ============================================
import React from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Text as SvgText } from 'react-native-svg';
import type { Person } from '@bridger/shared';
import { ACCENT_HEX, useThemeColors } from '@bridger/ui';
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

  const nodes = [
    { id: 'me', label: 'You', x: 42, y: 90, person: me },
    { id: via.id, label: via.name.split(' ')[0], x: 150, y: 90, person: via },
    { id: person.id, label: person.name.split(' ')[0], x: 258, y: 90, person }
  ];

  const edges = [
    { from: 'me', to: via.id },
    { from: via.id, to: person.id },
    { from: 'me', to: person.id, dashed: true }
  ];

  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <View className="rounded-2xl border border-ink-line bg-surface p-3">
      <Svg
        width="100%"
        height={190}
        viewBox="0 0 300 190"
        accessibilityLabel={`Connection map via ${via.name.split(' ')[0]}`}
      >
        {edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          return (
            <Line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={c.ink}
              strokeOpacity={e.dashed ? 0.3 : 0.55}
              strokeWidth={1}
              strokeDasharray={e.dashed ? '5 5' : undefined}
            />
          );
        })}
        {nodes.map((n) => (
          <React.Fragment key={n.id}>
            <Circle
              cx={n.x}
              cy={n.y}
              r={n.id === 'me' ? 17 : 15}
              fill={ACCENT_HEX[n.person.accent]}
              stroke={c.ink}
              strokeOpacity={0.5}
              strokeWidth={n.id === 'me' ? 1.8 : 1}
            />
            <SvgText
              x={n.x}
              y={n.y + 5}
              textAnchor="middle"
              fontSize="14"
            >
              {n.person.emoji}
            </SvgText>
            <SvgText
              x={n.x}
              y={n.y + 33}
              textAnchor="middle"
              fill={c.ink}
              fontSize="10"
              fontWeight="700"
            >
              {n.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
      <Text className="mt-1 text-center font-sans-sb text-[11px] text-ink-mute">
        Dashed is the intro · via {via.name.split(' ')[0]}
      </Text>
    </View>
  );
}

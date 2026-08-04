// ============================================
// WHAT THIS FILE DOES (plain English):
// One event on the Events list (or a compact row). Cover, date chip, title,
// time + place, who you know going, and Going / Can't on invites.
// PRIVACY: shows friends going only — never invited totals (vanity metric).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { EventItem } from '@bridger/shared';
import {
  AvatarStack,
  ButtonSecondary,
  Card,
  CountdownChip,
  CoverArt
} from '@bridger/ui';
import { personById } from '../data/people';

type EventCardProps = {
  event: EventItem;
  variant?: 'full' | 'row';
  rsvp?: 'going' | 'cant';
  onRsvp?: (id: string, status: 'going' | 'cant') => void;
  onOpen?: (id: string) => void;
};

export function EventCard({
  event,
  variant = 'full',
  rsvp,
  onRsvp,
  onOpen
}: EventCardProps) {
  const going = event.goingIds.map(personById);

  if (variant === 'row') {
    return (
      <Pressable
        onPress={() => onOpen?.(event.id)}
        accessibilityRole="button"
        accessibilityLabel={event.title}
        className="w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface p-3 active:opacity-90"
      >
        <DateChip event={event} />
        <View className="min-w-0 flex-1">
          <Text className="font-sans-b text-[15px] tracking-tight text-ink" numberOfLines={1}>
            {event.title}
          </Text>
          <Text className="font-sans-md text-[12px] text-ink-mute">
            {event.time} · {event.place}
          </Text>
        </View>
        <AvatarStack
          people={going.slice(0, 3).map((p) => ({
            name: p.name,
            emoji: p.emoji,
            accent: p.accent
          }))}
        />
      </Pressable>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Pressable onPress={() => onOpen?.(event.id)} accessibilityRole="button">
        <View className="h-24">
          <CoverArt
            cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
            accent={event.accent}
          />
        </View>
      </Pressable>

      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <DateChip event={event} />
          <View className="min-w-0 flex-1">
            <Pressable onPress={() => onOpen?.(event.id)} accessibilityRole="button">
              <Text className="font-sans-b text-[17px] leading-tight tracking-tight text-ink">
                {event.title}
              </Text>
            </Pressable>
            <Text className="mt-0.5 font-sans-md text-[13px] text-ink-mute">
              {event.time} · {event.place}
            </Text>
          </View>
          {event.countdown ? <CountdownChip label={event.countdown} /> : null}
        </View>

        <View className="mt-4 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <AvatarStack
              people={going.slice(0, 3).map((p) => ({
                name: p.name,
                emoji: p.emoji,
                accent: p.accent
              }))}
            />
            {/* PRIVACY: friends going only — no invited totals */}
            <Text className="font-sans-sb text-[12px] text-ink-mute">
              {going.length} {going.length === 1 ? 'friend' : 'friends'} going
            </Text>
          </View>

          {event.role === 'invited' ? (
            <View className="flex-row gap-2">
              <ButtonSecondary
                size="sm"
                tone={rsvp === 'cant' ? 'solid' : 'outline'}
                onPress={() => onRsvp?.(event.id, 'cant')}
              >
                Can't
              </ButtonSecondary>
              <ButtonSecondary
                size="sm"
                tone="positive"
                onPress={() => onRsvp?.(event.id, 'going')}
              >
                {rsvp === 'going' ? 'Going ✓' : 'Going'}
              </ButtonSecondary>
            </View>
          ) : null}
        </View>
      </View>
    </Card>
  );
}

function DateChip({ event }: { event: EventItem }) {
  const parts = event.day.split(' ');
  const weekday = parts[0];
  const date = parts[1] ?? parts[0];
  return (
    <View className="h-11 w-11 shrink-0 items-center justify-center rounded-none border-2 border-ink bg-surface">
      <Text className="font-pixel text-[13px] leading-none text-ink">{date}</Text>
      <Text className="mt-0.5 font-sans-b text-[9px] uppercase text-ink-mute">{weekday}</Text>
    </View>
  );
}

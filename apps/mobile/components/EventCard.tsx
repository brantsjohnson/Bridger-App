// ============================================
// WHAT THIS FILE DOES (plain English):
// One event on the Events list (or a compact row). Cover, date chip, title,
// time + place, who you know going, and Going / Can't on invites.
// PRIVACY: shows friends going only — never invited totals (vanity metric).
// Analytics: card open = EVENTS.list.event_card; RSVP buttons = detail.going/cant.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import type { EventItem } from '@bridger/shared';
import { EVENTS } from '@bridger/shared';
import {
  AvatarStack,
  ButtonSecondary,
  Card,
  CountdownChip,
  CoverArt,
  withAnalyticsPress
} from '@bridger/ui';
import { EventDateChip } from './event/EventDateChip';
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
  const open = withAnalyticsPress(EVENTS.list.event_card, () => onOpen?.(event.id));

  if (variant === 'row') {
    return (
      <Pressable
        onPress={open}
        accessibilityRole="button"
        accessibilityLabel={event.title}
        className="w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface p-3 active:opacity-90"
      >
        <EventDateChip event={event} />
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
            accent: p.accent,
            personId: p.id
          }))}
        />
      </Pressable>
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      {/* Cover + title open the event; RSVP stays outside so it isn't swallowed */}
      <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={event.title}>
        <View className="h-24">
          <CoverArt
            cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
            accent={event.accent}
          />
        </View>
      </Pressable>

      <View className="p-4">
        <View className="flex-row items-start gap-3">
          <EventDateChip event={event} />
          <View className="min-w-0 flex-1">
            <Pressable onPress={open} accessibilityRole="button">
              <Text className="font-sans-b text-[17px] leading-tight tracking-tight text-ink">
                {event.title}
              </Text>
            </Pressable>
            <Text className="mt-0.5 font-sans-md text-[13px] text-ink-mute">
              {event.time} · {event.place}
            </Text>
          </View>
          {/* Ticks down to the second when we know the real start time. */}
          {event.countdown || event.startsAt ? (
            <View className="w-[132px] shrink-0">
              <CountdownChip label={event.countdown} startsAt={event.startsAt} />
            </View>
          ) : null}
        </View>

        <View className="mt-4 flex-row items-center justify-between gap-3">
          <View className="min-w-0 flex-1 flex-row items-center gap-2">
            <AvatarStack
              people={going.slice(0, 3).map((p) => ({
                name: p.name,
                emoji: p.emoji,
                accent: p.accent,
                personId: p.id
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
                analyticsId={EVENTS.detail.cant}
                onPress={() => onRsvp?.(event.id, 'cant')}
              >
                Can't
              </ButtonSecondary>
              <ButtonSecondary
                size="sm"
                tone="positive"
                analyticsId={EVENTS.detail.going}
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

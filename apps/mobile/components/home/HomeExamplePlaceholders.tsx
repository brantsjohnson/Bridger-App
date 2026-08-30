// ============================================
// WHAT THIS FILE DOES (plain English):
// Seeded "Example" cards for empty Home sections. Pulled from demo fixtures so
// Home never feels blank for a new person. Tapping marks the placeholder
// dismissed and opens the real Events / Notifications area. When they come
// back, that section stays hidden until real content exists.
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { HOME } from '@bridger/shared';
import {
  ACCENTS,
  AvatarStack,
  Card,
  CoverArt,
  cn,
  withAnalyticsPress
} from '@bridger/ui';
import { ExampleBadge } from './ExampleBadge';
import type { WidgetSize } from './HomeWidget';
import { EVENTS, ME, NOTIFICATIONS, PEOPLE } from '../../data/fixtures/catalog';
import { getProfilePhoto } from '../../data/fixtures/demo-media';

/** First demo event: the seed for "Event Example". */
const EXAMPLE_EVENT = EVENTS[0]!;
/** First demo notification: the seed for "Notification Example". */
const EXAMPLE_NOTIF = NOTIFICATIONS[0]!;

/** Look up a fixture person (Examples always use demo cast, even for live users). */
function fixturePerson(id: string) {
  return PEOPLE.find((p) => p.id === id) ?? (id === 'me' ? ME : PEOPLE[0]!);
}

/** Faces for the example event card (demo people only, never live PII). */
function exampleFaces(ids: string[]) {
  return ids.slice(0, 3).map((id) => {
    const p = fixturePerson(id);
    return {
      name: p.name,
      emoji: p.emoji,
      accent: p.accent,
      personId: p.id,
      photo: getProfilePhoto(p.id)
    };
  });
}

/** Event Example: looks like This week's next-event card, clearly labeled. */
export function EventExampleCard({
  size,
  onPress
}: {
  size: WidgetSize;
  onPress: () => void;
}) {
  const open = withAnalyticsPress(HOME.this_week.example_card, onPress);
  const goingIds = EXAMPLE_EVENT.goingIds.filter((id) => id !== 'me').slice(0, 3);

  if (size === 'full') {
    return (
      <Card className="overflow-hidden p-0">
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel="Event example, opens Events"
        >
          <View className="h-24">
            <CoverArt
              cover={
                EXAMPLE_EVENT.cover ?? {
                  kind: 'emoji',
                  value: EXAMPLE_EVENT.emoji
                }
              }
              accent={EXAMPLE_EVENT.accent}
            />
          </View>
          <View className="gap-2 p-4">
            <ExampleBadge analyticsId={HOME.this_week.example_badge} />
            <Text className="font-sans-b text-[17px] leading-tight tracking-tight text-ink">
              Event Example
            </Text>
            <Text className="font-sans-md text-[13px] text-ink-mute">
              This is where events show up. Tap to explore.
            </Text>
            <View className="mt-1 flex-row items-center gap-2">
              <AvatarStack people={exampleFaces(goingIds)} />
              <Text className="font-sans-sb text-[12px] text-ink-mute">
                {EXAMPLE_EVENT.day} · {EXAMPLE_EVENT.time}
              </Text>
            </View>
          </View>
        </Pressable>
      </Card>
    );
  }

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Event example, opens Events"
      className={cn(
        'min-h-[140px] flex-1 overflow-hidden rounded-card active:opacity-90',
        ACCENTS[EXAMPLE_EVENT.accent].tintSolid
      )}
    >
      <View className="h-14 shrink-0">
        <CoverArt
          cover={
            EXAMPLE_EVENT.cover ?? { kind: 'emoji', value: EXAMPLE_EVENT.emoji }
          }
          accent={EXAMPLE_EVENT.accent}
        />
      </View>
      <View className="flex-1 justify-between px-3.5 pb-3 pt-2.5">
        <View className="gap-1.5">
          <ExampleBadge analyticsId={HOME.this_week.example_badge} />
          <Text
            className="font-sans-b text-[15px] tracking-tight text-onaccent"
            numberOfLines={1}
          >
            Event Example
          </Text>
          <Text className="font-sans-sb text-[12px] text-onaccent/75" numberOfLines={2}>
            This is where events show up. Tap to explore.
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

/** Notification Example: one sample row so the Notifications card feels alive. */
export function NotificationExampleCard({
  size,
  onPress
}: {
  size: WidgetSize;
  onPress: () => void;
}) {
  const open = withAnalyticsPress(
    HOME.notifications_preview.example_row,
    onPress
  );
  const person = fixturePerson(EXAMPLE_NOTIF.personId);
  const firstName = person.name.split(' ')[0] ?? 'Friend';

  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel="Notification example, opens Notifications"
      className={cn(
        'w-full justify-between rounded-card border border-ink-line bg-surface p-4 active:opacity-90',
        size === 'half' ? 'min-h-[140px] flex-1' : ''
      )}
    >
      <View className="gap-2.5">
        <ExampleBadge analyticsId={HOME.notifications_preview.example_badge} />
        <Text className="font-sans-b text-[13px] leading-snug text-ink">
          Notification Example
        </Text>
        <View className="flex-row items-center gap-2">
          <AvatarStack
            people={[
              {
                name: person.name,
                emoji: person.emoji,
                accent: person.accent,
                personId: person.id,
                photo: getProfilePhoto(person.id)
              }
            ]}
          />
          <Text className="min-w-0 flex-1 text-[12px] leading-snug" numberOfLines={2}>
            <Text className="font-sans-b text-ink">{firstName} </Text>
            <Text className="font-sans-md text-ink-soft">{EXAMPLE_NOTIF.text}</Text>
          </Text>
        </View>
        <Text className="font-sans-md text-[11px] leading-snug text-ink-mute">
          New replies and invites land here. Tap to explore.
        </Text>
      </View>
    </Pressable>
  );
}

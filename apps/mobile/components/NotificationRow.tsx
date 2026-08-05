// ============================================
// WHAT THIS FILE DOES (plain English):
// One line in the Notifications list — face, what happened, when. Tap goes
// to whatever that notification is about (see NOTIFICATIONS.md). Matches
// Magic Patterns NotificationRow.
// Analytics: notifications.list.row — no names or text in the event.
// ACCESSIBILITY: unread wash uses purple/15 so ink stays readable in dark mode
// (hardcoded lavender washed out light text on a light row).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { NOTIFICATIONS, type AppNotification } from '@bridger/shared';
import { cn, withAnalyticsPress } from '@bridger/ui';
import { PersonAvatar } from './PersonAvatar';
import { personById } from '../data/people';

export function NotificationRow({
  item,
  onPress
}: {
  item: AppNotification;
  onPress?: () => void;
}) {
  const person = item.personId ? personById(item.personId) : null;
  const first = person?.name.split(' ')[0] ?? 'Someone';

  return (
    <Pressable
      onPress={withAnalyticsPress(NOTIFICATIONS.list.row, onPress, {
        analyticsProps: { kind: item.kind }
      })}
      accessibilityRole="button"
      accessibilityLabel={`${first} ${item.text}`}
      className={cn(
        'flex-row items-center gap-3 rounded-card px-3.5 py-3 active:opacity-90',
        // Soft purple wash — opacity-based so dark mode keeps contrast ≥ 4.5:1
        item.unread ? 'bg-purple/15' : ''
      )}
    >
      {item.personId ? (
        <PersonAvatar id={item.personId} size="sm" />
      ) : (
        <View className="h-9 w-9 rounded-full bg-surface" />
      )}
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] leading-snug">
          <Text className="font-sans-b text-ink">{first} </Text>
          <Text className="font-sans-md text-ink-soft">{item.text}</Text>
        </Text>
      </View>
      <Text className="shrink-0 font-sans-sb text-[11px] text-ink-mute">{item.time}</Text>
    </Pressable>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Detail sheet when you tap a friend's touch-grass card — what, when, roughly
// where, who's already in — then I'm in. Enough to decide without messaging.
// ============================================
import React, { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ClockIcon, MapPinIcon, UsersIcon } from 'lucide-react-native';
import type { GrassSignal } from '@bridger/shared';
import { Avatar, ButtonSecondary, Sheet, useThemeColors } from '@bridger/ui';
import { personById } from '../data/people';

export function GrassSignalSheet({
  signal,
  onClose,
  onJoin
}: {
  signal: GrassSignal | null;
  onClose: () => void;
  onJoin?: (id: string) => void;
}) {
  const c = useThemeColors();
  const [joined, setJoined] = useState(false);

  useEffect(() => {
    if (signal) setJoined(false);
  }, [signal]);

  if (!signal) return null;

  const person = personById(signal.personId);
  const first = person.name.split(' ')[0];
  const inPeople = (signal.inIds ?? []).map(personById);

  function join() {
    if (joined || !signal) return;
    const id = signal.id;
    setJoined(true);
    setTimeout(() => onJoin?.(id), 400);
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={`${first} touched grass`}
      footer={
        <ButtonSecondary full size="lg" tone="positive" disabled={joined} onPress={join}>
          {joined ? "You're in ✓" : "I'm in"}
        </ButtonSecondary>
      }
    >
      <View className="gap-4">
        <View className="flex-row items-center gap-3">
          <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="lg" />
          <View className="min-w-0 flex-1">
            <Text className="font-sans-b text-[16px] tracking-tight text-ink">{person.name}</Text>
            <Text className="font-sans-sb text-[12px] text-ink-mute">
              {signal.postedAt ? `${signal.postedAt} · ` : ''}told{' '}
              {signal.audience?.toLowerCase() ?? 'friends'}
            </Text>
          </View>
        </View>

        {signal.what ? (
          <View className="rounded-card bg-[#EEF8E3] p-3.5">
            <Text className="font-sans-sb text-[14px] leading-snug text-ink">{signal.what}</Text>
          </View>
        ) : null}

        <View className="gap-2.5">
          <Detail
            icon={<ClockIcon size={16} color={c.inkSoft} strokeWidth={2.4} />}
            label="When"
            value={signal.when}
          />
          {signal.where ? (
            <Detail
              icon={<MapPinIcon size={16} color={c.inkSoft} strokeWidth={2.4} />}
              label="Where"
              value={signal.where}
            />
          ) : null}
          <View className="flex-row items-start gap-3">
            <UsersIcon size={16} color={c.inkSoft} strokeWidth={2.4} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[12px] text-ink-mute">{"Who's in"}</Text>
              {inPeople.length === 0 ? (
                <Text className="mt-0.5 font-sans-sb text-[14px] text-ink-mute">
                  Nobody yet — you would be first.
                </Text>
              ) : (
                <View className="mt-1 flex-row items-center gap-2">
                  {inPeople.map((p) => (
                    <Avatar key={p.id} name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                  ))}
                  <Text className="font-sans-sb text-[14px] text-ink">
                    {inPeople.map((p) => p.name.split(' ')[0]).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    </Sheet>
  );
}

function Detail({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-row items-start gap-3">
      {icon}
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[12px] text-ink-mute">{label}</Text>
        <Text className="mt-0.5 font-sans-sb text-[14px] text-ink">{value}</Text>
      </View>
    </View>
  );
}

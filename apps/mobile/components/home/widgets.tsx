// ============================================
// WHAT THIS FILE DOES (plain English):
// The bodies of each Home widget — next event, notifications, weekly activity,
// quiz, co-op. Half-width and full-width layouts match Magic Patterns widgets.tsx.
// PRIVACY: event cards never show invited totals (vanity metric rule).
// ============================================
import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { ArrowUpRightIcon, ChevronRightIcon, Share2Icon } from 'lucide-react-native';
import type { EventItem } from '@bridger/shared';
import {
  ACCENTS,
  Avatar,
  AvatarStack,
  ButtonSecondary,
  Card,
  CoverArt,
  CountdownChip,
  ORGANIC,
  cn,
  useThemeColors
} from '@bridger/ui';
import { personById } from '../../data/people';
import type { WidgetSize } from './HomeWidget';

type NotifRow = { id: string; personId: string; text: string; time: string };
type WeeklyActivity = {
  id: string;
  title: string;
  prompt: string;
  closesIn: string;
  accent: EventItem['accent'];
  posts: Array<{ id: string; personId: string; emoji: string; caption: string }>;
};
type QuizData = {
  id: string;
  title: string;
  comparable: boolean;
  results: Array<{
    id: string;
    label: string;
    accent: EventItem['accent'];
    friendIds: string[];
  }>;
};

export function NextEventWidget({
  event,
  size,
  onOpen,
  onSeeAll
}: {
  event: EventItem;
  size: WidgetSize;
  onOpen?: () => void;
  onSeeAll?: () => void;
}) {
  const c = useThemeColors();

  if (size === 'full') {
    const going = event.goingIds.map(personById);
    return (
      <View className="gap-2">
        <Card className="overflow-hidden p-0">
          <Pressable onPress={onOpen} accessibilityRole="button" accessibilityLabel={event.title}>
            <View className="h-24">
              <CoverArt cover={event.cover ?? { kind: 'emoji', value: event.emoji }} accent={event.accent} />
            </View>
            <View className="flex-row items-start gap-3 p-4">
              <View className="items-center rounded-card bg-canvas-raised px-2.5 py-2">
                <Text className="font-sans-b text-[11px] uppercase text-ink-mute">
                  {event.day.split(' ')[0]}
                </Text>
                <Text className="font-sans-b text-[18px] text-ink">{event.day.split(' ')[1]}</Text>
              </View>
              <View className="min-w-0 flex-1">
                <Text className="font-sans-b text-[17px] leading-tight tracking-tight text-ink">
                  {event.title}
                </Text>
                <Text className="mt-0.5 font-sans-md text-[13px] text-ink-mute">
                  {event.time} · {event.place}
                </Text>
                <View className="mt-3 flex-row items-center gap-2">
                  <AvatarStack
                    people={going.slice(0, 3).map((p) => ({
                      name: p.name,
                      emoji: p.emoji,
                      accent: p.accent
                    }))}
                  />
                  {/* PRIVACY: host headcount vs cap is allowed; no invited totals */}
                  <Text className="font-sans-sb text-[12px] text-ink-mute">
                    {going.length}
                    {event.cap ? ` / ${event.cap}` : ''} going
                  </Text>
                </View>
              </View>
              {event.countdown ? <CountdownChip label={event.countdown} /> : null}
            </View>
          </Pressable>
        </Card>
        <Pressable onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all events">
          <Text className="font-sans-b text-[12px] text-purple">See all</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className={cn('min-h-[140px] overflow-hidden rounded-card', ACCENTS[event.accent].tintSolid)}>
      <View className="h-14 shrink-0">
        <CoverArt cover={event.cover ?? { kind: 'emoji', value: event.emoji }} accent={event.accent} />
      </View>
      <Pressable onPress={onOpen} className="flex-1 px-4 pt-3 active:opacity-90">
        <Text className="font-sans-b text-[15px] tracking-tight text-ink" numberOfLines={1}>
          {event.title}
        </Text>
        <Text className="font-sans-sb text-[12px] text-ink-soft" numberOfLines={1}>
          {event.day} · {event.time}
        </Text>
        {event.countdown ? (
          <View className="mt-3 self-start rounded-full bg-surface px-2.5 py-1">
            <Text className="font-sans-b text-[11px] text-ink">{event.countdown}</Text>
          </View>
        ) : null}
      </Pressable>
      <Pressable onPress={onSeeAll} className="mb-3 ml-4 mt-2">
        <Text className="font-sans-b text-[11px] text-ink-soft underline">See all</Text>
      </Pressable>
    </View>
  );
}

export function AlertsWidget({
  size,
  rows,
  onOpen
}: {
  size: WidgetSize;
  rows: NotifRow[];
  onOpen?: () => void;
}) {
  const preview = rows.slice(0, 3);
  const unread = preview.length;

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      className={cn(
        'w-full rounded-card border border-ink-line bg-surface p-4 active:opacity-90',
        size === 'half' && 'min-h-[140px]'
      )}
    >
      {unread > 0 ? (
        <View className="mb-2 h-5 self-start items-center justify-center rounded-full bg-coral px-2">
          <Text className="font-sans-b text-[11px] text-white">{unread} new</Text>
        </View>
      ) : null}

      <View className="gap-2.5">
        {preview.map((n) => {
          const person = personById(n.personId);
          return (
            <View key={n.id} className="flex-row items-center gap-2">
              <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xs" />
              <Text className="min-w-0 flex-1 text-[12px] leading-snug" numberOfLines={1}>
                <Text className="font-sans-b text-ink">{person.name.split(' ')[0]} </Text>
                <Text className="font-sans-md text-ink-soft">{n.text}</Text>
              </Text>
              {size === 'full' ? (
                <Text className="shrink-0 font-sans-sb text-[11px] text-ink-mute">{n.time}</Text>
              ) : null}
            </View>
          );
        })}
      </View>

      <Text className="mt-3 font-sans-b text-[11px] text-purple">See all</Text>
    </Pressable>
  );
}

export function ActivityWidget({
  size,
  activity,
  onOpen
}: {
  size: WidgetSize;
  activity: WeeklyActivity;
  onOpen?: () => void;
}) {
  const token = ACCENTS[activity.accent];
  const faces = activity.posts.slice(0, 4).map((p) => personById(p.personId));
  const c = useThemeColors();

  if (size === 'full') {
    return (
      <Pressable
        onPress={onOpen}
        accessibilityRole="button"
        accessibilityLabel={activity.title}
        style={ORGANIC.banner}
        className={cn(
          'relative w-full flex-row items-center gap-4 overflow-hidden px-5 py-5 active:opacity-90',
          token.tintSolid
        )}
      >
        <Text accessible={false} className="absolute -right-3 -top-4 text-[74px] opacity-25">
          👕
        </Text>
        <View className="min-w-0 flex-1">
          <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
            This week · {activity.closesIn}
          </Text>
          <Text className="mt-1 font-pixel text-[19px] leading-tight text-ink" numberOfLines={1}>
            {activity.title}
          </Text>
          <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft" numberOfLines={1}>
            {activity.prompt}
          </Text>
          <View className="mt-3 flex-row items-center gap-2">
            <AvatarStack people={faces.map((p) => ({ name: p.name, emoji: p.emoji, accent: p.accent }))} />
            <Text className="font-sans-b text-[12px] text-ink-soft">{activity.posts.length} posted</Text>
          </View>
        </View>
        <ChevronRightIcon size={20} color={c.inkSoft} strokeWidth={2.6} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
      style={ORGANIC.bold}
      className="min-h-[140px] w-full justify-between bg-[#FFDE99] p-4 active:opacity-90"
    >
      <Text accessible={false} className="text-[26px]">
        👕
      </Text>
      <Text className="mt-1.5 font-pixel text-[15px] text-onaccent" numberOfLines={1}>
        {activity.title}
      </Text>
      <Text className="mt-1 font-sans-sb text-[12px] text-onaccent/75">
        {activity.posts.length} posted
      </Text>
    </Pressable>
  );
}

export function QuizWidget({
  size,
  quiz,
  resultId,
  onTake,
  onOpenResult
}: {
  size: WidgetSize;
  quiz: QuizData;
  resultId: string | null;
  onTake: () => void;
  onOpenResult: (id: string) => void;
}) {
  const mine = quiz.results.find((r) => r.id === resultId);
  const c = useThemeColors();

  if (size === 'full') {
    if (!mine) {
      return (
        <View className="rounded-card border border-ink-line bg-surface p-5">
          <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">This week</Text>
          <Text className="mt-1 font-pixel text-[19px] leading-tight text-ink">{quiz.title}</Text>
          <View className="mt-4">
            <ButtonSecondary full size="md" tone="solid" onPress={onTake}>
              Take the quiz
            </ButtonSecondary>
          </View>
        </View>
      );
    }

    return (
      <View className="gap-3">
        <View style={ORGANIC.bold} className={cn('p-6', ACCENTS[mine.accent].tintSolid)}>
          <Text className="text-center font-sans-b text-[12px] text-ink-soft">{quiz.title}</Text>
          <Text className="mt-1.5 text-center font-pixel text-[24px] leading-tight text-ink">
            {mine.label}
          </Text>
          <View className="mt-3 items-center">
            <ButtonSecondary
              size="sm"
              icon={<Share2Icon size={16} color={c.ink} strokeWidth={2.4} />}
              onPress={() => undefined}
            >
              Share quiz
            </ButtonSecondary>
          </View>
        </View>

        {quiz.comparable ? (
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-sans-b text-[13px] text-ink">Who got who</Text>
              <Pressable onPress={() => onOpenResult(mine.id)}>
                <Text className="font-sans-b text-[12px] text-purple">See more</Text>
              </Pressable>
            </View>
            <View className="gap-2.5">
              {quiz.results.map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => onOpenResult(r.id)}
                  className="w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
                >
                  <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink" numberOfLines={1}>
                    {r.label} · {r.friendIds.length}
                  </Text>
                  <AvatarStack
                    people={r.friendIds.slice(0, 3).map((id) => {
                      const p = personById(id);
                      return { name: p.name, emoji: p.emoji, accent: p.accent };
                    })}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={resultId ? () => onOpenResult(resultId) : onTake}
      accessibilityRole="button"
      style={ORGANIC.flip}
      className="min-h-[140px] w-full justify-between bg-[#D5C2FF] p-4 active:opacity-90"
    >
      <Text accessible={false} className="text-[26px]">
        🗺
      </Text>
      <Text className="mt-1.5 font-sans-b text-[13px] leading-snug text-onaccent">
        {resultId ? mine?.label ?? quiz.title : quiz.title}
      </Text>
      <Text className="mt-1 font-sans-b text-[11px] text-onaccent/75">
        {resultId ? 'Who got who' : 'Take the quiz'}
      </Text>
    </Pressable>
  );
}

export function CoopWidget({
  size,
  member = false,
  onOpen
}: {
  size: WidgetSize;
  member?: boolean;
  onOpen?: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={member ? 'Member portal' : 'Join the co-op'}
      className={cn(
        'w-full flex-row items-center gap-3 rounded-card bg-teal px-4 py-4 active:opacity-90',
        size === 'half' && 'min-h-[140px]'
      )}
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25">
        <Text className="text-[20px]">🌉</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="font-sans-b text-[14px] leading-tight text-onaccent">
          {member ? 'Member portal' : 'Join the co-op'}
        </Text>
        <Text className="font-sans-sb text-[12px] text-onaccent/75" numberOfLines={1}>
          {member ? 'Votes, feedback, what we are building' : 'You are not the product · $24 a year'}
        </Text>
      </View>
      <ArrowUpRightIcon size={16} color="#1C1B16" strokeWidth={2.8} />
    </Pressable>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// The bodies of each Home widget — next event, notifications, weekly activity,
// quiz, co-op. Half-width and full-width layouts match Magic Patterns widgets.tsx.
// PRIVACY: event cards never show invited totals (vanity metric rule).
// Analytics: HOME.this_week.* and HOME.notifications_preview.* only — no PII.
//
// Next-event (half): countdown sits under the date; bottom row is friends who
// are coming (left) · a dot · people Bridger suggests you meet (right).
// Faces use dropped-in profile photos whenever we have one.
// ============================================
import React from 'react';
import { Pressable, Share, Text, View, type ImageSourcePropType } from 'react-native';
import { ArrowUpRightIcon, ChevronRightIcon, Share2Icon } from 'lucide-react-native';
import { HOME, type Cover, type EventItem, type AppNotification } from '@bridger/shared';
import {
  ACCENTS,
  AnalyticsRegion,
  AvatarStack,
  ButtonSecondary,
  Card,
  CoverArt,
  CountdownChip,
  ORGANIC,
  cn,
  useThemeColors,
  withAnalyticsPress
} from '@bridger/ui';
import { PersonAvatar } from '../PersonAvatar';
import { EventDateChip } from '../event/EventDateChip';
import { QuizCoverCycler } from './QuizCoverCycler';
import { meetSuggestionsForEvent } from '../../data/events';
import { personById } from '../../data/people';
import { avatarPhotoFor } from '../../lib/avatar-photo';
import type { WidgetSize } from './HomeWidget';

/** Tailwind h-52 / h-28 in px (default 1rem = 16px). Matches QuizWidget banner heights. */
const QUIZ_COVER_H_FULL = 208;
const QUIZ_COVER_H_HALF = 112;

/** AvatarStack row with real photos when we have a live or demo pic. */
function faceStack(
  ids: string[],
  limit = 3
): Array<{
  name: string;
  emoji?: string;
  accent?: EventItem['accent'];
  personId: string;
  photo: ReturnType<typeof avatarPhotoFor>;
}> {
  return ids.slice(0, limit).map((id) => {
    const p = personById(id);
    return {
      name: p.name,
      emoji: p.emoji,
      accent: p.accent,
      personId: p.id,
      photo: avatarPhotoFor(p.id, p.avatarUrl)
    };
  });
}

type NotifRow = AppNotification;
type WeeklyActivity = {
  id: string;
  title: string;
  prompt: string;
  closesIn: string;
  accent: EventItem['accent'];
  /** Accent glyph when there is no photo cover. */
  emoji?: string;
  /** Same cover model as events: photo fills the frame. */
  cover?: Cover;
  posts: Array<{ id: string; personId: string; emoji: string; caption: string }>;
};
type QuizData = {
  id: string;
  title: string;
  /** Short line under the title on the Home card. */
  description?: string;
  comparable: boolean;
  cover?: Cover;
  /** Faces the banner cross-fades through instead of a static cover. */
  coverImages?: ImageSourcePropType[];
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
  onOpen
}: {
  event: EventItem;
  size: WidgetSize;
  /** Opens this event's detail page — the whole card is the tap target. */
  onOpen?: () => void;
}) {
  const open = withAnalyticsPress(HOME.this_week.next_event, onOpen);

  // Friends you know who are coming (skip yourself — not a "mutual").
  const friendsGoingIds = event.goingIds.filter((id) => id !== 'me');
  const meetIds = meetSuggestionsForEvent(event).map((m) => m.personId);

  if (size === 'full') {
    return (
      <Card className="overflow-hidden p-0">
        {/* Analytics: open the next-event card → event detail. */}
        <Pressable
          onPress={open}
          accessibilityRole="button"
          accessibilityLabel={event.title}
        >
          <View className="h-24">
            <CoverArt
              cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
              accent={event.accent}
            />
          </View>
            <View className="flex-row items-start gap-3 p-4">
            {/* Date square: day number on top, weekday under (same as EventDateChip). */}
            <EventDateChip event={event} />
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[17px] leading-tight tracking-tight text-ink">
                {event.title}
              </Text>
              <Text className="mt-0.5 font-sans-md text-[13px] text-ink-mute">
                {event.time} · {event.place}
              </Text>
              <View className="mt-3 flex-row items-center gap-2">
                <AvatarStack people={faceStack(friendsGoingIds)} />
                {/* PRIVACY: host headcount vs cap is allowed; no invited totals */}
                <Text className="font-sans-sb text-[12px] text-ink-mute">
                  {friendsGoingIds.length}
                  {event.cap ? ` / ${event.cap}` : ''} going
                </Text>
              </View>
            </View>
            <View className="w-[132px] shrink-0">
              <CountdownChip label={event.countdown} startsAt={event.startsAt} />
            </View>
          </View>
        </Pressable>
      </Card>
    );
  }

  // Half-size: countdown under the date; faces at the bottom (friends | · | meet).
  const meetLabel =
    meetIds.length > 0
      ? `${meetIds.length} ${meetIds.length === 1 ? 'person' : 'people'} to meet`
      : undefined;
  return (
    <Pressable
      onPress={open}
      accessibilityRole="button"
      accessibilityLabel={
        meetLabel ? `${event.title}. ${meetLabel}` : event.title
      }
      className={cn(
        // fill the HomeWidget shell so half-width pairs match height
        'min-h-[140px] flex-1 overflow-hidden rounded-card active:opacity-90',
        ACCENTS[event.accent].tintSolid
      )}
    >
      <View className="h-14 shrink-0">
        <CoverArt
          cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
          accent={event.accent}
        />
      </View>
      <View className="flex-1 justify-between px-3.5 pb-3 pt-2.5">
        <View>
          {/* onaccent = always-dark type, readable on the pale tint in light and dark */}
          <Text className="font-sans-b text-[15px] tracking-tight text-onaccent" numberOfLines={1}>
            {event.title}
          </Text>
          <Text className="font-sans-sb text-[12px] text-onaccent/75" numberOfLines={1}>
            {event.day} · {event.time}
          </Text>
          {/* Countdown tucked under the date, not pinned to the card footer */}
          {event.countdown || event.startsAt ? (
            <View className="mt-1.5 w-[128px] max-w-full">
              <CountdownChip label={event.countdown} startsAt={event.startsAt} />
            </View>
          ) : null}
        </View>

        {/* Left = friends coming · center dot · right = people to meet (no chip behind) */}
        {friendsGoingIds.length > 0 || meetIds.length > 0 ? (
          <View
            className="mt-2.5 flex-row items-center"
            accessible
            accessibilityLabel={[
              friendsGoingIds.length
                ? `${friendsGoingIds.length} friends going`
                : null,
              meetLabel
            ]
              .filter(Boolean)
              .join('. ')}
          >
            {friendsGoingIds.length > 0 ? (
              <AvatarStack people={faceStack(friendsGoingIds)} />
            ) : null}
            {friendsGoingIds.length > 0 && meetIds.length > 0 ? (
              <View
                accessible={false}
                className="mx-2 h-1.5 w-1.5 rounded-full bg-onaccent/45"
              />
            ) : null}
            {meetIds.length > 0 ? (
              // Transparent side: just faces, no fill behind the stack
              <View className="bg-transparent">
                <AvatarStack people={faceStack(meetIds)} />
              </View>
            ) : null}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

export function AlertsWidget({
  size,
  rows,
  onOpen,
  onSeeAll
}: {
  size: WidgetSize;
  rows: NotifRow[];
  /** Tap one preview row → go to what that alert is about. */
  onOpen?: (item: NotifRow) => void;
  /** Tap the card (or See all) → full Notifications page. */
  onSeeAll?: () => void;
}) {
  // Home only cares about unread — once you've cleared them, say so.
  const preview = rows.filter((n) => n.unread !== false).slice(0, 3);
  const unread = preview.length;
  const caughtUp = unread === 0;

  return (
    // THIS SECTION DOES: the card is a plain shell. Each row is its own
    // button, and "See all" is a separate button. Nesting those inside one
    // big card button is illegal HTML on web (button cannot contain button).
    <View
      className={cn(
        'w-full justify-between rounded-card border border-ink-line bg-surface p-4',
        // half: grow with the sibling "This week" card; full: natural height
        size === 'half' ? 'min-h-[140px] flex-1' : ''
      )}
    >
      <View>
        {unread > 0 ? (
          <View className="mb-2 h-5 self-start items-center justify-center rounded-full bg-coral px-2">
            <Text className="font-sans-b text-[11px] text-white">{unread} new</Text>
          </View>
        ) : null}

        {caughtUp ? (
          // Null state when everything is read — still keep See all below.
          <AnalyticsRegion
            analyticsId={HOME.notifications_preview.empty_body}
            interactive={false}
            accessibilityLabel="All caught up"
          >
            <Text className="font-sans-sb text-[13px] leading-snug text-ink-soft">
              All caught up!
            </Text>
            <Text className="mt-1 font-sans-md text-[11px] leading-snug text-ink-mute">
              New replies and invites land here.
            </Text>
          </AnalyticsRegion>
        ) : (
          <View className="gap-2.5">
            {preview.map((n) => {
              const person = personById(n.personId ?? '');
              return (
                // Analytics: each preview row (kind only — no notification text).
                <Pressable
                  key={n.id}
                  onPress={withAnalyticsPress(
                    HOME.notifications_preview.row,
                    () => onOpen?.(n),
                    { analyticsProps: { kind: n.kind } }
                  )}
                  accessibilityRole="button"
                  accessibilityLabel="Notification"
                  className="flex-row items-center gap-2 active:opacity-90"
                >
                  {/* Real profile photo when dropped in for this person */}
                  {n.personId ? <PersonAvatar id={n.personId} size="xs" /> : null}
                  <Text className="min-w-0 flex-1 text-[12px] leading-snug" numberOfLines={1}>
                    <Text className="font-sans-b text-ink">{person.name.split(' ')[0]} </Text>
                    <Text className="font-sans-md text-ink-soft">{n.text}</Text>
                  </Text>
                  {size === 'full' ? (
                    <Text className="shrink-0 font-sans-sb text-[11px] text-ink-mute">{n.time}</Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        )}
      </View>

      {/* Opens the full Notifications page. Same destination the old card tap used. */}
      <Pressable
        onPress={withAnalyticsPress(HOME.notifications_preview.see_all, onSeeAll)}
        accessibilityRole="button"
        accessibilityLabel="See all notifications"
        className="mt-3 self-start active:opacity-80"
      >
        <Text className="font-sans-b text-[11px] text-purple">See all</Text>
      </Pressable>
    </View>
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
  const posterIds = activity.posts.slice(0, 4).map((p) => p.personId);
  const c = useThemeColors();
  // Cover fills the frame like events; emoji is the fallback glyph.
  const cover: Cover =
    activity.cover ??
    ({
      kind: 'emoji',
      value: activity.emoji || '👕',
      bg: '#FFB515'
    } as Cover);

  if (size === 'full') {
    return (
      // Analytics: open the weekly activity collage.
      <Card className="overflow-hidden p-0">
        <Pressable
          onPress={withAnalyticsPress(HOME.activity.open, onOpen)}
          accessibilityRole="button"
          accessibilityLabel={activity.title}
        >
          <View className="h-24">
            <CoverArt cover={cover} accent={activity.accent} />
          </View>
          <View className="flex-row items-start gap-3 p-4">
            <View className="min-w-0 flex-1">
              <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
                This week · {activity.closesIn}
              </Text>
              <Text
                className="mt-1 font-pixel text-[19px] leading-tight text-ink"
                numberOfLines={1}
              >
                {activity.title}
              </Text>
              <Text
                className="mt-0.5 font-sans-sb text-[13px] text-ink-soft"
                numberOfLines={2}
              >
                {activity.prompt}
              </Text>
              <View className="mt-3 flex-row items-center gap-2">
                <AvatarStack people={faceStack(posterIds, 4)} />
                <Text className="font-sans-b text-[12px] text-ink-soft">
                  {activity.posts.length} posted
                </Text>
              </View>
            </View>
            <ChevronRightIcon size={20} color={c.inkSoft} strokeWidth={2.6} />
          </View>
        </Pressable>
      </Card>
    );
  }

  return (
    <Pressable
      onPress={withAnalyticsPress(HOME.activity.open, onOpen)}
      accessibilityRole="button"
      accessibilityLabel={activity.title}
      className="min-h-[140px] w-full overflow-hidden rounded-card active:opacity-90"
    >
      <View className="h-14 shrink-0">
        <CoverArt cover={cover} accent={activity.accent} />
      </View>
      <View className="flex-1 justify-between bg-amber p-4">
        <Text className="font-pixel text-[15px] text-onaccent" numberOfLines={1}>
          {activity.title}
        </Text>
        <View className="mt-1 flex-row items-center gap-2">
          <AvatarStack people={faceStack(posterIds)} />
          <Text className="font-sans-sb text-[12px] text-onaccent/75">
            {activity.posts.length} posted
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function QuizWidget({
  size,
  quiz,
  resultId,
  onTake,
  onOpenResult,
  takeAnalyticsId
}: {
  size: WidgetSize;
  quiz: QuizData;
  resultId: string | null;
  onTake: () => void;
  onOpenResult: (id: string) => void;
  /** Override the Take button analytics id (standing J-name prompt uses take_prompt). */
  takeAnalyticsId?: string;
}) {
  const mine = quiz.results.find((r) => r.id === resultId);
  const c = useThemeColors();
  const takeId = takeAnalyticsId ?? HOME.this_week.take_quiz;

  // Cover fills the top of the card like events.
  const cover: Cover =
    quiz.cover ?? ({ kind: 'emoji', value: '🧭', bg: '#4D96FF' } as Cover);

  // Face photos are portraits, so the cycling banner needs more height than a
  // flat color/emoji cover or you only see a thin strip of forehead.
  const cycling = Boolean(quiz.coverImages?.length);

  if (size === 'full') {
    if (!mine) {
      return (
        <Card className="overflow-hidden p-0">
          <View className={cycling ? 'relative h-52 w-full' : 'h-24 w-full'}>
            {cycling ? (
              <QuizCoverCycler
                faces={quiz.coverImages!}
                heightPx={QUIZ_COVER_H_FULL}
                accessibilityLabel="J-name faces"
              />
            ) : (
              <CoverArt cover={cover} accent="blue" />
            )}
          </View>
          <View className="p-5">
            <Text className="font-sans-b text-[11px] uppercase tracking-wide text-ink-mute">
              Quiz
            </Text>
            <Text className="mt-1 font-pixel text-[19px] leading-tight text-ink">
              {quiz.title}
            </Text>
            {quiz.description ? (
              <Text className="mt-0.5 font-sans-sb text-[13px] text-ink-soft" numberOfLines={2}>
                {quiz.description}
              </Text>
            ) : null}
            <View className="mt-4">
              {/* Analytics: start this week's quiz. */}
              <ButtonSecondary
                full
                size="md"
                tone="solid"
                onPress={onTake}
                analyticsId={takeId}
              >
                Take the quiz
              </ButtonSecondary>
            </View>
          </View>
        </Card>
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
              analyticsId={HOME.quiz.share}
              accessibilityLabel="Share this quiz"
              onPress={() => {
                void Share.share({
                  message: `Take "${quiz.title}" on Bridger.${
                    mine ? ` I got: ${mine.label}.` : ''
                  }`
                });
              }}
            >
              Share quiz
            </ButtonSecondary>
          </View>
        </View>

        {quiz.comparable ? (
          <View>
            <View className="mb-2 flex-row items-center justify-between">
              <Text className="font-sans-b text-[13px] text-ink">
                {quiz.id === 'what-j-name' ? 'Your versions' : 'Who got who'}
              </Text>
              <Pressable onPress={() => onOpenResult(mine.id)}>
                <Text className="font-sans-b text-[12px] text-purple">See more</Text>
              </Pressable>
            </View>
            <View className="gap-2.5">
              {/* J-name board: top 3 by friend count; grows as more friends take it. */}
              {(quiz.id === 'what-j-name'
                ? [...quiz.results]
                    .filter((r) => r.friendIds.length > 0)
                    .sort((a, b) => b.friendIds.length - a.friendIds.length)
                    .slice(0, 3)
                : quiz.results
              ).map((r) => (
                <Pressable
                  key={r.id}
                  onPress={() => onOpenResult(r.id)}
                  className="w-full flex-row items-center gap-3 rounded-card border border-ink-line bg-surface px-4 py-3 active:opacity-90"
                >
                  <Text className="min-w-0 flex-1 font-sans-b text-[13px] text-ink" numberOfLines={1}>
                    {quiz.id === 'what-j-name'
                      ? `Your version of ${r.label}`
                      : `${r.label} · ${r.friendIds.length}`}
                  </Text>
                  <AvatarStack people={faceStack(r.friendIds)} />
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
      onPress={withAnalyticsPress(
        takeId,
        resultId ? () => onOpenResult(resultId) : onTake
      )}
      accessibilityRole="button"
      className="min-h-[140px] w-full overflow-hidden rounded-card active:opacity-90"
    >
      <View className={cycling ? 'relative h-28 w-full shrink-0' : 'h-14 w-full shrink-0'}>
        {cycling ? (
          <QuizCoverCycler
            faces={quiz.coverImages!}
            heightPx={QUIZ_COVER_H_HALF}
            accessibilityLabel="J-name faces"
          />
        ) : (
          <CoverArt cover={cover} accent="purple" />
        )}
      </View>
      <View className="flex-1 justify-between bg-[#D5C2FF] p-4">
        <Text className="font-sans-b text-[13px] leading-snug text-onaccent">
          {resultId ? mine?.label ?? quiz.title : quiz.title}
        </Text>
        <Text className="mt-1 font-sans-b text-[11px] text-onaccent/75">
          {resultId
            ? quiz.id === 'what-j-name'
              ? 'Your versions'
              : 'Who got who'
            : 'Take the quiz'}
        </Text>
      </View>
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
      accessibilityLabel={
        member ? 'Member portal' : 'Join the co-op for six dollars a month'
      }
      className={cn(
        'w-full flex-row items-center gap-3 rounded-card bg-teal px-4 py-4 active:opacity-90',
        size === 'half' && 'min-h-[140px]'
      )}
    >
      <View className="h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25">
        <Text className="text-[20px]">🌉</Text>
      </View>
      <View className="min-w-0 flex-1">
        {/* Non-members: $6 a month is the hero price (not $72 a year). */}
        <Text className="font-sans-b text-[14px] leading-tight text-onaccent">
          {member ? 'Member portal' : '$6 a month'}
        </Text>
        <Text className="font-sans-sb text-[12px] text-onaccent/75" numberOfLines={1}>
          {member
            ? 'Votes, feedback, what we are building'
            : 'Join the co-op · you are not the product'}
        </Text>
      </View>
      <ArrowUpRightIcon size={16} color="#1C1B16" strokeWidth={2.8} />
    </Pressable>
  );
}

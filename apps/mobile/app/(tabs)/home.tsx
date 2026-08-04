// ============================================
// WHAT THIS FILE DOES (plain English):
// The Home tab — ported from Magic Patterns. Announcements, stories, editable
// widgets. Data comes from hooks (demo fixtures or live API) so this screen
// is the real product either way. Touch Grass *send* lives on Events.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { ButtonSecondary, PixelHeading, Screen, ScreenBody, ScreenHeader } from '@bridger/ui';
import type { GrassSignal } from '@bridger/shared';
import { AddStoryTile, StoryTile } from '../../components/StoryTile';
import { FreeSignalCard } from '../../components/FreeSignalCard';
import { ColdStart } from '../../components/ColdStart';
import { GrassSignalSheet } from '../../components/GrassSignalSheet';
import {
  Announcement,
  AnnouncementsCarousel,
  CoopAnnouncementCard
} from '../../components/home/AnnouncementsCarousel';
import { HomeWidget, type WidgetSize } from '../../components/home/HomeWidget';
import {
  ActivityWidget,
  AlertsWidget,
  CoopWidget,
  NextEventWidget,
  QuizWidget
} from '../../components/home/widgets';
import { AskWidget } from '../../components/home/AskWidget';
import { AskSheet } from '../../components/home/AskSheet';
import { ComingUpWidget } from '../../components/home/ComingUpWidget';
import { FreshnessCard } from '../../components/home/FreshnessCard';
import { StoryRepliesRow } from '../../components/home/StoryRepliesRow';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import { useTouchGrass } from '../../hooks/useTouchGrass';

type WidgetKey = 'event' | 'alerts' | 'ask' | 'comingup' | 'activity' | 'quiz' | 'coop';
type WidgetState = { key: WidgetKey; size: WidgetSize };

const DEFAULT_LAYOUT: WidgetState[] = [
  { key: 'event', size: 'half' },
  { key: 'alerts', size: 'half' },
  { key: 'comingup', size: 'full' },
  { key: 'ask', size: 'full' },
  { key: 'activity', size: 'full' },
  { key: 'quiz', size: 'full' },
  { key: 'coop', size: 'full' }
];

const EMPTY_LAYOUT: WidgetState[] = [
  { key: 'quiz', size: 'full' },
  { key: 'coop', size: 'full' }
];

const TITLES: Record<WidgetKey, string> = {
  event: 'This week',
  alerts: 'Notifications',
  comingup: 'Coming up',
  ask: 'Ask the group',
  activity: 'Activity',
  quiz: 'Quiz',
  coop: 'Co-op'
};

export default function HomeScreen() {
  const router = useRouter();
  const feed = useHomeFeed();
  const { events } = useEventsFeed();
  const { signals, onJoin, onDismiss } = useTouchGrass();

  const { empty, member } = feed;
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleSignals = (empty ? [] : signals).filter((s) => !dismissed.includes(s.id));
  /** Home shows the newest one only; Events carries the whole list */
  const signal = visibleSignals[0] ?? null;
  const [openSignal, setOpenSignal] = useState<GrassSignal | null>(null);
  const [showQuickCheck] = useState(true);
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<WidgetState[]>(DEFAULT_LAYOUT);
  const [ask, setAsk] = useState<'poll' | 'question' | null>(null);
  const nextEvent = events[0] ?? null;
  const [quizResultId] = useState<string | null>(null);

  useEffect(() => {
    setLayout(empty ? EMPTY_LAYOUT : DEFAULT_LAYOUT);
  }, [empty]);

  const visibleLayout = member ? layout : layout.filter((w) => w.key !== 'ask');

  const announcements: Announcement[] = [];
  if (signal) {
    announcements.push({
      id: `grass-${signal.id}`,
      kind: 'grass',
      content: (
        <View>
          <FreeSignalCard
            signal={signal}
            onOpen={() => setOpenSignal(signal)}
            onJoined={() => {
              void onJoin(signal.id);
              Alert.alert("You're in", 'Messages will open here when chat ships.');
            }}
            onDismiss={() => {
              void onDismiss(signal.id);
              setDismissed((d) => [...d, signal.id]);
            }}
          />
          {visibleSignals.length > 1 ? (
            <Pressable
              onPress={() => router.push('/(tabs)/events')}
              accessibilityRole="button"
              className="mt-2"
            >
              <Text className="font-sans-b text-[12px] text-ink-mute underline">
                {visibleSignals.length - 1} more free · see them on Events
              </Text>
            </Pressable>
          ) : null}
        </View>
      )
    });
  }
  if (!empty && !editing && showQuickCheck) {
    announcements.push({
      id: 'quick-check',
      kind: 'quickCheck',
      content: <FreshnessCard />
    });
  }
  if (!empty) {
    feed.coopAnnouncements
      .filter((a) => !dismissed.includes(a.id))
      .forEach((a) =>
        announcements.push({
          id: a.id,
          kind: 'coop',
          content: (
            <CoopAnnouncementCard
              announcement={a}
              onOpen={() => Alert.alert('Co-op', 'Co-op portal ships next.')}
              onDismiss={() => setDismissed((d) => [...d, a.id])}
            />
          )
        })
      );
  }

  function toggleSize(index: number) {
    setLayout((prev) =>
      prev.map((w, i) => (i === index ? { ...w, size: w.size === 'full' ? 'half' : 'full' } : w))
    );
  }

  function moveWidget(index: number, dir: -1 | 1) {
    setLayout((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  }

  function renderBody(widget: WidgetState) {
    switch (widget.key) {
      case 'event':
        return nextEvent ? (
          <NextEventWidget
            event={nextEvent}
            size={widget.size}
            onOpen={() => router.push('/(tabs)/events')}
            onSeeAll={() => router.push('/(tabs)/events')}
          />
        ) : (
          <Text className="font-sans-sb text-[13px] text-ink-mute">Nothing this week yet.</Text>
        );
      case 'alerts':
        return (
          <AlertsWidget
            size={widget.size}
            rows={feed.notifications}
            onOpen={() => Alert.alert('Notifications', 'Full notifications page ships next.')}
          />
        );
      case 'comingup':
        return (
          <ComingUpWidget
            items={feed.comingUp}
            onOpenPerson={() => router.push('/(tabs)/friends')}
          />
        );
      case 'ask':
        return (
          <AskWidget
            member={member}
            initialPolls={feed.polls}
            onAsk={(k) => setAsk(k)}
            onSeePrevious={() => Alert.alert('Polls', 'Previous polls archive ships next.')}
          />
        );
      case 'activity':
        return feed.weeklyActivity ? (
          <ActivityWidget
            size={widget.size}
            activity={feed.weeklyActivity}
            onOpen={() => Alert.alert('Activity', 'Weekly activity collage ships next.')}
          />
        ) : null;
      case 'quiz':
        return feed.quiz ? (
          <QuizWidget
            size={widget.size}
            quiz={feed.quiz}
            resultId={quizResultId}
            onTake={() => Alert.alert('Quiz', 'Quiz take flow ships next.')}
            onOpenResult={() => Alert.alert('Quiz', 'Results dashboard ships next.')}
          />
        ) : null;
      case 'coop':
        return (
          <CoopWidget
            size={widget.size}
            member={member}
            onOpen={() => Alert.alert('Co-op', 'Co-op portal ships next.')}
          />
        );
    }
  }

  return (
    <Screen tone="canvas">
      <ScreenHeader
        title="Home"
        messagesDormant
        trailing={
          <ButtonSecondary
            size="sm"
            tone={editing ? 'solid' : 'outline'}
            onPress={() => setEditing((v) => !v)}
            accessibilityLabel={editing ? 'Done editing Home' : 'Edit Home layout'}
          >
            {editing ? 'Done' : 'Edit'}
          </ButtonSecondary>
        }
      />

      <ScreenBody>
        {announcements.length > 0 ? <AnnouncementsCarousel items={announcements} /> : null}

        <View>
          <PixelHeading size="md" className="mb-2">
            Stories
          </PixelHeading>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="-mx-5"
            contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 10 }}
          >
            {empty || !feed.myStory ? (
              <AddStoryTile onPress={() => Alert.alert('Capture', 'Story camera ships next.')} />
            ) : (
              <StoryTile
                story={feed.myStory}
                mine
                onOpen={() => Alert.alert('Story', 'Story viewer ships next.')}
                onAdd={() => Alert.alert('Capture', 'Story camera ships next.')}
              />
            )}
            {(empty ? [] : feed.stories).map((s) => (
              <StoryTile
                key={s.id}
                story={s}
                onOpen={() => Alert.alert('Story', 'Story viewer ships next.')}
              />
            ))}
          </ScrollView>
          {empty ? (
            <Text className="mt-2.5 font-sans-sb text-[13px] text-ink-mute">
              Post the first one. Your friends see it when they join.
            </Text>
          ) : (
            <StoryRepliesRow
              replies={feed.replies}
              onOpen={() => Alert.alert('Replies', 'Story replies thread ships next.')}
            />
          )}
        </View>

        {empty ? (
          <View className="mt-5">
            <ColdStart onAdd={() => router.push('/(tabs)/friends')} />
          </View>
        ) : null}

        {editing ? (
          <Text className="mt-5 font-sans-sb text-[12px] text-ink-mute">
            Use the arrows to reorder. Tap the corner to switch width.
          </Text>
        ) : null}

        <View className="mt-7 flex-row flex-wrap justify-between gap-y-7">
          {visibleLayout.map((widget, i) => (
            <HomeWidget
              key={widget.key}
              title={TITLES[widget.key]}
              size={widget.size}
              editing={editing}
              canMoveUp={i > 0}
              canMoveDown={i < visibleLayout.length - 1}
              onMoveUp={() => moveWidget(layout.indexOf(widget), -1)}
              onMoveDown={() => moveWidget(layout.indexOf(widget), 1)}
              onToggleSize={() => toggleSize(layout.findIndex((w) => w.key === widget.key))}
            >
              {renderBody(widget)}
            </HomeWidget>
          ))}
        </View>
      </ScreenBody>

      <AskSheet open={ask !== null} kind={ask ?? 'poll'} onClose={() => setAsk(null)} />
      <GrassSignalSheet
        signal={openSignal}
        onClose={() => setOpenSignal(null)}
        onJoin={() => {
          if (openSignal) void onJoin(openSignal.id);
          setOpenSignal(null);
          Alert.alert("You're in", 'Messages will open here when chat ships.');
        }}
      />
    </Screen>
  );
}

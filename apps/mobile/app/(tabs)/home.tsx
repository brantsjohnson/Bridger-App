// ============================================
// WHAT THIS FILE DOES (plain English):
// The Home tab — ported from Magic Patterns. Announcements, stories, editable
// widgets. Data comes from hooks (demo fixtures or live API) so this screen
// is the real product either way. Touch Grass *send* lives on Events.
// Analytics: opens the home surface; child components carry HOME.* ids.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import {
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  SectionTitle
} from '@bridger/ui';
import {
  DEFAULT_HOME_LAYOUT,
  HOME,
  openSurface,
  trackProduct,
  type GrassSignal,
  type HomeWidgetDefault
} from '@bridger/shared';
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
import { getHomeLayout, saveHomeLayout } from '../../data/feed';
import { startThreadWith } from '../../data/messages';
import { isDemoMode } from '../../lib/demo';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import { useTouchGrass } from '../../hooks/useTouchGrass';

type WidgetKey = 'event' | 'alerts' | 'ask' | 'comingup' | 'activity' | 'quiz' | 'coop';
type WidgetState = { key: WidgetKey; size: WidgetSize };

const WIDGET_KEYS = new Set<WidgetKey>([
  'event',
  'alerts',
  'ask',
  'comingup',
  'activity',
  'quiz',
  'coop'
]);

function toWidgetState(rows: HomeWidgetDefault[]): WidgetState[] {
  return rows
    .filter((w): w is HomeWidgetDefault & { key: WidgetKey } => WIDGET_KEYS.has(w.key as WidgetKey))
    .map((w) => ({ key: w.key as WidgetKey, size: w.size }));
}

const DEFAULT_LAYOUT: WidgetState[] = toWidgetState(DEFAULT_HOME_LAYOUT);

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

// Short "what is this section?" copy for the info bubble on each widget title.
const DESCRIPTIONS: Record<WidgetKey, string> = {
  event: 'Everything happening in your group over the next few days, gathered in one spot.',
  alerts:
    'New activity meant for you, like replies, invites, and requests. Tap See all to view everything.',
  comingup: 'A look ahead at events and plans on the horizon so nothing sneaks up on you.',
  ask: 'Start a quick poll or question for your group and see what everyone thinks.',
  activity: "This week's group prompt. Join in and see what everyone else posted.",
  quiz: 'A short weekly quiz that helps your friends get to know you better.',
  coop: 'The member side of Bridger. Vote, give feedback, and help shape what gets built.'
};

// Analytics section name + info trigger id for each Home widget.
const INFO: Record<WidgetKey, { section: string; infoAnalyticsId: string }> = {
  event: { section: 'this_week', infoAnalyticsId: HOME.this_week.info },
  alerts: { section: 'notifications_preview', infoAnalyticsId: HOME.notifications_preview.info },
  comingup: { section: 'coming_up', infoAnalyticsId: HOME.coming_up.info },
  ask: { section: 'ask_the_group', infoAnalyticsId: HOME.ask_the_group.info },
  activity: { section: 'activity', infoAnalyticsId: HOME.activity.info },
  quiz: { section: 'quiz', infoAnalyticsId: HOME.quiz.info },
  coop: { section: 'coop', infoAnalyticsId: HOME.coop.info }
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
  // Prefer a result already saved on the quiz payload (live complete).
  const quizResultId = feed.quiz?.resultId ?? null;

  // Mark Home as the active analytics surface when this tab opens.
  useEffect(() => {
    openSurface('home');
  }, []);

  // Load saved / admin Home layout (demo stays on the seeded DEFAULT_LAYOUT).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (empty) {
        setLayout(EMPTY_LAYOUT);
        return;
      }
      if (isDemoMode()) {
        setLayout(DEFAULT_LAYOUT);
        return;
      }
      try {
        const rows = await getHomeLayout();
        if (!cancelled) {
          const mapped = toWidgetState(rows);
          setLayout(mapped.length ? mapped : DEFAULT_LAYOUT);
        }
      } catch {
        if (!cancelled) setLayout(DEFAULT_LAYOUT);
      }
    })();
    return () => {
      cancelled = true;
    };
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
            analyticsIds={{
              card: HOME.announcements.card,
              imIn: HOME.announcements.touch_grass_im_in,
              details: HOME.announcements.touch_grass_details,
              dismiss: HOME.announcements.touch_grass_dismiss
            }}
            onOpen={() => setOpenSignal(signal)}
            onJoined={() => {
              void onJoin(signal.id);
              void (async () => {
                const id = await startThreadWith(signal.personId);
                router.push({
                  pathname: '/messages/[id]',
                  params: { id, seed: "I'm in" }
                });
              })();
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
            onOpen={() =>
              router.push({ pathname: '/event/[id]', params: { id: nextEvent.id } })
            }
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
            onOpenPerson={(personId) =>
              router.push({ pathname: '/person/[id]', params: { id: personId } })
            }
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
            onTake={() => router.push(`/quiz/${feed.quiz!.id}` as Href)}
            onOpenResult={() => router.push(`/quiz/${feed.quiz!.id}` as Href)}
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
        analyticsSurface="home"
        titleAnalyticsId={HOME.top_nav.page_title}
        profileAnalyticsId={HOME.top_nav.profile_icon}
        trailing={
          // Analytics: enter / leave Home layout edit mode.
          <ButtonSecondary
            size="sm"
            className="h-10"
            tone={editing ? 'solid' : 'light'}
            onPress={() => {
              if (editing) {
                // Done editing: persist layout (demo keeps it session-only).
                void saveHomeLayout(layout.map((w) => ({ key: w.key, size: w.size })));
              }
              setEditing((v) => !v);
            }}
            accessibilityLabel={editing ? 'Done editing Home' : 'Edit Home layout'}
            analyticsId={HOME.top_nav.edit_layout}
          >
            {editing ? 'Done' : 'Edit'}
          </ButtonSecondary>
        }
      />

      <ScreenBody>
        {announcements.length > 0 ? <AnnouncementsCarousel items={announcements} /> : null}

        <View>
          {/* Stories title: dashed underline + short "what is this?" bubble */}
          <SectionTitle
            title="Stories"
            description="Quick updates your friends post about their week. Tap one to watch, or add your own."
            infoAnalyticsId={HOME.stories_row.info}
            parentScreen="home"
            section="stories_row"
            className="mb-2"
          />
          {/*
            Bleed past ScreenBody's side padding so story tiles can scroll off
            the right edge of the screen. paddingLeft keeps the first tile lined
            up with the "Stories" heading; paddingRight lets the last one peek out.
          */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -20 }}
            contentContainerStyle={{
              gap: 10,
              paddingLeft: 20,
              paddingRight: 20,
              paddingBottom: 10
            }}
          >
            {empty || !feed.myStory ? (
              <AddStoryTile onPress={() => router.push('/story/capture')} />
            ) : (
              <StoryTile
                story={feed.myStory}
                mine
                onOpen={() => {
                  // Tray order so finishing one story opens the next friend.
                  const seq = [
                    'me',
                    ...(empty ? [] : feed.stories).map((s) => s.authorId)
                  ].join(',');
                  router.push(`/story/me?sequence=${seq}`);
                }}
                onAdd={() => router.push('/story/capture')}
              />
            )}
            {(empty ? [] : feed.stories).map((s) => (
              <StoryTile
                key={s.id}
                story={s}
                onOpen={() => {
                  const seq = [
                    ...(feed.myStory ? ['me'] : []),
                    ...feed.stories.map((x) => x.authorId)
                  ].join(',');
                  router.push(`/story/${s.authorId}?sequence=${seq}`);
                }}
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
              onOpen={() => router.push('/story/me?comments=1')}
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

        <View className="mt-7 flex-row flex-wrap items-stretch justify-between gap-y-7">
          {visibleLayout.map((widget, i) => (
            <HomeWidget
              key={widget.key}
              title={TITLES[widget.key]}
              description={DESCRIPTIONS[widget.key]}
              infoAnalyticsId={INFO[widget.key].infoAnalyticsId}
              section={INFO[widget.key].section}
              size={widget.size}
              editing={editing}
              index={i}
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
        parentScreen="home"
        onClose={() => setOpenSignal(null)}
        onDecline={(id) => {
          void onDismiss(id);
          setDismissed((d) => [...d, id]);
        }}
        onJoin={() => {
          if (openSignal) {
            const personId = openSignal.personId;
            void onJoin(openSignal.id);
            // Product outcome from the detail sheet path (card path emits inside FreeSignalCard).
            trackProduct('touch_grass_answered');
            setOpenSignal(null);
            void (async () => {
              const id = await startThreadWith(personId);
              router.push({
                pathname: '/messages/[id]',
                params: { id, seed: "I'm in" }
              });
            })();
            return;
          }
          setOpenSignal(null);
        }}
      />
    </Screen>
  );
}

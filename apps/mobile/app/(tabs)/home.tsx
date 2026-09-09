// ============================================
// WHAT THIS FILE DOES (plain English):
// The Home tab — ported from Magic Patterns. Announcements (including friend
// Touch Grass signals you can answer), stories, and editable widgets. Touch
// Grass *send* lives on Events; the Friend Pod lives on the Friends tab.
// Analytics: home surface; child components carry HOME.* ids.
// ============================================
import React, { useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, Text, View } from 'react-native';
import { type Href, useFocusEffect, useRouter } from 'expo-router';
import {
  ButtonSecondary,
  Screen,
  ScreenBody,
  ScreenHeader,
  SectionTitle,
  TAB_COLOR
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
import { hrefForCoopAnnouncement } from '../../lib/coop-links';
import { pathForNotification } from '../../lib/notification-routes';
import {
  Announcement,
  AnnouncementsCarousel,
  CoopAnnouncementCard
} from '../../components/home/AnnouncementsCarousel';
import { AgentWidget } from '../../components/assistant/AgentWidget';
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
import { WelcomeCelebration } from '../../components/home/WelcomeCelebration';
import { ComingUpWidget } from '../../components/home/ComingUpWidget';
import { FreshnessCard } from '../../components/home/FreshnessCard';
import { IntroAnnouncementCard } from '../../components/home/IntroAnnouncementCard';
import { StoryRepliesRow } from '../../components/home/StoryRepliesRow';
import { fetchAssistantSettings } from '../../data/assistant';
import { getHomeLayout, saveHomeLayout, clearStoryReplyNotifications } from '../../data/feed';
import { startThreadWith } from '../../data/messages';
import {
  notifyTabAttentionChanged,
  type AttentionSection
} from '../../data/tab-badges';
import {
  hasDismissedAnnouncementsIntro,
  markAnnouncementsIntroDismissed
} from '../../lib/announcements-intro';
import {
  hasDismissedComingUpEmpty,
  markComingUpEmptyDismissed
} from '../../lib/coming-up-empty';
import {
  loadPlaceholderDismissals,
  markPlaceholderDismissed,
  type HomePlaceholderSection
} from '../../lib/home-placeholders';
import { isDemoMode } from '../../lib/demo';
import { loadPeople } from '../../lib/people-cache';
import {
  consumeWelcomeCelebration,
  subscribeWelcomeCelebration
} from '../../lib/welcome-celebration';
import { DevPreviewBar } from '../../components/home/DevPreviewBar';
import {
  EventExampleCard,
  NotificationExampleCard
} from '../../components/home/HomeExamplePlaceholders';
import { useEventsFeed } from '../../hooks/useEventsFeed';
import { useHomeFeed } from '../../hooks/useHomeFeed';
import { useTabAttention } from '../../hooks/useTabAttention';
import { useTouchGrass } from '../../hooks/useTouchGrass';
import { QUIZ } from '../../data/fixtures/catalog';
import { HOME_COVER_FACES } from '../../quizzes/what-j-name/images';

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
  activity: 'Side Quest',
  quiz: 'Quiz',
  coop: 'Co-op'
};

// Short "what is this section?" copy for the info bubble on each widget title.
const DESCRIPTIONS: Record<WidgetKey, string> = {
  event: 'Everything happening in your group over the next few days, gathered in one spot.',
  alerts:
    'New activity meant for you, like replies, invites, and requests. Tap the card (or See all) to view everything. Tap one row to open that item.',
  comingup: 'A look ahead at events and plans on the horizon so nothing sneaks up on you.',
  ask: 'Start a quick poll or question for your group and see what everyone thinks.',
  activity:
    "This week's group Side Quest. Join in and see what everyone else posted.",
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

/**
 * Standing J-name quiz card when the live feed has no quiz yet. Always
 * takeable so Home never shows an empty Quiz shell.
 */
const STANDING_JNAME_QUIZ = {
  id: QUIZ.id,
  title: QUIZ.title,
  description: 'Find out which J name you are. Share it with friends.',
  comparable: QUIZ.comparable,
  cover: QUIZ.cover,
  coverImages: HOME_COVER_FACES,
  results: QUIZ.results.map((r) => ({ ...r, friendIds: [] as string[] })),
  resultId: null as string | null,
  myResultLabel: null as string | null,
  myResultPercent: null as number | null
};

export default function HomeScreen() {
  const router = useRouter();
  const feed = useHomeFeed();
  const { events } = useEventsFeed();
  // Answer path only — send button stays on Events.
  const { signals, onJoin, onDismiss } = useTouchGrass();
  // THIS SECTION DOES: section title dots after the Home nav-bar badge clears.
  const { sectionDots } = useTabAttention('home');
  const homeDot = TAB_COLOR.home;

  const { empty, member } = feed;
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visibleSignals = (empty ? [] : signals).filter((s) => !dismissed.includes(s.id));
  /** Home shows the newest one only; Events carries the whole list */
  const signal = visibleSignals[0] ?? null;
  const [openSignal, setOpenSignal] = useState<GrassSignal | null>(null);
  // Demo only: seed a sample quick-check so designers can swipe the strip.
  // Live never shows a fake freshness ask — real prompts come from the model later.
  const [showQuickCheck, setShowQuickCheck] = useState(() => isDemoMode());
  // One-time "what Announcements are" card until the person dismisses it.
  const [showIntro, setShowIntro] = useState(false);
  // THIS SECTION DOES: remember which Example placeholders were already tapped
  // so empty This week / Notifications hide until real content arrives.
  const [placeholderGone, setPlaceholderGone] = useState<
    Record<HomePlaceholderSection, boolean>
  >({ event: false, alerts: false });
  // Empty Coming up teach card: hide the whole section after X until real items.
  const [comingUpEmptyGone, setComingUpEmptyGone] = useState(false);
  const [editing, setEditing] = useState(false);
  const [layout, setLayout] = useState<WidgetState[]>(DEFAULT_LAYOUT);
  const [ask, setAsk] = useState<'poll' | 'question' | null>(null);
  // THIS SECTION DOES: show the Bridge widget under Stories only when opted in.
  const [assistantOn, setAssistantOn] = useState(false);
  const nextEvent = events[0] ?? null;
  // Prefer a result already saved on the quiz payload (live complete).
  const quizResultId = feed.quiz?.resultId ?? null;

  // THIS SECTION DOES: play the welcome fireworks once, only right after
  // finishing onboarding. We check on mount AND subscribe so an already-mounted
  // Home still wakes up when onboarding marks the flag. consume latches, so a
  // later remount (e.g. closing the post composer) can never replay the party.
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    const tryShow = () => {
      if (consumeWelcomeCelebration()) setCelebrate(true);
    };
    tryShow();
    return subscribeWelcomeCelebration(tryShow);
  }, []);

  // THIS SECTION DOES: decide whether to show the one-time Announcements intro
  // and whether the empty Coming up teach card was already closed (live only).
  useEffect(() => {
    if (isDemoMode()) return;
    let cancelled = false;
    void hasDismissedAnnouncementsIntro().then((dismissed) => {
      if (!cancelled) setShowIntro(!dismissed);
    });
    void hasDismissedComingUpEmpty().then((dismissed) => {
      if (!cancelled) setComingUpEmptyGone(dismissed);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Mark Home as the active analytics surface when this tab opens.
  useEffect(() => {
    openSurface('home');
  }, []);

  // THIS SECTION DOES: re-check Assistant opt-in whenever Home is focused.
  // Also reload Example-dismiss flags so returning from Events/Notifications
  // can hide those sections once the placeholder was tapped.
  useFocusEffect(
    React.useCallback(() => {
      let cancelled = false;
      // Soft-fail: never let a missing API URL / network blip crash Home on open.
      void fetchAssistantSettings()
        .then((s) => {
          if (!cancelled) setAssistantOn(Boolean(s.assistantEnabled));
        })
        .catch(() => {
          if (!cancelled) setAssistantOn(false);
        });
      void loadPlaceholderDismissals().then((flags) => {
        if (!cancelled) setPlaceholderGone(flags);
      });
      // Refresh your face URL so the header never sticks on a demo/stale photo.
      if (!isDemoMode()) void loadPeople();
      return () => {
        cancelled = true;
      };
    }, [])
  );

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

  const visibleLayout = (member ? layout : layout.filter((w) => w.key !== 'ask')).filter(
    (w) => {
      // THIS SECTION DOES: hide empty Example sections after the person tapped
      // them, until real content fills the slot again.
      if (w.key === 'event') {
        return Boolean(nextEvent) || !placeholderGone.event;
      }
      if (w.key === 'alerts') {
        const hasUnread = feed.notifications.some((n) => n.unread !== false);
        return hasUnread || !placeholderGone.alerts;
      }
      // Empty Coming up: show the blue teach card until they hit X.
      if (w.key === 'comingup') {
        return feed.comingUp.length > 0 || !comingUpEmptyGone;
      }
      return true;
    }
  );

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
      content: (
        <FreshnessCard
          // X only closes the card — "Kept it." is reserved for tapping Yes.
          onDismiss={() => setShowQuickCheck(false)}
        />
      )
    });
  }
  // Live: one-time intro when nothing else is in the strip yet (and they have
  // not dismissed it). Explains co-op notes + app news; tap or X closes forever.
  if (!isDemoMode() && !empty && !editing && showIntro && announcements.length === 0) {
    announcements.push({
      id: 'announcements-intro',
      kind: 'intro',
      content: (
        <IntroAnnouncementCard
          onDismiss={() => {
            setShowIntro(false);
            void markAnnouncementsIntroDismissed();
          }}
        />
      )
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
              onOpen={() => {
                // Fake demo copy is fine; the tap must open the real portal.
                const dest = hrefForCoopAnnouncement(a);
                if (dest.kind === 'external') {
                  void Linking.openURL(dest.href);
                  return;
                }
                router.push(dest.href as Href);
              }}
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
        // THIS SECTION DOES: show the next event, or a seeded Event Example
        // until they tap it (then the section hides until a real event exists).
        if (nextEvent) {
          return (
            <NextEventWidget
              event={nextEvent}
              size={widget.size}
              onOpen={() =>
                router.push({ pathname: '/event/[id]', params: { id: nextEvent.id } })
              }
            />
          );
        }
        return (
          <EventExampleCard
            size={widget.size}
            onPress={() => {
              setPlaceholderGone((p) => ({ ...p, event: true }));
              void markPlaceholderDismissed('event');
              router.push('/(tabs)/events');
            }}
          />
        );
      case 'alerts': {
        // THIS SECTION DOES: real unread rows, or a Notification Example that
        // self-hides after they open Notifications.
        const hasUnread = feed.notifications.some((n) => n.unread !== false);
        if (hasUnread) {
          return (
            <AlertsWidget
              size={widget.size}
              rows={feed.notifications}
              onOpen={(n) => {
                trackProduct('notification_opened', { kind: n.kind, source: 'preview' });
                router.push(pathForNotification(n) as Href);
              }}
              onSeeAll={() => {
                trackProduct('notification_see_all');
                router.push('/notifications' as Href);
              }}
            />
          );
        }
        return (
          <NotificationExampleCard
            size={widget.size}
            onPress={() => {
              setPlaceholderGone((p) => ({ ...p, alerts: true }));
              void markPlaceholderDismissed('alerts');
              trackProduct('notification_see_all');
              router.push('/notifications' as Href);
            }}
          />
        );
      }
      case 'comingup':
        return (
          <ComingUpWidget
            items={feed.comingUp}
            onOpenPerson={(personId) =>
              router.push({ pathname: '/person/[id]', params: { id: personId } })
            }
            onDismissEmpty={() => {
              setComingUpEmptyGone(true);
              void markComingUpEmptyDismissed();
            }}
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
            onOpen={() => router.push('/activity' as Href)}
          />
        ) : null;
      case 'quiz': {
        // THIS SECTION DOES: always show Which J name are you (live quiz or
        // standing prompt). Never leave an empty Quiz shell. Completed state
        // comes from jname_results (resultId / myResultLabel), even when the
        // standing fallback card is used.
        const quiz = feed.quiz ?? STANDING_JNAME_QUIZ;
        const standing = !feed.quiz;
        const completedId =
          quiz.myResultLabel ?? quiz.resultId ?? quizResultId ?? null;
        return (
          <QuizWidget
            size={widget.size}
            quiz={quiz}
            resultId={completedId}
            takeAnalyticsId={standing && !completedId ? HOME.quiz.take_prompt : undefined}
            onTake={() => router.push(`/quiz/${quiz.id}` as Href)}
            onOpenResult={() => router.push(`/quiz/${quiz.id}` as Href)}
          />
        );
      }
      case 'coop':
        return (
          <CoopWidget
            size={widget.size}
            member={member}
            onOpen={() =>
              router.push((member ? '/coop/portal' : '/coop') as Href)
            }
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
        {isDemoMode() ? <DevPreviewBar /> : null}

        {announcements.length > 0 ? <AnnouncementsCarousel items={announcements} /> : null}

        <View>
          {/* Stories title: dashed underline + short "what is this?" bubble */}
          <SectionTitle
            title="Scrapbooks"
            description="Pages your friends make about their day. Tap one to look, or start your own."
            infoAnalyticsId={HOME.stories_row.info}
            parentScreen="home"
            section="stories_row"
            className="mb-2"
            showDot={!!sectionDots.stories_row}
            dotColor={homeDot}
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
                  // From you forward through the tray; finish one → next friend.
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
                  // Start at the friend you tapped, then keep going down the tray.
                  const ids = [
                    ...(feed.myStory ? ['me'] : []),
                    ...feed.stories.map((x) => x.authorId)
                  ];
                  const at = ids.indexOf(s.authorId);
                  const seq = (at >= 0 ? ids.slice(at) : ids).join(',');
                  router.push(`/story/${s.authorId}?sequence=${seq}`);
                }}
              />
            ))}
          </ScrollView>
          {empty ? (
            <Text className="mt-2.5 font-sans-sb text-[13px] text-ink-mute">
              Start your scrapbook! Your friends see it when they join.
            </Text>
          ) : (
            <StoryRepliesRow
              replies={feed.replies}
              onOpenHeader={() => {
                // Header = open the whole inbox → clear every waiting chip.
                clearStoryReplyNotifications();
                notifyTabAttentionChanged();
                router.push('/story/me?comments=1');
              }}
              onOpenChip={(personId) => {
                // One chip → only that person leaves the row (NOTIFICATIONS.md).
                clearStoryReplyNotifications({ personId });
                notifyTabAttentionChanged();
                router.push(`/story/me?comments=1&replyAuthor=${personId}`);
              }}
            />
          )}
          {/* Bridge widget under Stories (only when Settings opt-in is on). */}
          {assistantOn ? <AgentWidget /> : null}
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
              showDot={!!sectionDots[INFO[widget.key].section as AttentionSection]}
              dotColor={homeDot}
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

      {/* THE PARTY: black see-through overlay with fireworks + "You did it!",
          shown once right after onboarding, tap anywhere to continue. */}
      {celebrate ? <WelcomeCelebration onDone={() => setCelebrate(false)} /> : null}
    </Screen>
  );
}

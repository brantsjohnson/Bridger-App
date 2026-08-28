import React from 'react';
import {
  Breathe,
  ButtonSecondary,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader } from
'../../../../packages/ui';
import { GrassSignal } from '../../../../packages/shared';
import { AddStoryTile, StoryTile } from '../../components/StoryTile';
import { FreeSignalCard } from '../../components/FreeSignalCard';
import { ColdStart } from '../../components/ColdStart';
import { HomeWidget, WidgetSize } from '../../components/home/HomeWidget';
import {
  ActivityWidget,
  AlertsWidget,
  CoopWidget,
  NextEventWidget,
  QuizWidget } from
'../../components/home/widgets';
import { AskWidget } from '../../components/home/AskWidget';
import { AskSheet } from '../../components/home/AskSheet';
import { ComingUpWidget } from '../../components/home/ComingUpWidget';
import { FreshnessCard } from '../../components/home/FreshnessCard';
import {
  Announcement,
  AnnouncementsCarousel,
  CoopAnnouncementCard } from
'../../components/home/AnnouncementsCarousel';
import { COOP_ANNOUNCEMENTS } from '../../state/coop';
import { StoryRepliesRow } from '../../components/home/StoryRepliesRow';
import { GrassSignalSheet } from '../../components/GrassSignalSheet';
import { EVENTS, FREE_SIGNALS, MY_STORY, STORIES } from '../../state/mock-data';

/**
 * Touch grass lives at the top of Events, the Friend Pod and Inside jokes live on
 * Friends. Home keeps what you catch up on.
 */
type WidgetKey = 'event' | 'alerts' | 'ask' | 'comingup' | 'activity' | 'quiz' | 'coop';

type WidgetState = {key: WidgetKey;size: WidgetSize;};

const DEFAULT_LAYOUT: WidgetState[] = [
{ key: 'event', size: 'half' },
{ key: 'alerts', size: 'half' },
{ key: 'comingup', size: 'full' },
{ key: 'ask', size: 'full' },
{ key: 'quiz', size: 'full' },
{ key: 'activity', size: 'full' },
{ key: 'coop', size: 'full' }];


/** Day one. Everything else needs friends before it means anything. */
const EMPTY_LAYOUT: WidgetState[] = [
{ key: 'quiz', size: 'full' },
{ key: 'coop', size: 'full' }];


const TITLES: Record<WidgetKey, string> = {
  event: 'This week',
  alerts: 'Notifications',
  comingup: 'Coming up',
  ask: 'Ask the group',
  activity: 'Activity',
  quiz: 'Quiz',
  coop: 'Co-op'
};

export function HomeScreen({
  onOpenTab,
  quizResultId = null,
  empty = false,
  member = false







}: {onOpenTab?: (tab: string) => void;quizResultId?: string | null; /** co-op member — changes what the co-op card says */member?: boolean; /** day one: no friends, no stories, nothing on the calendar */empty?: boolean;}) {
  const [dismissed, setDismissed] = React.useState<string[]>([]);
  const signals = (empty ? [] : FREE_SIGNALS).filter((s) => !dismissed.includes(s.id));
  /** Home shows the newest one only; Events carries the whole list */
  const signal = signals[0] ?? null;
  const [openSignal, setOpenSignal] = React.useState<GrassSignal | null>(null);
  /** the profile re-check only appears when the model looks stale */
  const [showQuickCheck] = React.useState(true);
  const [editing, setEditing] = React.useState(false);
  const [layout, setLayout] = React.useState<WidgetState[]>(
    /** only the things you can do alone until there are people here */
    empty ? EMPTY_LAYOUT : DEFAULT_LAYOUT
  );
  /* asking the group is co-op only — non-members don't see the slot at all */
  const visibleLayout = member ? layout : layout.filter((w) => w.key !== 'ask');
  const [ask, setAsk] = React.useState<'poll' | 'question' | null>(null);
  const nextEvent = EVENTS[0];

  /**
   * Announcements: touch grass, the quick check, and co-op notes all live in
   * one carousel. Any of them can be absent, and when they all are the section
   * disappears — there's no empty announcements tab.
   */
  const announcements: Announcement[] = [];
  if (signal) {
    announcements.push({
      id: `grass-${signal.id}`,
      kind: 'grass',
      content:
      <div>
          <FreeSignalCard
          signal={signal}
          onOpen={() => setOpenSignal(signal)}
          onJoined={() => onOpenTab?.('thread-grass')}
          onDismiss={() => setDismissed((d) => [...d, signal.id])} />
        
          {signals.length > 1 &&
        <button
          type="button"
          onClick={() => onOpenTab?.('events')}
          className="mt-2 text-[12px] font-bold text-ink-mute underline decoration-ink-line underline-offset-2 hover:text-ink">
          
              {signals.length - 1} more free — see them on Events
            </button>
        }
        </div>

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
    COOP_ANNOUNCEMENTS.filter((a) => !dismissed.includes(a.id)).forEach((a) =>
    announcements.push({
      id: a.id,
      kind: 'coop',
      content:
      <CoopAnnouncementCard
        announcement={a}
        onOpen={() => onOpenTab?.('coop')}
        onDismiss={() => setDismissed((d) => [...d, a.id])} />


    })
    );
  }

  const [dragIndex, setDragIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  /** Insert at the hovered slot rather than swapping, so it lands where you drop it. */
  const drop = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      setLayout((prev) => {
        const next = [...prev];
        const [moved] = next.splice(dragIndex, 1);
        next.splice(overIndex, 0, moved);
        return next;
      });
    }
    setDragIndex(null);
    setOverIndex(null);
  };

  const toggleSize = (index: number) =>
  setLayout((prev) =>
  prev.map((w, i) => i === index ? { ...w, size: w.size === 'full' ? 'half' : 'full' } : w)
  );

  const renderBody = (widget: WidgetState) => {
    switch (widget.key) {
      case 'event':
        return (
          <NextEventWidget
            event={nextEvent}
            size={widget.size}
            onOpen={() => onOpenTab?.('event-host')}
            onSeeAll={() => onOpenTab?.('events')} />);


      case 'alerts':
        return <AlertsWidget size={widget.size} onOpen={() => onOpenTab?.('notifications')} />;
      case 'comingup':
        return (
          <ComingUpWidget
            onOpenPerson={(id) => onOpenTab?.(`person:${id}`)}
          />
        );
      case 'ask':
        return (
          <AskWidget
            member={member}
            onAsk={(k) => setAsk(k)}
            onJoinCoop={() => onOpenTab?.('coop')}
            onSeePrevious={() => onOpenTab?.('polls')} />);


      case 'activity':
        return <ActivityWidget size={widget.size} onOpen={() => onOpenTab?.('activity')} />;
      case 'quiz':
        return (
          <QuizWidget
            size={widget.size}
            resultId={quizResultId}
            onTake={() => onOpenTab?.('quiz')}
            onOpenResult={() => onOpenTab?.('quiz-result')} />);


      case 'coop':
        return (
          <CoopWidget
            size={widget.size}
            member={member}
            onOpen={() => onOpenTab?.('coop')} />);


    }
  };

  return (
    <Screen>
      <ScreenHeader
        title="Home"
        trailing={
        <ButtonSecondary
          size="sm"
          tone={editing ? 'solid' : 'outline'}
          onClick={() => setEditing((v) => !v)}>
          
            {editing ? 'Done' : 'Edit'}
          </ButtonSecondary>
        } />
      
      <ScreenBody>
        {/* anything wanting attention today, in one swipeable spot */}
        {announcements.length > 0 &&
        <Breathe>
            <AnnouncementsCarousel items={announcements} />
          </Breathe>
        }

        {/* pinned — catch up stays under the signals */}
        <Breathe>
          <section className="!mt-0">
            <PixelHeading size="md" className="mb-2">
              Stories
            </PixelHeading>
            {/*
               overflow-x alone leaves the y axis "auto", which let the tray
               drift vertically. Lock y and pad for the "+" that hangs below.
              */}
            <div className="no-scrollbar -mx-5 flex gap-2.5 overflow-x-auto overflow-y-hidden px-5 pb-2.5">
              {/* posted already? your tile carries the "+" instead of a spare one */}
              {empty ?
              <AddStoryTile onClick={() => onOpenTab?.('capture')} /> :

              <StoryTile
                story={MY_STORY}
                mine
                onOpen={() => onOpenTab?.('story')}
                onAdd={() => onOpenTab?.('capture')} />

              }
              {(empty ? [] : STORIES).map((s) =>
              <StoryTile key={s.id} story={s} onOpen={() => onOpenTab?.('story')} />
              )}
            </div>
            {empty ?
            <p className="mt-2.5 text-[13px] font-semibold text-ink-mute">
                Post the first one. Your friends see it when they join.
              </p> : (

            /* what people said back, straight under the stories */
            <StoryRepliesRow onOpen={() => onOpenTab?.('story-comments')} />)
            }
          </section>
        </Breathe>

        {empty &&
        <Breathe>
            <div className="mt-5">
              <ColdStart onAdd={() => onOpenTab?.('friends')} />
            </div>
          </Breathe>
        }

        {editing &&
        <p className="mt-5 text-[12px] font-semibold text-ink-mute">
            Drag a widget where you want it. Tap the corner to switch width.
          </p>
        }

        <Breathe>
          <div className="mt-7 grid grid-cols-2 items-stretch gap-x-3.5 gap-y-7">
            {visibleLayout.map((widget, i) =>
            <HomeWidget
              key={widget.key}
              title={TITLES[widget.key]}
              size={widget.size}
              editing={editing}
              dragging={dragIndex === i}
              dropTarget={overIndex === i && dragIndex !== i}
              onDragStart={() => setDragIndex(i)}
              onDragEnter={() => dragIndex !== null && setOverIndex(i)}
              onDragEnd={drop}
              onToggleSize={() => toggleSize(i)}>
              
                {renderBody(widget)}
              </HomeWidget>
            )}
          </div>
        </Breathe>
      </ScreenBody>

      <AskSheet open={ask !== null} kind={ask ?? 'poll'} onClose={() => setAsk(null)} />
      <GrassSignalSheet
        signal={openSignal}
        onClose={() => setOpenSignal(null)}
        onJoin={() => {
          setOpenSignal(null);
          onOpenTab?.('thread-grass');
        }} />
      
    </Screen>);

}
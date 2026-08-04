import React from 'react';
import { ArrowUpRightIcon } from 'lucide-react';
import { EventItem } from '../../../../packages/shared';
import { ACCENTS, Avatar, Card, CoverArt, cn } from '../../../../packages/ui';
import { EventCard } from '../EventCard';
import { InsideJokeNote } from '../InsideJokeNote';
import { QuizCard } from '../QuizCard';
import { TouchGrassButton } from '../TouchGrassButton';
import { WeeklyActivityBanner } from '../WeeklyActivityCard';
import { INSIDE_JOKES, NOTIFICATIONS, personById } from '../../state/mock-data';
import { WidgetSize } from './HomeWidget';

/** Up next — compact at half width, the full event card at full width. */
export function NextEventWidget({
  event,
  size,
  onOpen,
  onSeeAll





}: {event: EventItem;size: WidgetSize;onOpen?: () => void;onSeeAll?: () => void;}) {
  if (size === 'full') {
    return (
      <div className="space-y-2">
        <EventCard event={event} onOpen={onOpen} />
        <button
          type="button"
          onClick={onSeeAll}
          className="text-[12px] font-bold text-purple">
          
          See all
        </button>
      </div>);

  }

  return (
    <div
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-card',
        ACCENTS[event.accent].tintSolid
      )}>
      
      <div className="h-14 shrink-0">
        <CoverArt
          cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
          accent={event.accent} />
        
      </div>
      <button
        type="button"
        onClick={onOpen}
        className="flex flex-1 flex-col px-4 pt-3 text-left transition-transform active:scale-[0.99]">
        
        <span className="block truncate text-[15px] font-bold tracking-tight text-ink">
          {event.title}
        </span>
        <span className="block truncate text-[12px] font-semibold text-ink-soft">
          {event.day} · {event.time}
        </span>
        <span className="mt-3 inline-flex w-fit rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-ink">
          {event.countdown}
        </span>
      </button>

      <button
        type="button"
        onClick={onSeeAll}
        className="mb-3 ml-4 mt-3 w-fit text-[11px] font-bold text-ink-soft underline decoration-ink/25 underline-offset-2">
        
        See all
      </button>
    </div>);

}

export function AlertsWidget({
  size,
  onOpen



}: {size: WidgetSize;onOpen?: () => void;}) {
  const unread = 2;
  const rows = NOTIFICATIONS.slice(0, 3);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full flex-col rounded-card border border-ink-line bg-white p-4 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]',
        size === 'half' && 'h-full'
      )}>
      
      {unread > 0 &&
      <span className="mb-2 flex h-5 w-fit items-center justify-center rounded-full bg-coral px-2 text-[11px] font-bold text-white">
          {unread} new
        </span>
      }

      <span className="space-y-2.5">
        {rows.map((n) => {
          const person = personById(n.personId);
          return (
            <span key={n.id} className="flex items-center gap-2">
              <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="xs" />
              <span className="min-w-0 flex-1 truncate text-[12px] leading-snug text-ink">
                <span className="font-bold">{person.name.split(' ')[0]}</span>{' '}
                <span className="font-medium text-ink-soft">{n.text}</span>
              </span>
              {size === 'full' &&
              <span className="shrink-0 text-[11px] font-semibold text-ink-mute">{n.time}</span>
              }
            </span>);

        })}
      </span>

      <span className="mt-3 text-[11px] font-bold text-purple">See all</span>
    </button>);

}

export function ActivityWidget({ size, onOpen }: {size: WidgetSize;onOpen?: () => void;}) {
  if (size === 'full') return <WeeklyActivityBanner onOpen={onOpen} />;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex h-full w-full flex-col justify-between rounded-[28px_10px_28px_10px] bg-[#FFDE99] p-4 text-left transition-transform active:scale-[0.99]">
      
      <span aria-hidden="true" className="text-[26px]">
        👕
      </span>
      <span className="mt-1.5 block truncate font-pixel text-[15px] text-ink">Band Tee Week</span>
      <span className="mt-1 block text-[12px] font-semibold text-ink-soft">5 posted</span>
    </button>);

}

export function QuizWidget({
  size,
  resultId,
  onTake,
  onOpenResult





}: {size: WidgetSize;resultId: string | null;onTake: () => void;onOpenResult: (id: string) => void;}) {
  if (size === 'full') {
    return <QuizCard resultId={resultId} onTake={onTake} onOpenResult={onOpenResult} />;
  }

  return (
    <button
      type="button"
      onClick={resultId ? () => onOpenResult(resultId) : onTake}
      className="flex h-full w-full flex-col justify-between rounded-[10px_28px_10px_28px] bg-[#D5C2FF] p-4 text-left transition-transform active:scale-[0.99]">
      
      <span aria-hidden="true" className="text-[26px]">
        🗺
      </span>
      <span className="mt-1.5 block text-[13px] font-bold leading-snug text-ink">
        {resultId ? 'Coastal cruiser' : 'Which road trip are you?'}
      </span>
      <span className="mt-1 block text-[11px] font-bold text-ink-soft">
        {resultId ? 'Who got who' : 'Take the quiz'}
      </span>
    </button>);

}

export function InsideJokesWidget({ size }: {size: WidgetSize;}) {
  const notes = INSIDE_JOKES.slice(0, size === 'full' ? 2 : 1);
  return (
    <div className={cn('grid gap-3.5', size === 'full' ? 'grid-cols-2' : 'grid-cols-1')}>
      {notes.map((j, i) =>
      <InsideJokeNote key={j.id} joke={j} index={i} />
      )}
    </div>);

}

export function TouchGrassWidget({
  live,
  inIds,
  onOpen




}: {live: boolean;inIds: string[];onOpen: () => void;}) {
  return <TouchGrassButton live={live} inIds={inIds} onOpen={onOpen} />;
}

/**
 * The co-op entry on Home. One of only two ways in (the other is Profile →
 * Settings). Opens the membership screen, which links out to the portal.
 */
export function CoopWidget({
  size,
  member = false,
  onOpen




}: {size: WidgetSize;member?: boolean;onOpen?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-card bg-teal px-4 py-4 text-left text-onaccent transition-transform active:scale-[0.99]',
        size === 'half' && 'h-full'
      )}>
      
      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/25 text-[20px]">
        
        🌉
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-bold leading-tight">
          {member ? 'Member portal' : 'Join the co-op'}
        </span>
        <span className="block truncate text-[12px] font-semibold text-onaccent/75">
          {member ? 'Votes, feedback, what we are building' : 'You are not the product · $24 a year'}
        </span>
      </span>
      <ArrowUpRightIcon aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={2.8} />
    </button>);

}
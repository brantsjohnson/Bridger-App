import React from 'react';
import { EventItem } from '../../../packages/shared';
import {
  AvatarStack,
  ButtonSecondary,
  Card,
  CountdownChip,
  CoverArt } from
'../../../packages/ui';
import { personById } from '../state/mock-data';

type EventCardProps = {
  event: EventItem;
  variant?: 'full' | 'row';
  rsvp?: 'going' | 'cant';
  onRsvp?: (id: string, status: 'going' | 'cant') => void;
  onOpen?: (id: string) => void;
};

export function EventCard({ event, variant = 'full', rsvp, onRsvp, onOpen }: EventCardProps) {
  const going = event.goingIds.map(personById);
  const invitedCount = event.invitedIds?.length ?? 0;

  if (variant === 'row') {
    return (
      <button
        type="button"
        onClick={() => onOpen?.(event.id)}
        className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white p-3 text-left transition-colors hover:bg-ink/[0.02]">
        
        <DateChip event={event} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-bold tracking-tight text-ink">
            {event.title}
          </span>
          <span className="block text-[12px] font-medium text-ink-mute">
            {event.time} · {event.place}
          </span>
        </span>
        <AvatarStack
          people={going.slice(0, 3).map((p) => ({ name: p.name, emoji: p.emoji, accent: p.accent }))} />
        
      </button>);

  }

  return (
    <Card as="article" className="overflow-hidden p-0">
      <div className="h-24" onClick={() => onOpen?.(event.id)} role="presentation">
        <CoverArt
          cover={event.cover ?? { kind: 'emoji', value: event.emoji }}
          accent={event.accent} />
        
      </div>

      <div className="p-4">
        <div className="flex items-start gap-3">
          <DateChip event={event} />
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => onOpen?.(event.id)}
              className="block w-full text-left text-[17px] font-bold leading-tight tracking-tight text-ink">
              
              {event.title}
            </button>
            <p className="mt-0.5 text-[13px] font-medium text-ink-mute">
              {event.time} · {event.place}
            </p>
          </div>
          {event.countdown && <CountdownChip label={event.countdown} />}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <AvatarStack
              people={going.slice(0, 3).map((p) => ({ name: p.name, emoji: p.emoji, accent: p.accent }))} />
            
            <span className="text-[12px] font-semibold text-ink-mute">
              {going.length} going · {invitedCount} invited
            </span>
          </span>

          {event.role === 'invited' &&
          <span className="flex gap-2">
              <ButtonSecondary
              size="sm"
              tone={rsvp === 'cant' ? 'solid' : 'outline'}
              onClick={() => onRsvp?.(event.id, 'cant')}>
              
                Can't
              </ButtonSecondary>
              <ButtonSecondary
              size="sm"
              tone="positive"
              onClick={() => onRsvp?.(event.id, 'going')}
              className={rsvp === 'going' ? 'bg-[#1F7A42] hover:bg-[#1F7A42]' : undefined}>
              
                {rsvp === 'going' ? 'Going ✓' : 'Going'}
              </ButtonSecondary>
            </span>
          }
        </div>
      </div>
    </Card>);

}

function DateChip({ event }: {event: EventItem;}) {
  const [weekday, date] = event.day.split(' ');
  return (
    <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-none border-2 border-ink bg-white leading-none">
      <span className="font-pixel text-[13px] text-ink">{date ?? weekday}</span>
      <span className="mt-0.5 text-[9px] font-bold uppercase text-ink-mute">{weekday}</span>
    </span>);

}
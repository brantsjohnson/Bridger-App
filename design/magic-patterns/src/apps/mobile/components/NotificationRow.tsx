import React from 'react';
import { Avatar, cn } from '../../../packages/ui';
import { Person } from '../../../packages/shared';

export function NotificationRow({
  person,
  text,
  time,
  unread = false,
  onClick






}: {person: Person;text: string;time: string;unread?: boolean;onClick?: () => void;}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 rounded-card px-3.5 py-3 text-left transition-colors',
        unread ? 'bg-purple/15 hover:bg-purple/20' : 'hover:bg-purple/10'
      )}>
      
      <Avatar name={person.name} emoji={person.emoji} accent={person.accent} size="sm" />
      <span className="min-w-0 flex-1 text-[13px] leading-snug text-ink">
        <span className="font-bold">{person.name.split(' ')[0]}</span>{' '}
        <span className="font-medium text-ink-soft">{text}</span>
      </span>
      <span className="shrink-0 text-[11px] font-semibold text-ink-mute">{time}</span>
    </button>);

}
import React from 'react';
import { Accent } from '../../shared';
import { ACCENTS, cn } from '../tokens';

type AvatarProps = {
  name: string;
  emoji?: string;
  accent?: Accent;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** ring = they posted a story. Unseen rings are colored, seen rings are grey. */
  story?: 'unseen' | 'seen';
  onStory?: () => void;
  className?: string;
};

const sizes = {
  xs: 'h-7 w-7 text-[12px]',
  sm: 'h-9 w-9 text-[15px]',
  md: 'h-11 w-11 text-[18px]',
  lg: 'h-14 w-14 text-[22px]',
  xl: 'h-24 w-24 text-[38px]'
};

export function Avatar({
  name,
  emoji,
  accent = 'purple',
  size = 'md',
  story,
  onStory,
  className
}: AvatarProps) {
  const token = ACCENTS[accent];

  const face =
  <span
    role="img"
    aria-label={name}
    className={cn(
      'flex items-center justify-center rounded-full font-bold',
      sizes[size],
      token.bg,
      token.text
    )}>
    
      {emoji ?? name.charAt(0)}
    </span>;


  if (!story) {
    return <span className={cn('relative inline-flex shrink-0', className)}>{face}</span>;
  }

  /* the story ring hugs the face — no white gap between them */
  const ring =
  <span
    className={cn(
      'inline-flex shrink-0 rounded-full p-[2.5px]',
      story === 'unseen' ? 'bg-coral' : 'bg-ink/15'
    )}>
    
      {face}
    </span>;


  if (!onStory) return <span className={cn('relative inline-flex', className)}>{ring}</span>;

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onStory();
      }}
      aria-label={`Open ${name}'s story`}
      className={cn('relative inline-flex shrink-0 transition-transform active:scale-95', className)}>
      
      {ring}
    </button>);

}

export function AvatarStack({
  people,
  extra



}: {people: Array<{name: string;emoji?: string;accent?: Accent;}>;extra?: number;}) {
  return (
    <div className="flex items-center">
      {people.map((p, i) =>
      <span key={p.name} className={cn('rounded-full', i > 0 && '-ml-1')}>
          <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
        </span>
      )}
      {extra ?
      <span className="-ml-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-[10px] font-bold text-white">
          +{extra}
        </span> :
      null}
    </div>);

}
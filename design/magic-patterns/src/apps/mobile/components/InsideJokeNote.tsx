import React from 'react';
import { PlusIcon } from 'lucide-react';
import { InsideJoke } from '../../../packages/shared';
import { ACCENTS, Avatar, cn } from '../../../packages/ui';
import { personById } from '../state/mock-data';

const TILTS = ['-rotate-2', 'rotate-1', '-rotate-1', 'rotate-2'];

/**
 * Square sticky note with a folded, lifted corner. The quoted person's face
 * sits on the note so you know whose words these are at a glance; tap it and
 * the note flips to who wrote it down, where, and when.
 */
export function InsideJokeNote({ joke, index = 0 }: {joke: InsideJoke;index?: number;}) {
  const token = ACCENTS[joke.accent];
  const [meta, setMeta] = React.useState(false);
  const quoted = joke.quotedId ? personById(joke.quotedId) : null;
  const poster = joke.postedById ? personById(joke.postedById) : null;
  const tagged = joke.taggedIds?.length ?? 0;

  return (
    <figure
      className={cn(
        'sticky-note w-full rounded-none p-4 pb-6',
        token.bg,
        token.text,
        TILTS[index % TILTS.length]
      )}>
      
      <button
        type="button"
        onClick={() => setMeta((v) => !v)}
        aria-expanded={meta}
        aria-label={meta ? 'Hide details' : 'Who posted this'}
        className="block w-full text-left">
        
        {meta ? (
        /* the credits: who wrote it down, where it happened, when */
        <dl className="space-y-2 text-[11px] font-bold">
            <div>
              <dt className="opacity-60">Said by</dt>
              <dd className="text-[13px]">{quoted?.name ?? joke.fromName}</dd>
            </div>
            {poster &&
          <div>
                <dt className="opacity-60">Posted by</dt>
                <dd className="text-[13px]">
                  {poster.id === 'me' ? 'You' : poster.name}
                  {joke.postedAt ? ` · ${joke.postedAt}` : ''}
                </dd>
              </div>
          }
            {joke.eventName &&
          <div>
                <dt className="opacity-60">Where</dt>
                <dd className="text-[13px]">{joke.eventName}</dd>
              </div>
          }
            {tagged > 0 &&
          <div>
                <dt className="opacity-60">Also in it</dt>
                <dd className="text-[13px]">
                  {tagged} {tagged === 1 ? 'person' : 'people'}
                </dd>
              </div>
          }
          </dl>) :

        <>
            <blockquote className="text-[14px] font-bold leading-snug">“{joke.text}”</blockquote>
            <figcaption className="mt-2.5 flex items-center gap-2 pr-5">
              {quoted &&
            <Avatar
              name={quoted.name}
              emoji={quoted.emoji}
              accent={quoted.accent}
              size="xs"
              className="shrink-0" />

            }
              <span className="min-w-0 flex-1 truncate text-[11px] font-bold opacity-75">
                {joke.fromName}
                {joke.eventName && <span> · {joke.eventName}</span>}
              </span>
            </figcaption>
          </>
        }
      </button>
    </figure>);

}

/** White frame, photo, name, heart, slight rotation. */
export function PolaroidCard({
  name,
  emoji,
  liked = false,
  onLike,
  index = 0






}: {name: string;emoji: string;liked?: boolean;onLike?: () => void;index?: number;}) {
  return (
    <figure
      className={cn(
        'w-[132px] shrink-0 rounded-none border border-ink-line bg-white p-2 pb-3',
        TILTS[index % TILTS.length]
      )}>
      
      <div className="flex h-[118px] items-center justify-center bg-ink/[0.04] text-[44px]">
        <span aria-hidden="true">{emoji}</span>
      </div>
      <figcaption className="mt-2 flex items-center justify-between px-0.5">
        <span className="truncate text-[12px] font-bold text-ink">{name}</span>
        <button
          type="button"
          onClick={onLike}
          aria-label={liked ? `Unlike ${name}` : `Like ${name}`}
          aria-pressed={liked}
          className={cn(
            'text-[13px] transition-transform active:scale-90',
            liked ? 'text-coral' : 'text-ink-mute'
          )}>
          
          {liked ? '♥' : '♡'}
        </button>
      </figcaption>
    </figure>);

}

/**
 * The "+" that sits among the notes. An empty wall still reads as something to
 * fill in rather than a void, so this doubles as the null state.
 * Square tile (Favorites pattern) — parent sets the half-column width.
 */
export function AddNoteTile({
  label = 'Add an Inside Joke',
  onClick
}: {
  label?: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex w-full flex-col items-center justify-center gap-1.5 rounded-none border-2 border-dashed border-ink-line bg-[#FFF6C8] p-4 text-center transition-colors hover:border-purple/50 hover:bg-[#FFEFA8]',
        'aspect-square'
      )}
    >
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-purple"
      >
        <PlusIcon className="h-4 w-4 text-white" strokeWidth={3} />
      </span>
      <span className="text-[13px] font-bold text-ink-soft">{label}</span>
    </button>
  );
}
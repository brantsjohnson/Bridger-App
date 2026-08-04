import React from 'react';
import { PauseIcon, PlayIcon, SkipBackIcon, SkipForwardIcon } from 'lucide-react';
import { Tier } from '../../../../packages/shared';
import { ACCENTS, Avatar, PixelHeading, cn } from '../../../../packages/ui';
import { RECAP_ANSWERS, RECAP_WEEK } from '../../state/pod';
import { personById } from '../../state/mock-data';

const TIER_RANK: Record<Tier, number> = { none: 0, acquaintance: 1, friend: 2, close: 3 };

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** One continuous listen. Speaker pops up as their clip plays. */
export function RecapPlayer({ asTier = 'close' }: {asTier?: Tier;}) {
  const clips = React.useMemo(
    () => RECAP_ANSWERS.filter((a) => TIER_RANK[a.visibleToTier] <= TIER_RANK[asTier]),
    [asTier]
  );

  const [index, setIndex] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [playing, setPlaying] = React.useState(false);

  const clip = clips[index];
  const speaker = personById(clip.authorId);
  const token = ACCENTS[speaker.accent];
  const question = RECAP_WEEK.questions[clip.questionIndex];

  React.useEffect(() => {
    if (!playing) return;
    const id = window.setInterval(() => {
      setElapsed((t) => {
        if (t + 1 >= clip.duration) {
          setIndex((i) => i + 1 < clips.length ? i + 1 : i);
          return 0;
        }
        return t + 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [playing, clip.duration, clips.length]);

  const step = (delta: number) => {
    setIndex((i) => Math.min(clips.length - 1, Math.max(0, i + delta)));
    setElapsed(0);
  };

  const inThisWeek = Array.from(new Set(clips.map((c) => c.authorId))).map(personById);

  return (
    <div className="rounded-card border border-ink-line bg-white p-5">
      <PixelHeading size="md">Weekly recap</PixelHeading>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-mute">
        {RECAP_WEEK.weekOf} · one listen
      </p>

      <div className="mt-5 flex flex-col items-center">
        <div className={cn('rounded-full p-1.5 transition-colors', playing ? token.bg : 'bg-ink/5')}>
          <Avatar name={speaker.name} emoji={speaker.emoji} accent={speaker.accent} size="xl" />
        </div>
        <p className="mt-3 text-[18px] font-bold tracking-tight text-ink">
          {speaker.name.split(' ')[0]}
        </p>
        <p
          className={cn(
            'mt-1.5 rounded-full px-3 py-1 text-[13px] font-bold',
            token.tintSolid,
            'text-ink'
          )}>
          
          Q{clip.questionIndex + 1} · {question}
        </p>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <span className="w-9 shrink-0 text-[11px] font-bold text-ink-mute">{fmt(elapsed)}</span>
        <input
          type="range"
          min={0}
          max={clip.duration}
          value={elapsed}
          onChange={(e) => setElapsed(Number(e.target.value))}
          aria-label="Scrub"
          className="h-1.5 min-w-0 flex-1 cursor-pointer appearance-none rounded-full bg-ink/10 accent-purple" />
        
        <span className="w-9 shrink-0 text-right text-[11px] font-bold text-ink-mute">
          -{fmt(Math.max(0, clip.duration - elapsed))}
        </span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-8">
        <button type="button" onClick={() => step(-1)} aria-label="Back" className="text-ink">
          <SkipBackIcon className="h-6 w-6" strokeWidth={2.2} />
        </button>
        <button
          type="button"
          onClick={() => setPlaying((v) => !v)}
          aria-label={playing ? 'Pause' : 'Play'}
          className="flex h-16 w-16 items-center justify-center rounded-full bg-ink text-white">
          
          {playing ?
          <PauseIcon className="h-7 w-7" strokeWidth={2.4} /> :

          <PlayIcon className="ml-0.5 h-7 w-7" strokeWidth={2.4} />
          }
        </button>
        <button type="button" onClick={() => step(1)} aria-label="Skip" className="text-ink">
          <SkipForwardIcon className="h-6 w-6" strokeWidth={2.2} />
        </button>
      </div>

      <div className="mt-4 flex items-center justify-center gap-1.5">
        {RECAP_WEEK.questions.map((_, qi) =>
        <span
          key={qi}
          className={cn(
            'h-2 rounded-full transition-all',
            qi === clip.questionIndex ? 'w-5 bg-purple' : 'w-2 bg-ink/15',
            qi < clip.questionIndex && 'bg-purple/40'
          )} />

        )}
      </div>

      <div className="mt-5 border-t border-ink-line pt-4">
        <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
          In this week · {inThisWeek.length}
        </p>
        <div className="mt-2.5 flex items-center">
          {inThisWeek.map((p, i) =>
          <span key={p.id} className={cn('rounded-full', i > 0 && '-ml-1')}>
              <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
            </span>
          )}
        </div>
      </div>
    </div>);

}
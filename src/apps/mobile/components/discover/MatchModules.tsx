import React from 'react';
import { CheckIcon, ChevronRightIcon, LockIcon } from 'lucide-react';
import { ACCENTS, ModuleFlow, PixelHeading, cn } from '../../../../packages/ui';
import { MATCH_MODULES, MatchModule } from '../../state/match-modules';

/**
 * What you want to be matched on. Sits at the TOP of Discover so it reads as
 * the thing to get out of the way, not an optional extra buried below the
 * results — the matches only get good once a few of these are done.
 *
 * Nobody has to take them all. Every one opens on the same promise: these
 * answers are never shared, they only find you more relevant friends.
 *
 * New modules and quizzes come from `state/match-modules.ts`, so an admin adds
 * one there and it appears here for everyone.
 */
export function MatchModules({ compact = false }: {compact?: boolean;}) {
  const [taken, setTaken] = React.useState<string[]>([]);
  const [openId, setOpenId] = React.useState<string | null>(null);

  const active = MATCH_MODULES.find((m) => m.id === openId) ?? null;
  const done = taken.length;
  const all = MATCH_MODULES.length;
  const complete = done === all;

  return (
    <section>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <PixelHeading size="md">Match me on</PixelHeading>
        <span className="text-[12px] font-bold text-ink-mute">
          {done}/{all} done
        </span>
      </div>

      <p className="mb-3 flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-ink-mute">
        <LockIcon aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={2.6} />
        Answers are never shared. They only connect you to more relevant friends.
      </p>

      {/* progress reads as something finishable, which is the point */}
      <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-ink/10">
        <div
          className={cn('h-full rounded-full transition-all', complete ? 'bg-success' : 'bg-ink')}
          style={{ width: `${done / all * 100}%` }} />
        
      </div>

      <div className="space-y-2">
        {MATCH_MODULES.map((m) =>
        <ModuleRow
          key={m.id}
          module={m}
          done={taken.includes(m.id)}
          compact={compact}
          onOpen={() => setOpenId(m.id)} />

        )}
      </div>

      {active &&
      <ModuleFlow
        open
        mode="private"
        title={active.kind === 'quiz' ? `${active.title} · quiz` : active.title}
        intro={active.blurb}
        questions={active.questions}
        onClose={() => setOpenId(null)}
        onDone={() => {
          setTaken((t) => t.includes(active.id) ? t : [...t, active.id]);
          setOpenId(null);
        }} />

      }
    </section>);

}

function ModuleRow({
  module: m,
  done,
  compact,
  onOpen





}: {module: MatchModule;done: boolean;compact: boolean;onOpen: () => void;}) {
  const token = ACCENTS[m.accent];

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        'flex w-full items-center gap-3 rounded-card border bg-white px-3.5 py-3 text-left transition-colors',
        done ? 'border-ink-line opacity-70' : 'border-ink-line hover:border-purple/40'
      )}>
      
      <span
        aria-hidden="true"
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-[19px]',
          token.tintSolid
        )}>
        
        {m.emoji}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-[14px] font-bold tracking-tight text-ink">{m.title}</span>
          {m.kind === 'quiz' &&
          <span className="shrink-0 rounded-full bg-ink/5 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-ink-mute">
              quiz
            </span>
          }
        </span>
        {!compact &&
        <span className="block truncate text-[12px] font-semibold text-ink-mute">
            {done ? 'Answered · tap to change' : m.blurb}
          </span>
        }
      </span>

      {done ?
      <CheckIcon aria-hidden="true" className="h-5 w-5 shrink-0 text-success" strokeWidth={3} /> :

      <ChevronRightIcon
        aria-hidden="true"
        className="h-4 w-4 shrink-0 text-ink-mute"
        strokeWidth={2.6} />

      }
    </button>);

}
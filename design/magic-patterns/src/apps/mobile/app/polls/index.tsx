import React from 'react';
import { BarChart3Icon, ChevronRightIcon, MessageSquareIcon } from 'lucide-react';
import {
  Avatar,
  Badge,
  Breathe,
  EmptyState,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  cn } from
'../../../../packages/ui';
import { PollResultsSheet } from '../../components/home/PollResultsSheet';
import { HOME_POLLS, HomePoll, PREVIOUS_POLLS } from '../../state/pod';
import { personById } from '../../state/mock-data';

const BAR = ['bg-purple', 'bg-teal', 'bg-amber', 'bg-pink'];

/**
 * Everything you ever asked the group. Open one and you get the same results
 * sheet as a live poll — who voted for what, or who replied.
 */
export function PollsArchiveScreen({
  empty = false,
  onBack




}: { /** day one: you have not asked anything yet */empty?: boolean;onBack?: () => void;}) {
  const [open, setOpen] = React.useState<HomePoll | null>(null);
  const live = empty ? [] : HOME_POLLS.filter((p) => p.authorId === 'me');
  const closed = empty ? [] : PREVIOUS_POLLS;

  return (
    <Screen>
      <ScreenHeader title="Your polls" onBack={onBack} />
      <ScreenBody>
        {empty ?
        <Breathe>
            <div className="!mt-0">
              <EmptyState
              emoji="🗳️"
              line="You have not asked anything yet. Polls and questions show up here with their answers." />
            
            </div>
          </Breathe> :

        <>
            {live.length > 0 &&
          <Breathe>
                <section className="!mt-0">
                  <PixelHeading size="md" className="mb-2">
                    Still open
                  </PixelHeading>
                  <div className="space-y-2.5">
                    {live.map((p) =>
                <ArchiveRow key={p.id} poll={p} onOpen={() => setOpen(p)} />
                )}
                  </div>
                </section>
              </Breathe>
          }

            <Breathe>
              <section className="mt-7">
                <PixelHeading size="md" className="mb-2">
                  Closed
                </PixelHeading>
                <div className="space-y-2.5">
                  {closed.map((p) =>
                <ArchiveRow key={p.id} poll={p} onOpen={() => setOpen(p)} />
                )}
                </div>
              </section>
            </Breathe>
          </>
        }
      </ScreenBody>

      <PollResultsSheet poll={open} onClose={() => setOpen(null)} />
    </Screen>);

}

function ArchiveRow({ poll, onOpen }: {poll: HomePoll;onOpen: () => void;}) {
  const total = poll.options.reduce((n, o) => n + o.votes, 0);
  /** the winner is the headline — you opened this to remember what happened */
  const top = poll.options.reduce(
    (best, o) => o.votes > (best?.votes ?? -1) ? o : best,
    poll.options[0]
  );
  const voters = poll.options.flatMap((o) => o.voterIds ?? []).slice(0, 4);

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-start gap-3 rounded-card border border-ink-line bg-white p-3.5 text-left transition-colors hover:bg-[#F1ECFF]">
      
      <span
        aria-hidden="true"
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
          poll.kind === 'poll' ? 'bg-[#F1ECFF] text-purple' : 'bg-[#DFF3E4] text-success'
        )}>
        
        {poll.kind === 'poll' ?
        <BarChart3Icon className="h-[18px] w-[18px]" strokeWidth={2.4} /> :

        <MessageSquareIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
        }
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-[14px] font-bold text-ink">
            {poll.prompt}
          </span>
          {!poll.closedAt && <Badge tone="active">Open</Badge>}
        </span>

        {poll.kind === 'poll' && top ?
        <>
            <span className="mt-1 block text-[12px] font-semibold text-ink-soft">
              {top.label} won · {total} {total === 1 ? 'vote' : 'votes'}
            </span>
            <span className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-ink/8">
              {poll.options.map((o, i) =>
            <span
              key={o.id}
              className={cn('block h-full', BAR[i % BAR.length])}
              style={{ width: `${Math.round(o.votes / (total || 1) * 100)}%` }} />

            )}
            </span>
          </> :

        <span className="mt-1 block text-[12px] font-semibold text-ink-soft">
            {poll.replyList?.length ?? poll.replies ?? 0} replies
          </span>
        }

        <span className="mt-1.5 flex items-center gap-2">
          {voters.length > 0 &&
          <span aria-hidden="true" className="flex -space-x-2">
              {voters.map((id) => {
              const p = personById(id);
              return (
                <Avatar
                  key={id}
                  name={p.name}
                  emoji={p.emoji}
                  accent={p.accent}
                  size="xs"
                  className="" />);


            })}
            </span>
          }
          <span className="truncate text-[11px] font-semibold text-ink-mute">
            {poll.closedAt ?? `Shared with ${(poll.audience ?? 'friends').toLowerCase()}`}
          </span>
        </span>
      </span>

      <ChevronRightIcon
        aria-hidden="true"
        className="mt-1 h-4 w-4 shrink-0 text-ink-mute"
        strokeWidth={2.6} />
      
    </button>);

}
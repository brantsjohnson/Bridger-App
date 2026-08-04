import React from 'react';
import {
  BarChart3Icon,
  ChevronRightIcon,
  HistoryIcon,
  MessageSquareIcon } from
'lucide-react';
import { Avatar, cn } from '../../../../packages/ui';
import { HOME_POLLS, HomePoll } from '../../state/pod';
import { personById } from '../../state/mock-data';
import { PollResultsSheet } from './PollResultsSheet';

const BAR = ['bg-purple', 'bg-teal', 'bg-amber', 'bg-pink'];

/**
 * Ask the group, and YOUR results underneath. Friends' polls never land here.
 * They live in that person's Catch-Up and on their profile.
 */
export function AskWidget({
  onAsk,
  member = false,
  onJoinCoop,
  onSeePrevious






}: {onAsk: (kind: 'poll' | 'question') => void; /** asking the group is a co-op feature */member?: boolean;onJoinCoop?: () => void;onSeePrevious?: () => void;}) {
  const [polls, setPolls] = React.useState(HOME_POLLS.filter((p) => p.authorId === 'me'));
  const [openPoll, setOpenPoll] = React.useState<HomePoll | null>(null);

  const vote = (pollId: string, optionId: string) =>
  setPolls((p) =>
  p.map((poll) =>
  poll.id === pollId && !poll.myVote ?
  {
    ...poll,
    myVote: optionId,
    options: poll.options.map((o) =>
    o.id === optionId ?
    { ...o, votes: o.votes + 1, voterIds: [...(o.voterIds ?? []), 'me'] } :
    o
    )
  } :
  poll
  )
  );

  /**
   * Asking the group is a co-op feature and it lives in the portal's terms.
   * For non-members there's simply nothing here — no locked card explaining a
   * feature they didn't ask about. The co-op sells itself in the co-op.
   */
  if (!member) return null;

  return (
    <div className="space-y-3">
      {
      <div className="grid grid-cols-2 gap-3">
          <button
          type="button"
          onClick={() => onAsk('poll')}
          className="flex flex-col items-center gap-2 rounded-[28px_10px_28px_10px] bg-[#D5C2FF] px-4 py-5 text-ink transition-transform active:scale-[0.98]">
          
            <BarChart3Icon className="h-6 w-6" strokeWidth={2.4} />
            <span className="text-[14px] font-bold">Create a poll</span>
          </button>
          <button
          type="button"
          onClick={() => onAsk('question')}
          className="flex flex-col items-center gap-2 rounded-[10px_28px_10px_28px] bg-[#9FE7CE] px-4 py-5 text-ink transition-transform active:scale-[0.98]">
          
            <MessageSquareIcon className="h-6 w-6" strokeWidth={2.4} />
            <span className="text-[14px] font-bold">Ask a question</span>
          </button>
        </div>
      }

      {polls.map((poll) =>
      <PollCard
        key={poll.id}
        poll={poll}
        onVote={vote}
        onOpen={() => setOpenPoll(polls.find((p) => p.id === poll.id) ?? poll)} />

      )}

      {/* the archive — every poll you ever ran, with its results */}
      <button
        type="button"
        onClick={onSeePrevious}
        className="flex w-full items-center gap-2 rounded-card border border-ink-line bg-surface px-3.5 py-3 text-left transition-colors hover:bg-[#F1ECFF]">
        
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink-soft">
          
          <HistoryIcon className="h-4 w-4" strokeWidth={2.5} />
        </span>
        <span className="min-w-0 flex-1 text-[13px] font-bold text-ink">See previous polls</span>
        <ChevronRightIcon
          aria-hidden="true"
          className="h-4 w-4 shrink-0 text-ink-mute"
          strokeWidth={2.6} />
        
      </button>

      <PollResultsSheet poll={openPoll} onClose={() => setOpenPoll(null)} />
    </div>);

}

function PollCard({
  poll,
  onVote,
  onOpen




}: {poll: HomePoll;onVote: (pollId: string, optionId: string) => void;onOpen: () => void;}) {
  const total = poll.options.reduce((n, o) => n + o.votes, 0) || 1;
  const voters = poll.options.flatMap((o) => o.voterIds ?? []).slice(0, 4);

  return (
    <article className="rounded-card border border-ink-line bg-white p-4">
      <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">Your poll</p>

      <p className="mt-1 text-[16px] font-bold leading-snug tracking-tight text-ink">
        {poll.prompt}
      </p>

      {poll.kind === 'poll' ?
      <div className="mt-3 space-y-2">
          {poll.options.map((o, i) => {
          const pct = Math.round(o.votes / total * 100);
          const mine = poll.myVote === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onVote(poll.id, o.id)}
              className="block w-full text-left">
              
                <span className="flex items-baseline justify-between">
                  <span className={cn('text-[14px] font-bold text-ink', mine && 'text-purple')}>
                    {o.label}
                  </span>
                  <span className="text-[12px] font-bold text-ink-mute">{o.votes}</span>
                </span>
                <span className="mt-1 block h-2.5 overflow-hidden rounded-full bg-ink/8">
                  <span
                  className={cn('block h-full rounded-full', BAR[i % BAR.length])}
                  style={{ width: `${Math.max(6, pct)}%` }} />
                
                </span>
              </button>);

        })}
        </div> :
      null}

      {/* the whole card's payoff: who actually answered */}
      <button
        type="button"
        onClick={onOpen}
        className="mt-3 flex w-full items-center gap-2 rounded-full border border-ink-line bg-surface py-1.5 pl-1.5 pr-3 text-left transition-colors hover:bg-[#F1ECFF]">
        
        {poll.kind === 'poll' ?
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
                className="ring-2 ring-surface" />);


          })}
          </span> :

        <span
          aria-hidden="true"
          className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFF3E4] text-[14px]">
          
            💬
          </span>
        }
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
          {poll.kind === 'poll' ? 'See who voted' : `${poll.replies} replies`}
        </span>
        <ChevronRightIcon aria-hidden="true" className="h-4 w-4 shrink-0 text-ink-mute" strokeWidth={2.6} />
      </button>
    </article>);

}
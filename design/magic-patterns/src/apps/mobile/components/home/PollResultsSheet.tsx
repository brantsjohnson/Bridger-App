import { Avatar, Sheet, cn } from '../../../../packages/ui';
import { HomePoll } from '../../state/pod';
import { ME, personById } from '../../state/mock-data';

const BAR = ['bg-purple', 'bg-teal', 'bg-amber', 'bg-pink'] as const;

/**
 * Tap a poll and you see the whole picture: every option, who picked it, and
 * who has not answered yet. A poll among friends is never anonymous — the
 * point is knowing your people, not a leaderboard.
 */
export function PollResultsSheet({
  poll,
  onClose



}: {poll: HomePoll | null;onClose: () => void;}) {
  const open = Boolean(poll);
  const total = poll ? poll.options.reduce((n, o) => n + o.votes, 0) : 0;
  const voted = poll ? poll.options.flatMap((o) => o.voterIds ?? []) : [];
  const waiting = (poll?.askedIds ?? []).filter((id) => !voted.includes(id));

  return (
    <Sheet open={open} onClose={onClose} title={poll?.prompt ?? 'Results'}>
      {poll &&
      <div className="max-h-[62vh] space-y-4 overflow-y-auto pb-1">
          <p className="text-[12px] font-semibold text-ink-mute">
            {poll.kind === 'poll' ?
          `${total} ${total === 1 ? 'vote' : 'votes'} · shared with ${(
          poll.audience ?? 'friends').
          toLowerCase()}` :
          `${poll.replyList?.length ?? poll.replies ?? 0} replies · shared with ${(
          poll.audience ?? 'friends').
          toLowerCase()}`}
          </p>

          {poll.kind === 'poll' ?
        <>
              <ul className="space-y-3.5">
                {poll.options.map((o, i) => {
              const pct = total ? Math.round(o.votes / total * 100) : 0;
              const mine = poll.myVote === o.id;
              const people = (o.voterIds ?? []).map(personById);

              return (
                <li key={o.id}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span
                      className={cn(
                        'min-w-0 flex-1 truncate text-[15px] font-bold text-ink',
                        mine && 'text-purple'
                      )}>
                      
                          {o.label}
                          {mine &&
                      <span className="ml-1.5 text-[11px] font-bold uppercase tracking-wide text-purple">
                              your pick
                            </span>
                      }
                        </span>
                        <span className="shrink-0 text-[12px] font-bold text-ink-mute">
                          {o.votes} · {pct}%
                        </span>
                      </div>

                      <span className="mt-1.5 block h-2.5 overflow-hidden rounded-full bg-ink/8">
                        <span
                      className={cn('block h-full rounded-full', BAR[i % BAR.length])}
                      style={{ width: `${Math.max(4, pct)}%` }} />
                    
                      </span>

                      {people.length > 0 ?
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                          {people.map((p) =>
                    <li
                      key={p.id}
                      className="flex items-center gap-1.5 rounded-full border border-ink-line bg-surface py-1 pl-1 pr-2.5">
                      
                              <Avatar
                        name={p.name}
                        emoji={p.emoji}
                        accent={p.accent}
                        size="xs" />
                      
                              <span className="text-[12px] font-bold text-ink">
                                {p.id === 'me' ? 'You' : p.name.split(' ')[0]}
                              </span>
                            </li>
                    )}
                        </ul> :

                  <p className="mt-1.5 text-[12px] font-semibold text-ink-mute">
                          Nobody yet.
                        </p>
                  }
                    </li>);

            })}
              </ul>

              {waiting.length > 0 &&
          <div className="border-t border-ink-line pt-3">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
                    Yet to answer
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {waiting.map(personById).map((p) =>
              <li
                key={p.id}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-ink-line py-1 pl-1 pr-2.5 opacity-70">
                
                        <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                        <span className="text-[12px] font-bold text-ink-soft">
                          {p.id === 'me' ? 'You' : p.name.split(' ')[0]}
                        </span>
                      </li>
              )}
                  </ul>
                </div>
          }
            </> :

        <ul className="space-y-2.5">
              {(poll.replyList ?? []).map((r) => {
            const p = r.authorId === 'me' ? ME : personById(r.authorId);
            return (
              <li
                key={r.id}
                className="flex gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3">
                
                    <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <span className="truncate text-[13px] font-bold text-ink">
                          {p.name.split(' ')[0]}
                        </span>
                        <span className="shrink-0 text-[11px] font-semibold text-ink-mute">
                          {r.time}
                        </span>
                      </p>
                      <p className="text-[14px] font-semibold leading-snug text-ink">{r.text}</p>
                    </div>
                  </li>);

          })}
            </ul>
        }
        </div>
      }
    </Sheet>);

}
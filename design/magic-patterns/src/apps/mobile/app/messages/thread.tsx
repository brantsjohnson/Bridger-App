import React from 'react';
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  ClockIcon,
  HeartIcon,
  PhoneIcon,
  UserRoundPlusIcon } from
'lucide-react';
import { ACCENTS, Avatar, cn } from '../../../../packages/ui';
import { DAILY_CAP, THREADS } from '../../state/messages';

/**
 * One conversation, capped at 5 messages a day each way.
 * Share a contact card (not a raw number). Double-click a friend's
 * bubble to heart it. Hearts are not sent messages.
 */
export function ThreadScreen({
  threadId = 't1',
  blocked = false,
  seedMessage,
  onBack,
  onShareContact











}: {threadId?: string; /** they have spent their 5 for today */blocked?: boolean; /**
   * Already sent on your behalf — saying "I'm in" to a touch grass opens the
   * thread with the yes already delivered, so you arrive mid-plan.
   */seedMessage?: string;onBack?: () => void;onShareContact?: () => void;}) {const thread = THREADS.find((t) => t.id === threadId) ?? THREADS[0];const token = ACCENTS[thread.accent];  const [draft, setDraft] = React.useState('');
  const [left, setLeft] = React.useState(seedMessage ? Math.max(0, thread.myLeft - 1) : thread.myLeft);
  const [bubbles, setBubbles] = React.useState(
    seedMessage ?
    [...thread.bubbles, { id: 'seed', from: 'me' as const, text: seedMessage }] :
    thread.bubbles
  );
  const [hearted, setHearted] = React.useState<Record<string, boolean>>({});

  const send = () => {
    if (!draft.trim() || left === 0) return;
    setBubbles((p) => [...p, { id: `b${p.length + 1}`, from: 'me', text: draft.trim() }]);
    setDraft('');
    setLeft((n) => Math.max(0, n - 1));
  };

  return (
    <div className="flex h-full flex-col bg-app-grid">
      <header className="flex shrink-0 items-center gap-3 border-b border-ink-line bg-white px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-ink text-canvas active:opacity-80"
        >
          <ChevronLeftIcon className="h-5 w-5 text-canvas" strokeWidth={3} />
        </button>
        <Avatar name={thread.name} emoji={thread.emoji} accent={thread.accent} size="sm" />
        <p className="min-w-0 flex-1 truncate text-[16px] font-bold tracking-tight text-ink">
          {thread.name}
        </p>
        <span
          className={cn(
            'shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold',
            left > 0 ? 'bg-[#DFF3E4] text-success' : 'bg-[#FFE1D2] text-coral'
          )}>
          
          {left} left today
        </span>
      </header>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {bubbles.map((b) =>
        <div key={b.id} className={cn('flex', b.from === 'me' ? 'justify-end' : 'justify-start')}>
            {b.from === 'them' ?
          <button
            type="button"
            onDoubleClick={() => {
              setHearted((prev) => ({ ...prev, [b.id]: !prev[b.id] }));
            }}
            aria-label={`${hearted[b.id] ? 'Hearted. ' : ''}Double click to heart. Does not use a message.`}
            className="relative max-w-[76%] rounded-[20px_20px_20px_6px] border border-ink-line bg-white px-4 py-2.5 text-left text-[15px] font-semibold leading-snug text-ink">
            
              {b.text}
              {b.phone &&
            <span
              className="ml-1.5 inline-flex items-center gap-1 font-bold text-success underline decoration-success/40 underline-offset-2">
              
                  {b.phone}
                  <PhoneIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
                </span>
            }
              {hearted[b.id] ?
            <HeartIcon className="mt-1.5 ml-auto h-3.5 w-3.5 fill-[#E11D48] text-[#E11D48]" strokeWidth={2.2} /> :
            null}
            </button> :

          <div
            className={cn(
              'max-w-[76%] rounded-[20px_20px_6px_20px] px-4 py-2.5 text-[15px] font-semibold leading-snug',
              token.bg,
              token.text
            )}>
            
              {b.text}
            </div>
          }
          </div>
        )}

        {blocked &&
        <div className="rounded-card bg-[#FDEFD3] px-4 py-3.5 text-center">
            <ClockIcon className="mx-auto h-4 w-4 text-amber" strokeWidth={2.6} />
            <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink-soft">
              <span className="font-bold text-ink">
                {thread.name}'s used their {DAILY_CAP} for today
              </span>{' '}
              They can't reply until tomorrow.
            </p>
          </div>
        }
      </div>

      <div className="shrink-0 space-y-2.5 px-4 pb-5 pt-2">
        {blocked ?
        <>
            <button
            type="button"
            onClick={onShareContact}
            className="flex w-full items-center justify-center gap-2 rounded-card bg-[#DFF3E4] px-4 py-4 text-[16px] font-bold text-success">
            
              <UserRoundPlusIcon className="h-5 w-5" strokeWidth={2.5} />
              Share your contact instead
            </button>
            <p className="text-center text-[12px] font-semibold text-ink-mute">
              so you two can actually connect
            </p>
          </> :

        <>
            <button
              type="button"
              onClick={onShareContact}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#DFF3E4] px-3 py-2.5 text-[13px] font-bold text-success">
              
                <UserRoundPlusIcon className="h-4 w-4" strokeWidth={2.6} />
                Share contact
              </button>

            <div className="flex items-center gap-2 rounded-full border border-ink-line bg-white py-1.5 pl-4 pr-1.5">
              <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder={left === 0 ? 'Out of messages today' : 'Message…'}
              disabled={left === 0}
              aria-label="Message"
              className="min-w-0 flex-1 bg-transparent text-[15px] font-semibold text-ink outline-none placeholder:text-ink-mute" />
            
              <button
              type="button"
              onClick={send}
              disabled={left === 0}
              aria-label="Send"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white disabled:opacity-40">
              
                <ArrowUpIcon className="h-5 w-5" strokeWidth={2.8} />
              </button>
            </div>

            <p className="text-center text-[12px] font-semibold text-ink-mute">
              {left} of {DAILY_CAP} left today · share your contact card to keep going
            </p>
          </>
        }
      </div>
    </div>);

}
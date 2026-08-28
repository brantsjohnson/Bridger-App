import React from 'react';
import {
  ArrowUpIcon,
  ChevronLeftIcon,
  ClockIcon,
  HeartIcon,
  MessageSquareIcon,
  UserRoundPlusIcon
} from 'lucide-react';
import { ACCENTS, Avatar, cn } from '../../../../packages/ui';
import { DAILY_CAP, THREADS, type Bubble } from '../../state/messages';

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
}: {
  threadId?: string;
  /** they have spent their 5 for today */
  blocked?: boolean;
  /**
   * Already sent on your behalf — saying "I'm in" to a touch grass opens the
   * thread with the yes already delivered, so you arrive mid-plan.
   */
  seedMessage?: string;
  onBack?: () => void;
  onShareContact?: () => void;
}) {
  const thread = THREADS.find((t) => t.id === threadId) ?? THREADS[0];
  const token = ACCENTS[thread.accent];
  const [draft, setDraft] = React.useState('');
  const [left, setLeft] = React.useState(
    seedMessage ? Math.max(0, thread.myLeft - 1) : thread.myLeft
  );
  const [bubbles, setBubbles] = React.useState(
    seedMessage
      ? [...thread.bubbles, { id: 'seed', from: 'me' as const, text: seedMessage }]
      : thread.bubbles
  );
  const [hearted, setHearted] = React.useState<Record<string, boolean>>({});
  const [openCardId, setOpenCardId] = React.useState<string | null>(null);

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
          )}
        >
          {left} left today
        </span>
      </header>

      <div className="no-scrollbar flex-1 space-y-2.5 overflow-y-auto px-4 py-4">
        {bubbles.map((b) => (
          <div key={b.id} className={cn('flex', b.from === 'me' ? 'justify-end' : 'justify-start')}>
            {b.from === 'them' ? (
              <button
                type="button"
                onDoubleClick={() => {
                  setHearted((prev) => ({ ...prev, [b.id]: !prev[b.id] }));
                }}
                aria-label={`${hearted[b.id] ? 'Hearted. ' : ''}Double click to heart. Does not use a message.`}
                className="relative max-w-[76%] rounded-[20px_20px_20px_6px] border border-ink-line bg-white px-4 py-2.5 text-left text-[15px] font-semibold leading-snug text-ink"
              >
                {b.text}
                <ContactCardChip
                  bubble={b}
                  open={openCardId === b.id}
                  onToggle={() => setOpenCardId((id) => (id === b.id ? null : b.id))}
                  onMe={false}
                />
                {hearted[b.id] ? (
                  <HeartIcon
                    className="ml-auto mt-1.5 h-3.5 w-3.5 fill-[#E11D48] text-[#E11D48]"
                    strokeWidth={2.2}
                  />
                ) : null}
              </button>
            ) : (
              <div
                className={cn(
                  'max-w-[76%] rounded-[20px_20px_6px_20px] px-4 py-2.5 text-[15px] font-semibold leading-snug',
                  token.bg,
                  token.text
                )}
              >
                {b.text}
                <ContactCardChip
                  bubble={b}
                  open={openCardId === b.id}
                  onToggle={() => setOpenCardId((id) => (id === b.id ? null : b.id))}
                  onMe
                />
              </div>
            )}
          </div>
        ))}

        {blocked ? (
          <div className="rounded-card bg-[#FDEFD3] px-4 py-3.5 text-center">
            <ClockIcon className="mx-auto h-4 w-4 text-amber" strokeWidth={2.6} />
            <p className="mt-1.5 text-[13px] font-semibold leading-snug text-ink-soft">
              <span className="font-bold text-ink">
                {thread.name}'s used their {DAILY_CAP} for today
              </span>{' '}
              They can't reply until tomorrow.
            </p>
          </div>
        ) : null}
      </div>

      <div className="shrink-0 space-y-2.5 px-4 pb-5 pt-2">
        {blocked ? (
          <button
            type="button"
            onClick={onShareContact}
            className="flex w-full items-center justify-center gap-2 rounded-card bg-[#DFF3E4] px-4 py-4 text-[16px] font-bold text-success"
          >
            <UserRoundPlusIcon className="h-5 w-5" strokeWidth={2.5} />
            Share your contact instead
          </button>
        ) : left === 0 ? (
          <button
            type="button"
            onClick={onShareContact}
            className="flex w-full items-center justify-center gap-2 rounded-card bg-[#DFF3E4] px-4 py-4 text-[16px] font-bold text-success"
          >
            <UserRoundPlusIcon className="h-5 w-5" strokeWidth={2.5} />
            Share contact
          </button>
        ) : (
          <>
            <div className="flex items-center gap-2 rounded-full border border-ink-line bg-white py-1.5 pl-4 pr-1.5">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                placeholder="Message…"
                aria-label="Message"
                className="min-w-0 flex-1 border-0 bg-transparent text-[15px] font-semibold text-ink outline-none"
              />
              <button
                type="button"
                onClick={send}
                disabled={!draft.trim()}
                aria-label="Send"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success text-white disabled:opacity-40"
              >
                <ArrowUpIcon className="h-[18px] w-[18px]" strokeWidth={2.6} />
              </button>
            </div>
            <p className="text-center text-[12px] font-semibold text-ink-mute">
              {left} of {DAILY_CAP} left today · share your contact card to keep going
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** Green "Contact card" chip — message icon, expands fields (never a call). */
function ContactCardChip({
  bubble,
  open,
  onToggle,
  onMe
}: {
  bubble: Bubble;
  open: boolean;
  onToggle: () => void;
  onMe: boolean;
}) {
  const fields =
    bubble.contactFields && bubble.contactFields.length > 0
      ? bubble.contactFields
      : bubble.phone
        ? [{ label: 'Phone', value: bubble.phone, kind: 'phone' }]
        : [];
  if (fields.length === 0) return null;

  return (
    <div className="mt-1.5">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 font-bold text-success underline decoration-success/40 underline-offset-2"
      >
        Contact card
        <MessageSquareIcon className="h-3.5 w-3.5" strokeWidth={2.6} />
      </button>
      {open ? (
        <div
          className={cn(
            'mt-2 space-y-1.5 border-t pt-2',
            onMe ? 'border-white/25' : 'border-ink-line'
          )}
        >
          {fields.map((f) => (
            <div key={`${f.label}-${f.value}`}>
              <p
                className={cn(
                  'text-[11px] font-bold uppercase tracking-wide',
                  onMe ? 'opacity-70' : 'text-ink-mute'
                )}
              >
                {f.label}
              </p>
              <p className="text-[14px] font-semibold underline">{f.value}</p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

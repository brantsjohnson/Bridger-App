import React from 'react';
import { BellIcon, CalendarHeartIcon, PlusIcon, StickyNoteIcon } from 'lucide-react';
import { FriendNote } from '../../../../packages/shared';
import { PixelHeading, cn } from '../../../../packages/ui';
import { notesFor } from '../../state/connections';

/** Your private scratchpad on a person — notes, dates, and soft check-in nudges. */
export function NotesReminders({
  personId,
  firstName
}: {
  personId: string;
  firstName: string;
}) {
  const [kind, setKind] = React.useState<'text' | 'date' | 'check_in'>('text');
  const [draft, setDraft] = React.useState('');
  const [cadence, setCadence] = React.useState<'week' | 'biweek' | 'month'>('biweek');
  const [notes, setNotes] = React.useState<FriendNote[]>(notesFor(personId));

  const add = () => {
    if (!draft.trim() && kind !== 'check_in') return;
    const body = draft.trim() || (kind === 'check_in' ? 'Check in' : '');
    if (!body) return;
    setNotes((p) => [
      ...p,
      {
        id: `n${p.length + 1}`,
        personId,
        kind,
        body,
        date: kind === 'date' ? 'May 5' : undefined,
        remind: kind === 'date',
        cadence: kind === 'check_in' ? cadence : undefined
      }
    ]);
    setDraft('');
  };

  return (
    <section>
      <PixelHeading size="sm">Notes &amp; reminders</PixelHeading>
      <p className="mt-0.5 text-[13px] font-semibold text-ink-mute">
        On {firstName} · only you can see these
      </p>

      <div className="mt-3 rounded-card border border-ink-line bg-surface p-3">
        <div className="flex gap-2">
          {(['text', 'date', 'check_in'] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              aria-pressed={kind === k}
              className={cn(
                'flex-1 rounded-full px-2 py-2 text-[13px] font-bold transition-colors',
                kind === k
                  ? 'bg-ink text-white'
                  : 'border border-ink-line text-ink-soft hover:bg-[#F1ECFF]'
              )}
            >
              {k === 'text' ? 'Note' : k === 'date' ? 'Date' : 'Check in'}
            </button>
          ))}
        </div>

        {kind === 'check_in' ? (
          <div className="mt-2.5 flex flex-wrap gap-2">
            {(
              [
                ['week', 'Weekly'],
                ['biweek', 'Every 2 weeks'],
                ['month', 'Monthly']
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setCadence(key)}
                aria-pressed={cadence === key}
                className={cn(
                  'rounded-full px-3 py-1.5 text-[12px] font-bold',
                  cadence === key
                    ? 'bg-purple text-white'
                    : 'border border-ink-line text-ink-soft'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-2.5 flex items-center gap-2 rounded-full border border-ink-line bg-surface py-1.5 pl-4 pr-1.5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && add()}
            placeholder={
              kind === 'text'
                ? 'Little thing to remember…'
                : kind === 'date'
                  ? 'Graduation · May 5'
                  : 'Optional hint (ask about their job)'
            }
            aria-label={
              kind === 'text' ? 'New note' : kind === 'date' ? 'New date' : 'Check-in hint'
            }
            className="min-w-0 flex-1 bg-transparent text-[14px] font-semibold text-ink outline-none placeholder:text-ink-mute"
          />
          <button
            type="button"
            onClick={add}
            aria-label="Add"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink text-white"
          >
            <PlusIcon className="h-4 w-4" strokeWidth={3} />
          </button>
        </div>
      </div>

      <div className="mt-2.5 space-y-2">
        {notes.map((n) => (
          <div
            key={n.id}
            className="flex items-center gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-3"
          >
            {n.kind === 'date' ? (
              <CalendarHeartIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
            ) : n.kind === 'check_in' ? (
              <BellIcon className="h-5 w-5 shrink-0 text-purple" strokeWidth={2.4} />
            ) : (
              <StickyNoteIcon className="h-5 w-5 shrink-0 text-ink-soft" strokeWidth={2.2} />
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[14px] font-bold text-ink">{n.body}</span>
              {n.kind === 'date' ? (
                <span className="block truncate text-[12px] font-semibold text-purple">
                  {n.date} · reminds you 1 week before + day of
                </span>
              ) : null}
              {n.kind === 'check_in' ? (
                <span className="block truncate text-[12px] font-semibold text-purple">
                  Nudges you sometimes · only you
                </span>
              ) : null}
            </span>
            {(n.remind || n.kind === 'check_in') && (
              <BellIcon className="h-4 w-4 shrink-0 text-purple" strokeWidth={2.4} />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

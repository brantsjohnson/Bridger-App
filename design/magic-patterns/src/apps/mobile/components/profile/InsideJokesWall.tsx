import React from 'react';
import { FilterIcon } from 'lucide-react';
import { InsideJoke } from '../../../../packages/shared';
import {
  ACCENTS,
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  TextField,
  cn } from
'../../../../packages/ui';
import { AddNoteTile, InsideJokeNote } from '../InsideJokeNote';
import { EVENTS, INSIDE_JOKES, INSIDE_JOKES_BY_ME, PEOPLE } from '../../state/mock-data';

type Filter = 'all' | 'about' | 'by';

/**
 * The Inside Jokes wall. A joke is a quote on a sticky note; tagging people
 * cross-posts it to their walls, and tagging an event shares it with everyone
 * who was there. Adding one is a small "+" among the notes — no central menu.
 */
export function InsideJokesWall({
  ownerFirstName,
  empty = false



}: {ownerFirstName?: string;empty?: boolean;}) {
  const [filter, setFilter] = React.useState<Filter>('all');
  const about: InsideJoke[] = empty ? [] : INSIDE_JOKES;
  const [mine, setMine] = React.useState<InsideJoke[]>(empty ? [] : INSIDE_JOKES_BY_ME);
  const [adding, setAdding] = React.useState(false);

  const who = ownerFirstName ?? 'you';
  /* one wall, filtered — not two separate places to look */
  const notes =
  filter === 'about' ? about : filter === 'by' ? mine : [...about, ...mine];

  const add = (joke: InsideJoke) => {
    setMine((m) => [joke, ...m]);
    setFilter('by');
  };

  return (
    <div className="space-y-4">
      <FilterRow
        value={filter}
        onChange={setFilter}
        counts={{ all: about.length + mine.length, about: about.length, by: mine.length }}
        who={who} />
      

      {notes.length > 0 ?
      <div className="grid grid-cols-2 gap-3.5">
          <AddNoteTile onClick={() => setAdding(true)} />
          {notes.map((joke, i) =>
        <InsideJokeNote key={joke.id} joke={joke} index={i + 1} />
        )}
        </div> :

      // Empty default: half-column square (same grid as when notes exist).
      <div className="grid grid-cols-2 gap-3.5">
          <AddNoteTile onClick={() => setAdding(true)} />
        </div>
      }

      <AddInsideJokeSheet open={adding} onClose={() => setAdding(false)} onAdd={add} />
    </div>);

}

/** One wall, three filters — everything, said about them, or said by them. */
function FilterRow({
  value,
  onChange,
  counts,
  who




}: {value: Filter;onChange: (f: Filter) => void;counts: Record<Filter, number>;who: string;}) {
  const options: Array<[Filter, string]> = [
  ['all', 'All'],
  ['about', `About ${who}`],
  ['by', `By ${who}`]];


  return (
    <div className="no-scrollbar -mx-5 flex items-center gap-1.5 overflow-x-auto px-5">
      <FilterIcon
        aria-hidden="true"
        className="h-3.5 w-3.5 shrink-0 text-ink-mute"
        strokeWidth={2.6} />
      
      {options.map(([key, label]) => {
        const on = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            aria-pressed={on}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
              on ?
              'border-transparent bg-ink text-white' :
              'border-ink-line bg-white text-ink-soft hover:bg-[#F1ECFF]'
            )}>
            
            {label}
            <span className={cn('ml-1.5', on ? 'text-white/60' : 'text-ink-mute')}>
              {counts[key]}
            </span>
          </button>);

      })}
    </div>);

}

const NOTE_ACCENTS = ['amber', 'pink', 'teal', 'green', 'blue'] as const;

/** Write the quote, tag who said it, and where it happened. */
export function AddInsideJokeSheet({
  open,
  onClose,
  onAdd
}: {open: boolean;onClose: () => void;onAdd: (joke: InsideJoke) => void;}) {
  const [text, setText] = React.useState('');
  const [tagged, setTagged] = React.useState<string[]>([]);
  const [whereText, setWhereText] = React.useState('');
  const [eventChip, setEventChip] = React.useState<string | null>(null);

  const reset = () => {
    setText('');
    setTagged([]);
    setWhereText('');
    setEventChip(null);
  };

  const close = () => {
    reset();
    onClose();
  };

  const resolvedWhere = whereText.trim() || eventChip || undefined;

  const save = () => {
    if (!text.trim()) return;
    onAdd({
      id: `j${Date.now()}`,
      text: text.trim(),
      fromName: 'You',
      accent: NOTE_ACCENTS[Math.floor(Math.random() * NOTE_ACCENTS.length)],
      taggedIds: tagged,
      eventName: resolvedWhere
    });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Add an Inside Joke">
      <div className="min-h-[420px] space-y-5">
        <TextField
          label="The quote"
          multiline
          value={text}
          onChange={setText}
          placeholder="Bread is just a warm friend." />

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
            Who said it
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {PEOPLE.slice(0, 8).map((p) => {
              const on = tagged.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                    setTagged((t) => on ? t.filter((id) => id !== p.id) : [...t, p.id])
                    }
                    aria-pressed={on}
                    className={cn(
                      'flex min-h-[44px] items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition-colors',
                      on ?
                      'border-purple bg-purple text-onaccent' :
                      'border-ink-line bg-white text-ink hover:bg-[#F1ECFF]'
                    )}>
                    
                    <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                    <span className="text-[12px] font-bold">{p.name.split(' ')[0]}</span>
                  </button>
                </li>);

            })}
          </ul>
        </section>

        <section className="space-y-2">
          <TextField
            label="Where it happened"
            value={whereText}
            onChange={(v) => {
              setWhereText(v);
              if (v.trim()) setEventChip(null);
            }}
            placeholder="Kitchen table, Sketch night…" />
          
          <ul className="flex flex-wrap gap-1.5">
            {EVENTS.slice(0, 3).map((e) => {
              const on = eventChip === e.title && !whereText.trim();
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setEventChip(on ? null : e.title);
                      setWhereText('');
                    }}
                    aria-pressed={on}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
                      on ?
                      cn(ACCENTS.teal.bg, ACCENTS.teal.text, 'border-transparent') :
                      'border-ink-line bg-white text-ink hover:bg-[#E6F7F0]'
                    )}>
                    
                    {e.title}
                  </button>
                </li>);

            })}
          </ul>
        </section>

        <div className="space-y-2">
          <ButtonPrimary full size="lg" onClick={save}>
            Post it
          </ButtonPrimary>
          <ButtonSecondary full tone="ghost" onClick={close}>
            Never mind
          </ButtonSecondary>
        </div>
      </div>
    </Sheet>);

}

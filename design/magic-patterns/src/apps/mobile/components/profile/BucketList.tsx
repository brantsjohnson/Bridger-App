import React from 'react';
import { CheckIcon, LockIcon } from 'lucide-react';
import { BucketItem } from '../../../../packages/shared';
import {
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  TextField,
  Toggle,
  cn } from
'../../../../packages/ui';
import { BUCKET_LIST, PEOPLE, personById } from '../../state/mock-data';

/**
 * A profile-only module. Each line is either a solo want or something to do
 * with specific friends, is public or private, and can be checked off.
 * Added with a small "+", never from a central menu.
 */
export function BucketList({
  editable = false,
  empty = false



}: {editable?: boolean;empty?: boolean;}) {
  const [items, setItems] = React.useState<BucketItem[]>(empty ? [] : BUCKET_LIST);
  const [adding, setAdding] = React.useState(false);

  /* a viewer never sees the private lines */
  const shown = editable ? items : items.filter((i) => !i.isPrivate);

  const toggle = (id: string) =>
  setItems((list) => list.map((i) => i.id === id ? { ...i, done: !i.done } : i));

  if (shown.length === 0 && !editable) {
    return <p className="text-[13px] font-semibold text-ink-mute">Nothing on the list yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      {shown.map((item) =>
      <Row key={item.id} item={item} editable={editable} onToggle={() => toggle(item.id)} />
      )}

      {editable &&
      <button
        type="button"
        onClick={() => setAdding(true)}
        className="flex w-full items-center gap-3 rounded-card border-2 border-dashed border-ink-line bg-white/60 px-3.5 py-3 text-left transition-colors hover:border-purple/50 hover:bg-[#F1ECFF]">
        
          <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-purple text-[16px] font-bold leading-none text-onaccent">
          
            +
          </span>
          <span className="text-[13px] font-bold text-ink-soft">Add to your bucket list</span>
        </button>
      }

      <AddBucketItemSheet
        open={adding}
        onClose={() => setAdding(false)}
        onAdd={(item) => setItems((list) => [item, ...list])} />
      
    </div>);

}

function Row({
  item,
  editable,
  onToggle




}: {item: BucketItem;editable: boolean;onToggle: () => void;}) {
  const withPeople = item.withIds.map(personById);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3',
        item.done && 'opacity-60'
      )}>
      
      <button
        type="button"
        onClick={editable ? onToggle : undefined}
        disabled={!editable}
        aria-pressed={item.done}
        aria-label={item.done ? `Undo ${item.text}` : `Mark ${item.text} done`}
        className={cn(
          'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          item.done ? 'border-green bg-green text-ink' : 'border-ink-line bg-white',
          editable && !item.done && 'hover:border-green'
        )}>
        
        {item.done && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.4} />}
      </button>

      <span className="min-w-0 flex-1">
        <span
          className={cn(
            'block truncate text-[14px] font-bold text-ink',
            item.done && 'line-through'
          )}>
          
          {item.text}
        </span>
        {withPeople.length > 0 &&
        <span className="block truncate text-[12px] font-semibold text-ink-mute">
            with {withPeople.map((p) => p.name.split(' ')[0]).join(' & ')}
          </span>
        }
      </span>

      {withPeople.length > 0 &&
      <span aria-hidden="true" className="flex -space-x-2">
          {withPeople.slice(0, 3).map((p) =>
        <Avatar
          key={p.id}
          name={p.name}
          emoji={p.emoji}
          accent={p.accent}
          size="xs"
          className="-ml-1 first:ml-0" />

        )}
        </span>
      }

      {item.isPrivate &&
      <LockIcon
        aria-label="Private"
        className="h-3.5 w-3.5 shrink-0 text-ink-mute"
        strokeWidth={2.6} />

      }
    </div>);

}

function AddBucketItemSheet({
  open,
  onClose,
  onAdd




}: {open: boolean;onClose: () => void;onAdd: (item: BucketItem) => void;}) {
  const [text, setText] = React.useState('');
  const [withIds, setWithIds] = React.useState<string[]>([]);
  const [isPrivate, setPrivate] = React.useState(false);

  const close = () => {
    setText('');
    setWithIds([]);
    setPrivate(false);
    onClose();
  };

  const save = () => {
    if (!text.trim()) return;
    onAdd({ id: `b${Date.now()}`, text: text.trim(), withIds, done: false, isPrivate });
    close();
  };

  return (
    <Sheet open={open} onClose={close} title="Add to your bucket list">
      <div className="space-y-4">
        <TextField
          label="What do you want to do?"
          value={text}
          onChange={setText}
          placeholder="Learn to surf" />
        

        <section>
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-ink-mute">
            With anyone? (optional)
          </p>
          <ul className="flex flex-wrap gap-1.5">
            {PEOPLE.slice(0, 6).map((p) => {
              const on = withIds.includes(p.id);
              return (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() =>
                    setWithIds((w) => on ? w.filter((id) => id !== p.id) : [...w, p.id])
                    }
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition-colors',
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

        <div className="flex items-center justify-between rounded-card border border-ink-line bg-surface px-3.5 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">Keep it private</span>
            <span className="block text-[12px] font-semibold text-ink-mute">
              Only you can see it
            </span>
          </span>
          <Toggle checked={isPrivate} onChange={setPrivate} label="Keep it private" />
        </div>

        <div className="space-y-2">
          <ButtonPrimary full size="lg" onClick={save}>
            Add it
          </ButtonPrimary>
          <ButtonSecondary full tone="ghost" onClick={close}>
            Never mind
          </ButtonSecondary>
        </div>
      </div>
    </Sheet>);

}
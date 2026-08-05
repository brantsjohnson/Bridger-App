/**
 * WHAT THIS FILE DOES (plain English):
 * Magic Patterns mirror of the Bucket List tab. Title + Edit + circular "+",
 * check-off, edit/delete in Edit mode. Swipe-to-delete lives in the React
 * Native app (gesture); here Edit mode trash covers delete for the web prototype.
 */
import React from 'react';
import { CheckIcon, LockIcon, TrashIcon } from 'lucide-react';
import { BucketItem } from '../../../../packages/shared';
import {
  Avatar,
  ButtonPrimary,
  ButtonSecondary,
  Sheet,
  TextField,
  Toggle,
  cn
} from '../../../../packages/ui';
import { BUCKET_LIST, PEOPLE, personById } from '../../state/mock-data';

export function BucketList({
  editable = false,
  empty = false
}: {
  editable?: boolean;
  empty?: boolean;
}) {
  const [items, setItems] = React.useState<BucketItem[]>(empty ? [] : BUCKET_LIST);
  const [adding, setAdding] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [editItem, setEditItem] = React.useState<BucketItem | null>(null);

  /* a viewer never sees the private lines */
  const shown = editable ? items : items.filter((i) => !i.isPrivate);

  const toggle = (id: string) =>
    setItems((list) => list.map((i) => (i.id === id ? { ...i, done: !i.done } : i)));

  const remove = (id: string) => {
    setItems((list) => list.filter((i) => i.id !== id));
    if (editItem?.id === id) setEditItem(null);
  };

  if (shown.length === 0 && !editable) {
    return <p className="text-[13px] font-semibold text-ink-mute">Nothing on the list yet.</p>;
  }

  return (
    <div className="space-y-2.5">
      <div className="mb-1 flex items-center justify-between gap-3">
        <h2 className="min-w-0 flex-1 font-display text-[28px] italic text-ink">Bucket List</h2>
        {editable ? (
          <div className="flex items-center gap-2">
            <ButtonSecondary
              size="sm"
              tone={editing ? 'solid' : 'light'}
              onClick={() => setEditing((v) => !v)}
            >
              {editing ? 'Done' : 'Edit'}
            </ButtonSecondary>
            <button
              type="button"
              onClick={() => setAdding(true)}
              aria-label="Add to your bucket list"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-purple text-[20px] font-bold text-onaccent"
            >
              +
            </button>
          </div>
        ) : null}
      </div>

      {editing && shown.length > 0 ? (
        <p className="text-[12px] font-semibold text-ink-mute">
          Tap a row to edit it. Use the trash to delete.
        </p>
      ) : null}

      {shown.map((item) => (
        <Row
          key={item.id}
          item={item}
          editable={editable}
          editing={editing}
          onToggle={() => toggle(item.id)}
          onEdit={() => setEditItem(item)}
          onDelete={() => remove(item.id)}
        />
      ))}

      {editable && shown.length === 0 ? (
        <p className="text-[13px] font-semibold text-ink-mute">
          Nothing yet. Tap + to add something you want to do.
        </p>
      ) : null}

      <BucketItemSheet
        open={adding}
        mode="add"
        onClose={() => setAdding(false)}
        onSave={(item) => setItems((list) => [item, ...list])}
      />

      <BucketItemSheet
        open={!!editItem}
        mode="edit"
        initial={editItem ?? undefined}
        onClose={() => setEditItem(null)}
        onSave={(next) => {
          if (!editItem) return;
          setItems((list) =>
            list.map((i) =>
              i.id === editItem.id
                ? { ...i, text: next.text, withIds: next.withIds, isPrivate: next.isPrivate }
                : i
            )
          );
          setEditItem(null);
        }}
        onDelete={editItem ? () => remove(editItem.id) : undefined}
      />
    </div>
  );
}

function Row({
  item,
  editable,
  editing,
  onToggle,
  onEdit,
  onDelete
}: {
  item: BucketItem;
  editable: boolean;
  editing: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const withPeople = item.withIds.map(personById);

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3',
        item.done && 'opacity-60'
      )}
    >
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
        )}
      >
        {item.done && <CheckIcon className="h-3.5 w-3.5" strokeWidth={3.4} />}
      </button>

      <button
        type="button"
        disabled={!editable || !editing}
        onClick={editing ? onEdit : undefined}
        className="min-w-0 flex-1 text-left"
        aria-label={editing ? `Edit ${item.text}` : undefined}
      >
        <span
          className={cn(
            'block truncate text-[14px] font-bold text-ink',
            item.done && 'line-through'
          )}
        >
          {item.text}
        </span>
        {withPeople.length > 0 && (
          <span className="block truncate text-[12px] font-semibold text-ink-mute">
            with {withPeople.map((p) => p.name.split(' ')[0]).join(' & ')}
          </span>
        )}
      </button>

      {withPeople.length > 0 && !editing && (
        <span aria-hidden="true" className="flex -space-x-2">
          {withPeople.slice(0, 3).map((p) => (
            <Avatar
              key={p.id}
              name={p.name}
              emoji={p.emoji}
              accent={p.accent}
              size="xs"
              className="-ml-1 first:ml-0"
            />
          ))}
        </span>
      )}

      {item.isPrivate && !editing && (
        <LockIcon
          aria-label="Private"
          className="h-3.5 w-3.5 shrink-0 text-ink-mute"
          strokeWidth={2.6}
        />
      )}

      {editable && editing && (
        <button
          type="button"
          onClick={onDelete}
          aria-label={`Delete ${item.text}`}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-coral/15 text-coral"
        >
          <TrashIcon className="h-[18px] w-[18px]" strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}

function BucketItemSheet({
  open,
  mode,
  initial,
  onClose,
  onSave,
  onDelete
}: {
  open: boolean;
  mode: 'add' | 'edit';
  initial?: BucketItem;
  onClose: () => void;
  onSave: (item: BucketItem) => void;
  onDelete?: () => void;
}) {
  const [text, setText] = React.useState('');
  const [withIds, setWithIds] = React.useState<string[]>([]);
  const [isPrivate, setPrivate] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setText(initial?.text ?? '');
    setWithIds(initial?.withIds ? [...initial.withIds] : []);
    setPrivate(initial?.isPrivate ?? false);
  }, [open, initial?.id]);

  const close = () => {
    setText('');
    setWithIds([]);
    setPrivate(false);
    onClose();
  };

  const save = () => {
    if (!text.trim()) return;
    onSave({
      id: initial?.id ?? `b${Date.now()}`,
      text: text.trim(),
      withIds,
      done: initial?.done ?? false,
      isPrivate
    });
    close();
  };

  return (
    <Sheet
      open={open}
      onClose={close}
      title={mode === 'add' ? 'Add to your bucket list' : 'Edit bucket list item'}
    >
      <div className="space-y-4">
        <TextField
          label="What do you want to do?"
          value={text}
          onChange={setText}
          placeholder="Learn to surf"
        />

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
                      setWithIds((w) => (on ? w.filter((id) => id !== p.id) : [...w, p.id]))
                    }
                    aria-pressed={on}
                    className={cn(
                      'flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-3 transition-colors',
                      on
                        ? 'border-purple bg-purple text-onaccent'
                        : 'border-ink-line bg-white text-ink hover:bg-[#F1ECFF]'
                    )}
                  >
                    <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                    <span className="text-[12px] font-bold">{p.name.split(' ')[0]}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <div className="flex items-center justify-between rounded-card border border-ink-line bg-surface px-3.5 py-3">
          <span className="min-w-0 flex-1">
            <span className="block text-[14px] font-bold text-ink">Keep it private</span>
            <span className="block text-[12px] font-semibold text-ink-mute">Only you can see it</span>
          </span>
          <Toggle checked={isPrivate} onChange={setPrivate} label="Keep it private" />
        </div>

        <div className="space-y-2">
          <ButtonPrimary full size="lg" onClick={save}>
            {mode === 'add' ? 'Add it' : 'Save'}
          </ButtonPrimary>
          {mode === 'edit' && onDelete ? (
            <ButtonSecondary
              full
              tone="ghost"
              onClick={() => {
                onDelete();
                close();
              }}
            >
              Delete
            </ButtonSecondary>
          ) : null}
          <ButtonSecondary full tone="ghost" onClick={close}>
            Never mind
          </ButtonSecondary>
        </div>
      </div>
    </Sheet>
  );
}

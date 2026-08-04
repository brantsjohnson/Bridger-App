import React from 'react';
import { EventItem } from '../../../../packages/shared';
import { ButtonPrimary, ButtonSecondary, Sheet, TextField, cn } from '../../../../packages/ui';

const METHODS: Array<NonNullable<EventItem['chipInMethod']>> = [
'Venmo',
'Cash App',
'PayPal',
'Zelle',
'Cash in person'];


export type EventEdits = Pick<
  EventItem,
  'title' |
  'day' |
  'time' |
  'place' |
  'address' |
  'bio' |
  'bring' |
  'chipInAmount' |
  'chipInMethod' |
  'chipInHandle' |
  'chipInNote'>;


/** The host editing their own event — everything a guest reads, in one place. */
export function EditEventSheet({
  open,
  event,
  onClose,
  onSave





}: {open: boolean;event: EventItem;onClose: () => void;onSave: (edits: EventEdits) => void;}) {
  const [draft, setDraft] = React.useState<EventEdits>(event);

  React.useEffect(() => {
    if (open) setDraft(event);
  }, [open, event]);

  const set = <K extends keyof EventEdits,>(key: K, value: EventEdits[K]) =>
  setDraft((d) => ({ ...d, [key]: value }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Edit event"
      footer={
      <div className="space-y-2">
          <ButtonPrimary full size="lg" onClick={() => onSave(draft)}>
            Save changes
          </ButtonPrimary>
          <ButtonSecondary full tone="ghost" onClick={onClose}>
            Cancel
          </ButtonSecondary>
        </div>
      }>
      
      <div className="max-h-[52vh] space-y-3.5 overflow-y-auto pr-0.5">
        <TextField label="Title" value={draft.title} onChange={(v) => set('title', v)} />

        <div className="grid grid-cols-2 gap-2.5">
          <TextField label="Day" value={draft.day} onChange={(v) => set('day', v)} />
          <TextField label="Time" value={draft.time} onChange={(v) => set('time', v)} />
        </div>

        <TextField label="Place" value={draft.place} onChange={(v) => set('place', v)} />
        <TextField
          label="Address"
          value={draft.address ?? ''}
          onChange={(v) => set('address', v)}
          placeholder="Street, unit, how to get in" />
        
        <p className="-mt-2 text-[11px] font-semibold text-ink-mute">
          Only people going or invited can see the address.
        </p>

        <TextField
          label="What it is"
          multiline
          value={draft.bio ?? ''}
          onChange={(v) => set('bio', v)}
          placeholder="What you'll actually be doing, and who it's for." />
        

        <TextField
          label="What to bring"
          value={draft.bring ?? ''}
          onChange={(v) => set('bring', v)}
          placeholder="A sketchbook" />
        

        <section className="rounded-card border border-ink-line bg-white p-3.5">
          <p className="text-[13px] font-bold text-ink">Chipping in</p>
          <p className="mt-0.5 text-[12px] font-semibold leading-snug text-ink-mute">
            Optional. We never touch the money — guests send it to you directly.
          </p>

          <div className="mt-3 space-y-3">
            <TextField
              label="Amount per person"
              value={draft.chipInAmount ?? ''}
              onChange={(v) => set('chipInAmount', v)}
              placeholder="$5" />
            

            <div>
              <p className="mb-2 text-[12px] font-bold text-ink-soft">How to send it</p>
              <div className="flex flex-wrap gap-1.5">
                {METHODS.map((m) => {
                  const on = draft.chipInMethod === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => set('chipInMethod', on ? undefined : m)}
                      aria-pressed={on}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-[12px] font-bold transition-colors',
                        on ?
                        'border-transparent bg-ink text-white' :
                        'border-ink-line bg-white text-ink hover:bg-[#F1ECFF]'
                      )}>
                      
                      {m}
                    </button>);

                })}
              </div>
            </div>

            {draft.chipInMethod && draft.chipInMethod !== 'Cash in person' &&
            <TextField
              label={`${draft.chipInMethod} handle`}
              value={draft.chipInHandle ?? ''}
              onChange={(v) => set('chipInHandle', v)}
              placeholder="@your-handle" />

            }

            <TextField
              label="What it's for"
              value={draft.chipInNote ?? ''}
              onChange={(v) => set('chipInNote', v)}
              placeholder="Covers paper and spare pencils." />
            
          </div>
        </section>
      </div>
    </Sheet>);

}
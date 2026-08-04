import React from 'react';
import { ButtonSecondary, Sheet, TextField, cn } from '../../../packages/ui';

const WHO = ['Close', 'Friends', 'Everyone'];
const WHEN = ['Now', 'Tonight', 'Weekend'];

/** Who to tell · when · send. Concentric groups, no view counts. */
export function TouchGrassSheet({
  open,
  onClose,
  onSend




}: {open: boolean;onClose: () => void;onSend: () => void;}) {
  const [who, setWho] = React.useState('Friends');
  const [when, setWhen] = React.useState('Now');
  const [note, setNote] = React.useState('');

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Who's free?"
      footer={
      <ButtonSecondary full size="lg" tone="positive" onClick={onSend}>
          Send signal
        </ButtonSecondary>
      }>
      
      <div className="space-y-4">
        <Segment label="Who to tell" options={WHO} value={who} onChange={setWho} tone="ink" />
        <Segment label="When" options={WHEN} value={when} onChange={setWhen} tone="green" />
        <TextField label="Note" value={note} onChange={setNote} placeholder="anything outside" />
      </div>
    </Sheet>);

}

function Segment({
  label,
  options,
  value,
  onChange,
  tone






}: {label: string;options: string[];value: string;onChange: (v: string) => void;tone: 'ink' | 'green';}) {
  return (
    <div>
      <p className="mb-2 text-[12px] font-bold text-ink-soft">{label}</p>
      <div className="flex gap-2">
        {options.map((o) => {
          const active = o === value;
          return (
            <button
              key={o}
              type="button"
              onClick={() => onChange(o)}
              aria-pressed={active}
              className={cn(
                'flex-1 rounded-full px-3 py-2.5 text-[13px] font-bold transition-colors',
                active ?
                tone === 'ink' ?
                'bg-ink text-white' :
                'bg-success text-white' :
                'border border-ink-line bg-white text-ink hover:bg-[#F1ECFF]'
              )}>
              
              {o}
            </button>);

        })}
      </div>
    </div>);

}
import React from 'react';
import { PlusIcon, XIcon } from 'lucide-react';
import { ButtonPrimary, ButtonSecondary, Sheet, TextField } from '../../../../packages/ui';

/** Ask the group something — a poll with options, or an open question. */
export function AskSheet({
  open,
  kind,
  onClose




}: {open: boolean;kind: 'poll' | 'question';onClose: () => void;}) {
  const [prompt, setPrompt] = React.useState('');
  const [options, setOptions] = React.useState(['', '']);

  React.useEffect(() => {
    if (!open) {
      setPrompt('');
      setOptions(['', '']);
    }
  }, [open]);

  const ready = prompt.trim() && (kind === 'question' || options.filter((o) => o.trim()).length >= 2);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={kind === 'poll' ? 'Create a poll' : 'Ask a question'}
      footer={
      <ButtonPrimary full size="md" disabled={!ready} onClick={onClose}>
          Post
        </ButtonPrimary>
      }>
      
      <div className="space-y-3">
        <TextField
          label={kind === 'poll' ? 'Poll' : 'Question'}
          value={prompt}
          onChange={setPrompt}
          placeholder={kind === 'poll' ? 'Best taco spot?' : 'Anyone got a good dentist?'} />
        

        {kind === 'poll' &&
        <div className="space-y-2">
            {options.map((o, i) =>
          <div key={i} className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <TextField
                label={`Option ${i + 1}`}
                value={o}
                onChange={(v) => setOptions((p) => p.map((x, j) => j === i ? v : x))}
                placeholder={i === 0 ? 'El Rey' : 'La Playa'} />
              
                </div>
                {options.length > 2 &&
            <button
              type="button"
              onClick={() => setOptions((p) => p.filter((_, j) => j !== i))}
              aria-label="Remove option"
              className="mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-mute hover:bg-[#F1ECFF]">
              
                    <XIcon className="h-4 w-4" strokeWidth={2.6} />
                  </button>
            }
              </div>
          )}

            {options.length < 4 &&
          <ButtonSecondary
            full
            size="sm"
            icon={<PlusIcon className="h-4 w-4" strokeWidth={2.6} />}
            onClick={() => setOptions((p) => [...p, ''])}>
            
                Add option
              </ButtonSecondary>
          }
          </div>
        }
      </div>
    </Sheet>);

}
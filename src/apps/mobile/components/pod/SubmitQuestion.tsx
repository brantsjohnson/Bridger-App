import React from 'react';
import { ArrowBigUpIcon } from 'lucide-react';
import { ButtonPrimary, Sheet, TextField, cn } from '../../../../packages/ui';
import { SUBMITTED_QUESTIONS } from '../../state/pod';
import { personById } from '../../state/mock-data';

/** Anyone can suggest a question for the group's next 5. */
export function SubmitQuestion({ open, onClose }: {open: boolean;onClose: () => void;}) {
  const [text, setText] = React.useState('');
  const [voted, setVoted] = React.useState<string[]>([]);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Submit a question"
      footer={
      <ButtonPrimary full size="md" disabled={!text.trim()} onClick={onClose}>
          Submit
        </ButtonPrimary>
      }>
      
      <div className="space-y-4">
        <TextField
          label="Question"
          value={text}
          onChange={setText}
          placeholder="What made you laugh this week?" />
        

        <div>
          <p className="mb-2 text-[12px] font-bold text-ink-soft">Up next</p>
          <div className="space-y-2">
            {SUBMITTED_QUESTIONS.map((q) => {
              const author = personById(q.authorId);
              const up = voted.includes(q.id);
              return (
                <div
                  key={q.id}
                  className="flex items-center gap-3 rounded-card border border-ink-line bg-white px-3.5 py-3">
                  
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[14px] font-bold text-ink">{q.text}</span>
                    <span className="block text-[12px] font-semibold text-ink-mute">
                      {author.name.split(' ')[0]}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setVoted((p) => up ? p.filter((x) => x !== q.id) : [...p, q.id])}
                    aria-pressed={up}
                    className={cn(
                      'flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1.5 text-[12px] font-bold transition-colors',
                      up ? 'bg-success text-white' : 'bg-[#EDE6FF] text-purple'
                    )}>
                    
                    <ArrowBigUpIcon className="h-4 w-4" strokeWidth={2.4} />
                    {q.votes + (up ? 1 : 0)}
                  </button>
                </div>);

            })}
          </div>
        </div>
      </div>
    </Sheet>);

}
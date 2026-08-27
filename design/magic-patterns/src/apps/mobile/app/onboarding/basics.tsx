import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PlusIcon } from 'lucide-react';
import {
  ButtonSecondary,
  Interest,
  InterestGrid,
  StepProgress,
  TextField,
  cn } from
'../../../../packages/ui';
import { OnboardingStep } from '../../components/OnboardingStep';
import { INTERESTS } from '../../state/mock-data';

type Question =
{id: string;ask: string;kind: 'text';placeholder: string;} |
{id: string;ask: string;kind: 'date';} |
{id: string;ask: string;kind: 'select';options: string[];} |
{id: string;ask: string;kind: 'thisOrThat';a: string;b: string;aEmoji: string;bEmoji: string;} |
{id: string;ask: string;kind: 'interests';} |
{id: string;ask: string;kind: 'yesNo';followUp: string;};

/** The 10 basics. Mostly tappable, all skippable. */
const QUESTIONS: Question[] = [
{ id: 'birthday', ask: "When's your birthday?", kind: 'date' },
{ id: 'hometown', ask: 'Where are you from?', kind: 'text', placeholder: 'Boise, ID' },
{ id: 'city', ask: 'Where do you live now?', kind: 'text', placeholder: 'Portland, OR' },
{
  id: 'upto',
  ask: 'What are you up to these days?',
  kind: 'select',
  options: ['Working', 'In school', 'Building something', 'Figuring it out']
},
{ id: 'interests', ask: 'What are you into?', kind: 'interests' },
{ id: 'pets', ask: 'Any pets?', kind: 'yesNo', followUp: 'Type and names' },
{ id: 'school', ask: "Where'd you go to school?", kind: 'text', placeholder: 'Reed College' },
{ id: 'nickname', ask: 'Any nicknames?', kind: 'text', placeholder: 'Ro' },
{
  id: 'owl',
  ask: 'Morning person or night owl?',
  kind: 'thisOrThat',
  a: 'Morning',
  b: 'Night owl',
  aEmoji: '🌅',
  bEmoji: '🌙'
},
{
  id: 'else',
  ask: 'Anything else your friends should know?',
  kind: 'text',
  placeholder: 'Allergic to cilantro'
}];


/**
 * 5 · One question per screen inside the step, with its own progress bar.
 * The same pattern every profile module and quiz uses.
 */
export function BasicsScreen({ onNext, onSkip }: {onNext?: () => void;onSkip?: () => void;}) {
  const [index, setIndex] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const [pool, setPool] = React.useState<Interest[]>(INTERESTS);
  const [likes, setLikes] = React.useState<string[]>(['jazz']);
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  const q = QUESTIONS[index];
  const last = index === QUESTIONS.length - 1;

  const advance = () => {
    if (last) onNext?.();else
    setIndex((i) => i + 1);
  };

  const set = (value: string) => setAnswers((a) => ({ ...a, [q.id]: value }));

  /** Tappable answers move you along on their own. Typed ones wait for Continue. */
  const pick = (value: string) => {
    set(value);
    window.setTimeout(advance, 220);
  };

  const addOwn = () => {
    const label = draft.trim();
    if (!label) return;
    const id = `own-${label.toLowerCase().replace(/\s+/g, '-')}`;
    setPool((p) => [...p, { id, label, emoji: '✨', accent: 'green' }]);
    setLikes((p) => [...p, id]);
    setDraft('');
    setAdding(false);
  };

  return (
    <OnboardingStep
      step={6}
      total={10}
      purpose="A few things friends want to know."
      ask={q.ask}
      cta={last ? 'Done' : 'Continue'}
      accent="teal"
      onContinue={advance}
      onSkip={last ? onSkip : () => advance()}>
      
      <div className="space-y-4">
        <StepProgress step={index + 1} total={QUESTIONS.length} accent="teal" />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}>
            
            {q.kind === 'text' &&
            <TextField
              label={q.ask}
              value={answers[q.id] ?? ''}
              onChange={set}
              placeholder={q.placeholder} />

            }

            {q.kind === 'date' &&
            <TextField
              label="Birthday"
              value={answers[q.id] ?? ''}
              onChange={set}
              placeholder="March 14" />

            }

            {q.kind === 'select' &&
            <div className="space-y-2.5">
                {q.options.map((o) =>
              <ButtonSecondary
                key={o}
                full
                size="lg"
                tone={answers[q.id] === o ? 'solid' : 'outline'}
                onClick={() => pick(o)}>
                
                    {o}
                  </ButtonSecondary>
              )}
              </div>
            }

            {q.kind === 'thisOrThat' &&
            <div className="grid grid-cols-2 gap-3">
                {[
              { label: q.a, emoji: q.aEmoji, shape: 'rounded-[28px_10px_28px_10px]' },
              { label: q.b, emoji: q.bEmoji, shape: 'rounded-[10px_28px_10px_28px]' }].
              map((o) =>
              <button
                key={o.label}
                type="button"
                onClick={() => pick(o.label)}
                className={cn(
                  'flex flex-col items-center gap-2 px-4 py-8 transition-transform active:scale-[0.98]',
                  o.shape,
                  answers[q.id] === o.label ?
                  'bg-purple text-onaccent' :
                  'border border-ink-line bg-white text-ink'
                )}>
                
                    <span aria-hidden="true" className="text-[32px]">
                      {o.emoji}
                    </span>
                    <span className="text-[15px] font-bold">{o.label}</span>
                  </button>
              )}
              </div>
            }

            {q.kind === 'yesNo' &&
            <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {['Yes', 'No'].map((o) =>
                <ButtonSecondary
                  key={o}
                  full
                  size="lg"
                  tone={answers[q.id]?.startsWith(o) ? 'solid' : 'outline'}
                  onClick={() => set(o)}>
                  
                      {o}
                    </ButtonSecondary>
                )}
                </div>
                {answers[q.id]?.startsWith('Yes') &&
              <TextField
                label={q.followUp}
                value={answers[`${q.id}-detail`] ?? ''}
                onChange={(v) => setAnswers((a) => ({ ...a, [`${q.id}-detail`]: v }))}
                placeholder="Cat · Miso" />

              }
              </div>
            }

            {q.kind === 'interests' &&
            <div className="space-y-4">
                <InterestGrid
                interests={pool}
                selected={likes}
                onToggle={(id) =>
                setLikes((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id])
                } />
              

                {adding ?
              <div className="flex items-end gap-2">
                    <TextField
                  label="Add your own"
                  value={draft}
                  onChange={setDraft}
                  placeholder="Bouldering" />
                
                    <ButtonSecondary tone="solid" onClick={addOwn}>
                      Add
                    </ButtonSecondary>
                  </div> :

              <ButtonSecondary
                full
                icon={<PlusIcon className="h-4 w-4" strokeWidth={2.6} />}
                onClick={() => setAdding(true)}>
                
                    Add your own
                  </ButtonSecondary>
              }
              </div>
            }
          </motion.div>
        </AnimatePresence>
      </div>
    </OnboardingStep>);

}
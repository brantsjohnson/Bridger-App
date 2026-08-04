import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeftIcon, LockIcon, XIcon } from 'lucide-react';
import { cn } from '../tokens';
import { ButtonPrimary } from './Button';
import { AudienceLevel, AudiencePicker } from './AudiencePicker';

export type ModuleQuestion =
{id: string;ask: string;type: 'single';options: string[];emoji?: string;} |
{id: string;ask: string;type: 'multi';options: string[];emoji?: string;} |
{id: string;ask: string;type: 'text';placeholder?: string;emoji?: string;} |
{id: string;ask: string;type: 'thisOrThat';a: string;b: string;emoji?: string;};

export type ModuleAnswer = string | string[];

/**
 * The one baseline every profile module uses: one question per screen, a
 * progress bar, smooth transitions, skippable, ending in a review where you
 * set who sees it. Filling out your favs should feel exactly like onboarding.
 */
export function ModuleFlow({
  open,
  title,
  questions,
  mode = 'share',
  intro,
  onClose,
  onDone














}: {open: boolean;title: string;questions: ModuleQuestion[]; /**
   * 'share' — a profile module: ends by choosing who sees it.
   * 'private' — a matching module: answers are never shown to anyone, so
   * there's no audience to pick. Always opens on the privacy screen first.
   */mode?: 'share' | 'private'; /** one line on the opening screen saying what this module is for */intro?: string;onClose: () => void;onDone?: (answers: Record<string, ModuleAnswer>, audience: AudienceLevel) => void;}) {const isPrivate = mode === 'private';const total = questions.length + 1; /** private modules always start on the promise, before a single question */const [started, setStarted] = React.useState(!isPrivate);
  const [step, setStep] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, ModuleAnswer>>({});
  const [audience, setAudience] = React.useState<AudienceLevel>('friend');

  React.useEffect(() => {
    if (!open) {
      setStep(0);
      setStarted(!isPrivate);
      setAnswers({});
      setAudience('friend');
    }
  }, [open, isPrivate]);

  const q = questions[step];
  const reviewing = step === questions.length;
  const next = () => setStep((s) => Math.min(questions.length, s + 1));
  const set = (id: string, v: ModuleAnswer) => setAnswers((a) => ({ ...a, [id]: v }));

  const answered = (id: string) => {
    const v = answers[id];
    return Array.isArray(v) ? v.length > 0 : Boolean(v);
  };

  return (
    <AnimatePresence>
      {open &&
      <motion.div
        role="dialog"
        aria-label={title}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 34 }}
        className="absolute inset-0 z-50 flex flex-col bg-canvas">
        
          {/*
           Said before every single matching module, never buried in settings.
           People answer honestly only if they know where the answers go.
          */}
          {!started ?
        <PrivacyGate
          title={title}
          intro={intro}
          count={questions.length}
          onClose={onClose}
          onStart={() => setStarted(true)} /> :


        <>
          <div className="flex items-center gap-3 px-4 pt-5">
            <button
              type="button"
              onClick={step === 0 ? onClose : () => setStep((s) => s - 1)}
              aria-label={step === 0 ? 'Close' : 'Back'}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink-line bg-surface text-ink">
              
              {step === 0 ?
              <XIcon className="h-4 w-4" strokeWidth={2.6} /> :

              <ArrowLeftIcon className="h-4 w-4" strokeWidth={2.6} />
              }
            </button>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-ink/10">
              <motion.div
                className="h-full rounded-full bg-ink"
                animate={{ width: `${(step + 1) / total * 100}%` }}
                transition={{ type: 'spring', stiffness: 220, damping: 30 }} />
              
            </div>
            <span className="shrink-0 text-[11px] font-bold text-ink-mute">
              {step + 1}/{total}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4 pt-7">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={reviewing ? 'review' : q.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -14 }}
                transition={{ duration: 0.2 }}>
                
                {reviewing ?
                <>
                    <p className="text-[12px] font-bold uppercase tracking-wide text-ink-mute">
                      {title}
                    </p>
                    <h2 className="mt-1 text-[24px] font-bold leading-tight tracking-tight text-ink">
                      {isPrivate ? 'That stays between us.' : 'Who sees this?'}
                    </h2>

                    {isPrivate ?
                  <div className="mt-4 flex items-start gap-2.5 rounded-card bg-[#D7F0E8] px-4 py-3.5">
                        <LockIcon
                      aria-hidden="true"
                      className="mt-0.5 h-4 w-4 shrink-0 text-ink"
                      strokeWidth={2.5} />
                    
                        <p className="text-[13px] font-semibold leading-snug text-ink">
                          Used only to find people worth knowing. Never shown on your profile.
                        </p>
                      </div> :

                  <div className="mt-5">
                        <AudiencePicker value={audience} onChange={setAudience} />
                      </div>
                  }

                    <ul className="mt-5 space-y-1.5">
                      {questions.filter((x) => answered(x.id)).map((x) =>
                    <li
                      key={x.id}
                      className="flex gap-3 rounded-card border border-ink-line bg-surface px-3.5 py-2.5">
                      
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-semibold text-ink-mute">
                              {x.ask}
                            </span>
                            <span className="block truncate text-[14px] font-bold text-ink">
                              {Array.isArray(answers[x.id]) ?
                          (answers[x.id] as string[]).join(' · ') :
                          answers[x.id] as string}
                            </span>
                          </span>
                        </li>
                    )}
                    </ul>
                  </> :

                <>
                    {q.emoji &&
                  <span aria-hidden="true" className="text-[34px]">
                        {q.emoji}
                      </span>
                  }
                    <h2 className="mt-2 text-[24px] font-bold leading-tight tracking-tight text-ink">
                      {q.ask}
                    </h2>

                    <div className="mt-6">
                      {q.type === 'text' &&
                    <input
                      autoFocus
                      value={answers[q.id] as string ?? ''}
                      onChange={(e) => set(q.id, e.target.value)}
                      placeholder={q.placeholder}
                      aria-label={q.ask}
                      className="w-full rounded-card border border-ink-line bg-surface px-4 py-3.5 text-[16px] font-semibold text-ink outline-none focus:border-purple" />

                    }

                      {q.type === 'single' &&
                    <div className="space-y-2">
                          {q.options.map((o) =>
                      <button
                        key={o}
                        type="button"
                        onClick={() => {
                          set(q.id, o);
                          window.setTimeout(next, 180);
                        }}
                        aria-pressed={answers[q.id] === o}
                        className={cn(
                          'w-full rounded-card border px-4 py-3.5 text-left text-[15px] font-bold transition-colors',
                          answers[q.id] === o ?
                          'border-ink bg-green text-ink' :
                          'border-ink-line bg-surface text-ink hover:border-purple/40'
                        )}>
                        
                              {o}
                            </button>
                      )}
                        </div>
                    }

                      {q.type === 'multi' &&
                    <div className="flex flex-wrap gap-2">
                          {q.options.map((o) => {
                        const picked = (answers[q.id] as string[] ?? []).includes(o);
                        return (
                          <button
                            key={o}
                            type="button"
                            onClick={() => {
                              const cur = answers[q.id] as string[] ?? [];
                              set(q.id, picked ? cur.filter((x) => x !== o) : [...cur, o]);
                            }}
                            aria-pressed={picked}
                            className={cn(
                              'rounded-full border px-4 py-2.5 text-[14px] font-bold transition-colors',
                              picked ?
                              'border-ink bg-green text-ink' :
                              'border-ink-line bg-surface text-ink-soft'
                            )}>
                            
                                {o}
                              </button>);

                      })}
                        </div>
                    }

                      {q.type === 'thisOrThat' &&
                    <div className="space-y-2.5">
                          <div className="grid grid-cols-2 gap-2.5">
                            {[q.a, q.b].map((o) =>
                        <button
                          key={o}
                          type="button"
                          onClick={() => {
                            set(q.id, o);
                            window.setTimeout(next, 180);
                          }}
                          aria-pressed={answers[q.id] === o}
                          className={cn(
                            'rounded-card border px-4 py-8 text-[17px] font-bold transition-colors',
                            answers[q.id] === o ?
                            'border-ink bg-green text-ink' :
                            'border-ink-line bg-surface text-ink'
                          )}>
                          
                                {o}
                              </button>
                        )}
                          </div>
                          {/* plenty of people genuinely are both */}
                          <button
                        type="button"
                        onClick={() => {
                          set(q.id, 'Both');
                          window.setTimeout(next, 180);
                        }}
                        aria-pressed={answers[q.id] === 'Both'}
                        className={cn(
                          'w-full rounded-card border px-4 py-3 text-[14px] font-bold transition-colors',
                          answers[q.id] === 'Both' ?
                          'border-ink bg-green text-ink' :
                          'border-dashed border-ink-line bg-surface text-ink-soft'
                        )}>
                        
                            Honestly, both
                          </button>
                        </div>
                    }
                    </div>
                  </>
                }
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="space-y-2 px-5 pb-8">
            <ButtonPrimary
              full
              onClick={reviewing ? () => onDone?.(answers, audience) : next}>
              
              {reviewing ? isPrivate ? 'Use this to match me' : 'Save to profile' : 'Continue'}
            </ButtonPrimary>
            {!reviewing &&
            <button
              type="button"
              onClick={next}
              className="w-full py-1.5 text-[13px] font-bold text-ink-mute">
              
                Skip for now
              </button>
            }
          </div>
          </>
        }
        </motion.div>
      }
    </AnimatePresence>);

}

/**
 * The promise, stated up front on every matching module. Answers here are used
 * to find people worth knowing and are never shown on your profile, so the
 * screen leads with that rather than with the first question.
 */
function PrivacyGate({
  title,
  intro,
  count,
  onClose,
  onStart






}: {title: string;intro?: string;count: number;onClose: () => void;onStart: () => void;}) {
  return (
    <>
      <div className="px-4 pt-5">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink-line bg-surface text-ink">
          
          <XIcon className="h-4 w-4" strokeWidth={2.6} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 pb-4">
        <span
          aria-hidden="true"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal text-onaccent">
          
          <LockIcon className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <p className="mt-5 text-[12px] font-bold uppercase tracking-wide text-ink-mute">{title}</p>
        <h2 className="mt-1 text-[26px] font-bold leading-tight tracking-tight text-ink">
          These answers are never shared.
        </h2>
        <p className="mt-3 text-[15px] font-semibold leading-snug text-ink-soft">
          They are only used to connect you with more relevant friends. Nobody sees them, they never
          appear on your profile, and you can delete them any time.
        </p>
        {intro &&
        <p className="mt-4 rounded-card border border-ink-line bg-surface px-4 py-3 text-[14px] font-semibold leading-snug text-ink">
            {intro}
          </p>
        }
      </div>

      <div className="space-y-2 px-5 pb-8">
        <ButtonPrimary full onClick={onStart}>
          {count === 1 ? 'One question' : `Start · ${count} questions`}
        </ButtonPrimary>
        <button
          type="button"
          onClick={onClose}
          className="w-full py-1.5 text-[13px] font-bold text-ink-mute">
          
          Not now
        </button>
      </div>
    </>);

}
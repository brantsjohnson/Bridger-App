import React from 'react';
import { Share2Icon } from 'lucide-react';
import {
  ACCENTS,
  Avatar,
  Breathe,
  ButtonPrimary,
  ButtonSecondary,
  Card,
  ListRow,
  PixelHeading,
  Screen,
  ScreenBody,
  ScreenHeader,
  StepProgress,
  cn } from
'../../../../packages/ui';
import { QUIZ, personById } from '../../state/mock-data';

const NAVY = '#001146';
const INK = '#1C1B16';
/** Same accent cycle as the live take so options read as different. */
const TILE_LOOKS = [
  { bg: ACCENTS.purple.hex, fg: '#FFFFFF' },
  { bg: ACCENTS.coral.hex, fg: INK },
  { bg: ACCENTS.teal.hex, fg: INK },
  { bg: ACCENTS.amber.hex, fg: INK },
  { bg: ACCENTS.pink.hex, fg: '#FFFFFF' },
  { bg: ACCENTS.blue.hex, fg: '#FFFFFF' },
  { bg: ACCENTS.green.hex, fg: INK }
];

/** Geometric brutalist take: navy question, colored answer blocks. */
export function QuizTakeScreen({
  onBack,
  onDone
}: {onBack?: () => void;onDone?: (resultId: string) => void;}) {
  const [index, setIndex] = React.useState(0);
  const [picks, setPicks] = React.useState<Record<string, string>>({});
  const question = QUIZ.questions[index];
  const last = index === QUIZ.questions.length - 1;
  const options = question.options;

  const pick = (option: string) => {
    setPicks((p) => ({ ...p, [question.id]: option }));
    if (!last) window.setTimeout(() => setIndex((i) => i + 1), 200);
    else onDone?.('coastal');
  };

  return (
    <Screen tone="plain" className="bg-white">
      <div className="flex h-full flex-col bg-white px-2 pb-2 pt-3">
        <div className="mb-2 flex items-center justify-end">
          <button
            type="button"
            onClick={onBack}
            aria-label="End quiz"
            className="flex h-11 w-11 items-center justify-center"
            style={{ color: NAVY }}
          >
            <span className="text-[28px] font-bold leading-none">×</span>
          </button>
        </div>
        <div
          className="mb-2 flex min-h-[140px] flex-[0.85] items-center justify-center px-5"
          style={{ backgroundColor: NAVY }}
        >
          <p className="text-center text-[28px] font-bold leading-tight text-white">
            {question.text}
          </p>
        </div>
        <div className="flex flex-1 flex-col gap-2">
          {options.length === 2 ?
          options.map((o, i) =>
          <button
            key={o}
            type="button"
            onClick={() => pick(o)}
            className="flex min-h-[88px] flex-1 items-center justify-center px-3 text-center text-[20px] font-bold"
            style={{
              backgroundColor: TILE_LOOKS[i % TILE_LOOKS.length].bg,
              color: TILE_LOOKS[i % TILE_LOOKS.length].fg
            }}>
            
                {o}
              </button>
          ) :

          <div className="grid flex-1 grid-cols-2 gap-2">
              {options.map((o, i) =>
            <button
              key={o}
              type="button"
              onClick={() => pick(o)}
              className="flex min-h-[88px] items-center justify-center px-3 text-center text-[18px] font-bold"
              style={{
                backgroundColor: TILE_LOOKS[i % TILE_LOOKS.length].bg,
                color: TILE_LOOKS[i % TILE_LOOKS.length].fg
              }}>
              
                    {o}
                  </button>
            )}
            </div>
          }
        </div>
      </div>
    </Screen>);

}

const COMMENTARY_YELLOW = '#FFC21A';

/** Yellow commentary beat: free-standing line, X top-right, Continue at the bottom. */
export function QuizCommentaryScreen({
  text = 'Oof. Not a great start…',
  onClose,
  onNext
}: {text?: string;onClose?: () => void;onNext?: () => void;}) {
  return (
    <Screen tone="plain" className="bg-white">
      <div
        className="flex h-full flex-col px-2 pb-3 pt-3"
        style={{ backgroundColor: COMMENTARY_YELLOW }}
      >
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="End quiz"
            className="flex h-11 w-11 items-center justify-center"
            style={{ color: NAVY }}
          >
            <span className="text-[28px] font-bold leading-none">×</span>
          </button>
        </div>
        <div className="flex flex-1 items-center justify-center px-7">
          <p
            className="text-center text-[28px] font-bold leading-tight"
            style={{ color: NAVY }}
          >
            {text}
          </p>
        </div>
        <ButtonPrimary full size="lg" onClick={onNext}>
          Continue
        </ButtonPrimary>
      </div>
    </Screen>
  );
}

/** Full breakdown for one result: who got it, and how you compare. */
export function QuizResultScreen({
  resultId = 'coastal',
  myResultId = 'coastal',
  onBack




}: {resultId?: string;myResultId?: string;onBack?: () => void;}) {
  const result = QUIZ.results.find((r) => r.id === resultId) ?? QUIZ.results[0];
  const mine = resultId === myResultId;
  const matches = result.friendIds.slice(0, 2).map((id) => personById(id).name.split(' ')[0]);

  return (
    <Screen>
      <ScreenHeader title="Who got who" onBack={onBack} />
      <ScreenBody>
        <Breathe>
          <div className={cn('rounded-card p-5 text-center', ACCENTS[result.accent].tintSolid)}>
            <p className="text-[12px] font-bold text-ink-soft">{QUIZ.title}</p>
            <p className="mt-1.5 font-pixel text-[24px] leading-tight text-ink">{result.label}</p>
            <p className="mt-1.5 text-[13px] font-semibold text-ink-soft">
              {result.friendIds.length} friends
              {mine ? ' · you' : ''}
            </p>
            <div className="mt-3 flex justify-center">
              <ButtonSecondary
                size="sm"
                icon={<Share2Icon className="h-4 w-4" strokeWidth={2.4} />}
                onClick={() => undefined}>
                
                Share quiz
              </ButtonSecondary>
            </div>
          </div>
        </Breathe>

        {mine &&
        <Breathe>
            <div className="mt-5">
              <Card>
                <p className="text-[14px] font-semibold text-ink">
                  You and {matches.join(' & ')} matched
                </p>
              </Card>
            </div>
          </Breathe>
        }

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-2">
              {result.label}
            </PixelHeading>
            <div className="space-y-2.5">
              {result.friendIds.map((id) => {
                const p = personById(id);
                return (
                  <ListRow
                    key={id}
                    leading={<Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="sm" />}
                    label={p.name}
                    sublabel={`${p.mutuals} mutual friends`} />);


              })}
            </div>
          </section>
        </Breathe>

        <Breathe>
          <section className="mt-6">
            <PixelHeading size="md" className="mb-2">
              Everyone else
            </PixelHeading>
            <div className="space-y-2.5">
              {QUIZ.results.
              filter((r) => r.id !== result.id).
              map((r) =>
              <Card key={r.id} className="flex items-center gap-3 py-3.5">
                    <span className="min-w-0 flex-1 text-[13px] font-bold text-ink">
                      {r.label} · {r.friendIds.length}
                    </span>
                    <span className="flex items-center">
                      {r.friendIds.map((id, i) => {
                    const p = personById(id);
                    return (
                      <span
                        key={id}
                        className={cn('rounded-full', i > 0 && '-ml-1')}>
                        
                            <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                          </span>);

                  })}
                    </span>
                  </Card>
              )}
            </div>
          </section>
        </Breathe>
      </ScreenBody>
    </Screen>);

}
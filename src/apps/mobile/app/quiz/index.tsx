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

/** Answer the questions, land on a result. */
export function QuizTakeScreen({
  onBack,
  onDone



}: {onBack?: () => void;onDone?: (resultId: string) => void;}) {
  const [index, setIndex] = React.useState(0);
  const [picks, setPicks] = React.useState<Record<string, string>>({});
  const question = QUIZ.questions[index];
  const last = index === QUIZ.questions.length - 1;

  const pick = (option: string) => {
    setPicks((p) => ({ ...p, [question.id]: option }));
    if (!last) window.setTimeout(() => setIndex((i) => i + 1), 200);
  };

  return (
    <Screen>
      <ScreenHeader title="Quiz" onBack={onBack} />
      <ScreenBody>
        <Breathe>
          <StepProgress step={index + 1} total={QUIZ.questions.length} />
        </Breathe>

        <Breathe>
          <Card className="mt-5">
            <p className="text-[17px] font-bold leading-snug tracking-tight text-ink">
              {question.text}
            </p>
            <div className="mt-4 space-y-2.5">
              {question.options.map((o) =>
              <ButtonSecondary
                key={o}
                full
                size="lg"
                tone={picks[question.id] === o ? 'solid' : 'outline'}
                onClick={() => pick(o)}>
                
                  {o}
                </ButtonSecondary>
              )}
            </div>
          </Card>
        </Breathe>
      </ScreenBody>

      {last && picks[question.id] &&
      <div className="px-5 pb-7 pt-3">
          <ButtonPrimary full onClick={() => onDone?.('coastal')}>
            See result
          </ButtonPrimary>
        </div>
      }
    </Screen>);

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
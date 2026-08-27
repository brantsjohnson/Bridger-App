import { Share2Icon } from 'lucide-react';
import { ACCENTS, Avatar, ButtonSecondary, cn } from '../../../packages/ui';
import { QUIZ, personById } from '../state/mock-data';

/** Take → result → share → compare. The dashboard only exists if comparable. */
export function QuizCard({
  resultId,
  onTake,
  onOpenResult




}: {resultId: string | null;onTake: () => void;onOpenResult: (id: string) => void;}) {
  const mine = QUIZ.results.find((r) => r.id === resultId);

  if (!mine) {
    return (
      <div className="rounded-card border border-ink-line bg-white p-5">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-mute">This week</p>
        <p className="mt-1 font-pixel text-[19px] leading-tight text-ink">{QUIZ.title}</p>
        <div className="mt-4">
          <ButtonSecondary full size="md" tone="solid" onClick={onTake}>
            Take the quiz
          </ButtonSecondary>
        </div>
      </div>);

  }

  return (
    <div className="space-y-3">
      <div
        className={cn(
          'rounded-[16px_40px_16px_40px] p-6 text-center',
          ACCENTS[mine.accent].tintSolid
        )}>
        
        <p className="text-[12px] font-bold text-ink-soft">{QUIZ.title}</p>
        <p className="mt-1.5 font-pixel text-[24px] leading-tight text-ink">{mine.label}</p>
        <div className="mt-3 flex justify-center">
          <ButtonSecondary
            size="sm"
            icon={<Share2Icon className="h-4 w-4" strokeWidth={2.4} />}
            onClick={() => undefined}>
            
            Share quiz
          </ButtonSecondary>
        </div>
      </div>

      {QUIZ.comparable &&
      <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[13px] font-bold text-ink">Who got who</p>
            <button
            type="button"
            onClick={() => onOpenResult(mine.id)}
            className="text-[12px] font-bold text-purple">
            
              See more
            </button>
          </div>

          <div className="space-y-2.5">
            {QUIZ.results.map((r) =>
          <button
            key={r.id}
            type="button"
            onClick={() => onOpenResult(r.id)}
            className="flex w-full items-center gap-3 rounded-card border border-ink-line bg-white px-4 py-3 text-left transition-colors hover:border-purple/40 hover:bg-[#F1ECFF]">
            
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold text-ink">
                    {r.label} · {r.friendIds.length}
                  </span>
                </span>
                <span className="flex items-center">
                  {r.friendIds.map((id, i) => {
                const p = personById(id);
                return (
                  <span key={id} className={cn('rounded-full', i > 0 && '-ml-1')}>
                        <Avatar name={p.name} emoji={p.emoji} accent={p.accent} size="xs" />
                      </span>);

              })}
                </span>
              </button>
          )}
          </div>
        </div>
      }
    </div>);

}
// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake Home quiz card so you can see the cover filling the frame, plus title
// and short description, the way people will see them.
// ============================================
import type { Cover } from '@bridger/shared';
import { CoverFill } from '../CoverPicker';

type Props = {
  title: string;
  description?: string;
  cover?: Cover;
  goLiveDate?: string;
  isLive?: boolean;
};

export function HomeQuizPreview({
  title,
  description,
  cover,
  goLiveDate,
  isLive = true
}: Props) {
  const displayCover: Cover =
    cover ?? { kind: 'emoji', value: '🧭', bg: '#4D96FF' };

  return (
    <div className="flex h-full flex-col bg-canvas px-3 pb-4 pt-8">
      <p className="font-pixel text-xl">Home</p>
      <p className="mt-1 text-xs text-muted">Quiz card</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {/* --- Cover fills the top, same as events --- */}
        <div className="h-28 w-full">
          <CoverFill cover={displayCover} />
        </div>

        <div className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            Quiz
          </p>
          <p className="mt-2 font-pixel text-xl leading-tight">
            {title.trim() || 'Pick a quiz'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {description?.trim() ||
              'A short weekly quiz that helps friends get to know you.'}
          </p>
          <button
            type="button"
            className="mt-4 w-full rounded-xl border border-ink bg-metal-face px-3 py-2.5 text-sm font-medium"
            style={{
              borderTopColor: '#fff',
              borderLeftColor: '#fff',
              borderBottomColor: '#A7A498',
              borderRightColor: '#A7A498'
            }}
            tabIndex={-1}
          >
            Take the quiz
          </button>
          {isLive ? (
            <p className="mt-2 text-center text-[11px] text-ok">Live now</p>
          ) : (
            <p className="mt-2 text-center text-[11px] text-muted">Not live yet</p>
          )}
          {goLiveDate ? (
            <p className="text-center text-[11px] text-muted">
              Go live {formatShort(goLiveDate)}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatShort(iso: string) {
  if (!iso) return '';
  try {
    return new Date(iso.includes('T') ? iso : `${iso}T12:00:00`).toLocaleDateString(
      undefined,
      { month: 'short', day: 'numeric' }
    );
  } catch {
    return iso;
  }
}

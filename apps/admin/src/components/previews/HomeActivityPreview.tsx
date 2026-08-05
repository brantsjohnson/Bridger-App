// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake Home "This week" card so you can see the cover, title, and little
// description the way people will see them. Cover fills the whole frame,
// just like event cards.
// ============================================
import type { Cover } from '@bridger/shared';
import { CoverFill } from '../CoverPicker';

type Props = {
  title: string;
  prompt: string;
  closesIn?: string;
  emoji?: string;
  cover?: Cover;
  active?: boolean;
  goLiveDate?: string;
  endsOn?: string;
};

export function HomeActivityPreview({
  title,
  prompt,
  closesIn = 'ends Sunday',
  emoji = '🎉',
  cover,
  active = true,
  goLiveDate,
  endsOn
}: Props) {
  // Prefer a real cover; otherwise fall back to the picked emoji on a wash.
  const displayCover: Cover | undefined =
    cover ??
    (emoji ? { kind: 'emoji', value: emoji, bg: '#FFDE99' } : undefined);

  return (
    <div className="flex h-full flex-col bg-canvas px-3 pb-4 pt-8">
      <p className="font-pixel text-xl">Home</p>
      <p className="mt-1 text-xs text-muted">What people see this week</p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-line bg-surface">
        {/* --- Cover fills the top of the card --- */}
        <div className="relative h-28 w-full">
          <CoverFill cover={displayCover} />
          <span
            className={[
              'absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium',
              active ? 'bg-ok/90 text-white' : 'bg-line text-muted'
            ].join(' ')}
          >
            {active ? 'On' : 'Off'}
          </span>
        </div>

        <div className="p-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
            This week · {closesIn || (endsOn ? `ends ${formatShort(endsOn)}` : 'ends Sunday')}
          </p>
          <p className="mt-1 font-pixel text-lg leading-tight">
            {title.trim() || 'Activity title'}
          </p>
          <p className="mt-1 text-sm text-muted">
            {prompt.trim() || 'Your little description shows up here'}
          </p>

          {/* --- Fake collage tiles --- */}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {[emoji || '👕', '🎸', '✨'].map((glyph, i) => (
              <div
                key={`${glyph}-${i}`}
                className="flex aspect-square items-center justify-center rounded-lg bg-canvas text-xl"
              >
                {glyph}
              </div>
            ))}
          </div>
          <p className="mt-2 text-center text-[11px] text-muted">
            Double-tap a tile to heart it
          </p>
        </div>
      </div>

      {goLiveDate ? (
        <p className="mt-3 text-center text-[11px] text-muted">
          Goes live {formatShort(goLiveDate)}
        </p>
      ) : null}
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

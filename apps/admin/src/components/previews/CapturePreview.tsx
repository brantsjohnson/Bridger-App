// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake "take a photo / post an update" screen showing the three themed prompt
// squares, so you can see how your prompt labels and icons look.
// ============================================
import type { ThemedPrompt } from '@bridger/shared';

type Props = {
  prompts: ThemedPrompt[];
};

export function CapturePreview({ prompts }: Props) {
  const list =
    prompts.length > 0
      ? prompts
      : [
          { slug: 'a', label: 'Prompt', icon: '?' },
          { slug: 'b', label: 'Prompt', icon: '?' },
          { slug: 'c', label: 'Prompt', icon: '?' }
        ];

  return (
    <div className="flex h-full flex-col bg-canvas px-4 pb-4 pt-8">
      <p className="font-pixel text-xl">New update</p>
      <p className="mt-1 text-xs text-muted">Pick a prompt or just shoot.</p>

      {/* --- Fake camera well --- */}
      <div className="mt-4 flex flex-1 items-center justify-center rounded-2xl border border-dashed border-line bg-surface">
        <div className="text-center">
          <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full border-2 border-ink bg-metal-face text-2xl">
            📷
          </div>
          <p className="text-sm font-medium">Camera</p>
          <p className="text-xs text-muted">Tap to capture</p>
        </div>
      </div>

      {/* --- Themed prompt squares --- */}
      <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-muted">
        Themed posts
      </p>
      <div className="grid grid-cols-3 gap-2">
        {list.slice(0, 3).map((p, i) => (
          <div
            key={`${p.slug}-${i}`}
            className="flex aspect-square flex-col items-center justify-center rounded-xl border border-dashed border-ink/40 bg-surface px-1 text-center"
          >
            <span className="text-2xl" aria-hidden>
              {p.icon || '✨'}
            </span>
            <span className="mt-1 line-clamp-2 text-[11px] font-medium leading-tight">
              {p.label || 'Untitled'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

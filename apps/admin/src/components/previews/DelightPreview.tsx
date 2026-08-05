// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake surprise moment (emoji rain) so you can picture a delight before you
// turn it on for people.
// ============================================

type Props = {
  name: string;
  scope: string;
  enabled?: boolean;
  goLiveDate?: string;
};

const SCOPE_LABEL: Record<string, string> = {
  global: 'Everyone',
  'opt-in': 'Only if they turn it on',
  gift: 'As a gift to a friend'
};

export function DelightPreview({
  name,
  scope,
  enabled = true,
  goLiveDate
}: Props) {
  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-canvas px-3 pb-4 pt-8">
      {/* --- Fake emoji rain --- */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        {['🎉', '✨', '💥', '🌈', '⭐'].map((e, i) => (
          <span
            key={e}
            className="absolute text-2xl opacity-80"
            style={{
              left: `${12 + i * 18}%`,
              top: `${10 + (i % 3) * 22}%`
            }}
          >
            {e}
          </span>
        ))}
      </div>

      <p className="relative font-pixel text-xl">Home</p>
      <p className="relative mt-1 text-xs text-muted">Surprise moment</p>

      <div className="relative mt-auto rounded-2xl border border-line bg-surface/95 p-4 backdrop-blur">
        <p className="font-pixel text-lg">{name.trim() || 'Delight name'}</p>
        <p className="mt-1 text-sm text-muted">
          {SCOPE_LABEL[scope] ?? scope}
        </p>
        <p className="mt-2 text-xs text-muted">
          {enabled ? 'On for people who qualify' : 'Off right now'}
        </p>
        {goLiveDate ? (
          <p className="mt-1 text-xs text-muted">
            Goes live {formatShort(goLiveDate)}
          </p>
        ) : null}
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

// ============================================
// WHAT THIS FILE DOES (plain English):
// Fake Home co-op announcement card so you can see the title, body, and
// button label before you publish to members.
// ============================================

type Props = {
  title: string;
  body: string;
  ctaLabel?: string;
};

export function CoopBannerPreview({ title, body, ctaLabel }: Props) {
  return (
    <div className="flex h-full flex-col bg-canvas px-3 pb-4 pt-8">
      <p className="font-pixel text-xl">Home</p>
      <p className="mt-1 text-xs text-muted">Co-op banner for members</p>

      <div className="mt-4 rounded-2xl border border-line bg-surface p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          Co-op
        </p>
        <p className="mt-2 font-pixel text-lg leading-tight">
          {title.trim() || 'Announcement title'}
        </p>
        <p className="mt-2 text-sm text-muted">
          {body.trim() || 'Your message shows up here for members.'}
        </p>
        <button
          type="button"
          tabIndex={-1}
          className="mt-4 w-full rounded-xl border border-ink bg-surface px-3 py-2.5 text-sm font-medium"
        >
          {ctaLabel?.trim() || 'Open'}
        </button>
      </div>
    </div>
  );
}

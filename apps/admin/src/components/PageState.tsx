// ============================================
// WHAT THIS FILE DOES (plain English):
// Shared loading / empty / error / saved banners so every admin page can
// show the same short status messages without reinventing them.
// ============================================

type Props = {
  loading?: boolean;
  error?: string | null;
  empty?: boolean;
  emptyMessage?: string;
  saved?: boolean;
  savedMessage?: string;
};

export function PageState({
  loading,
  error,
  empty,
  emptyMessage = 'Nothing here yet.',
  saved,
  savedMessage = 'Saved.'
}: Props) {
  return (
    <div className="mb-4 space-y-2" aria-live="polite">
      {loading ? (
        <p className="text-sm text-muted" role="status">
          Loading…
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-danger/40 bg-danger/5 px-3 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!loading && !error && empty ? (
        <p className="text-sm text-muted">{emptyMessage}</p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-ok/30 bg-ok/10 px-3 py-2 text-sm text-ok" role="status">
          {savedMessage}
        </p>
      ) : null}
    </div>
  );
}

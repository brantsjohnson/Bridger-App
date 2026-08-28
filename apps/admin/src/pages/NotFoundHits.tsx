// ============================================
// WHAT THIS FILE DOES (plain English):
// Lists every time someone hit the Magic Patterns 404 ("System says it's fine...") or
// a broken connection path, including the screens they visited right before.
// Helps find dead links and bad deep links.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { NotFoundHit } from '@bridger/shared';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

function reasonLabel(reason: NotFoundHit['reason']): string {
  switch (reason) {
    case 'connection_error':
      return 'Connection';
    case 'runtime_error':
      return 'Error';
    default:
      return 'Missing route';
  }
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function NotFoundHits() {
  const [items, setItems] = useState<NotFoundHit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<NotFoundHit[]>('/admin/not-found-hits');
      setItems(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load broken-path reports.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl text-ink">Broken paths</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            When someone sees the 404 dialog (or a connection path fails), we
            save the screens they walked through so you can find dead links.
            Paths only - no names or message text.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </header>

      <PageState loading={loading} error={error} empty={!loading && !error && items.length === 0} emptyMessage="No broken paths reported yet." />

      {!loading && !error
        ? items.map((hit) => (
            <Card key={hit.id} className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Badge>{reasonLabel(hit.reason)}</Badge>
                <span className="font-mono text-sm text-ink">{hit.missingPath}</span>
                <span className="ml-auto text-xs text-muted">
                  {formatWhen(hit.createdAt)}
                </span>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted">
                  Path they took
                </p>
                <p className="mt-1 break-all font-mono text-sm leading-relaxed text-ink">
                  {hit.pathTrail.length > 0
                    ? hit.pathTrail.join(' → ')
                    : '(no prior screens recorded)'}
                </p>
              </div>
              <p className="text-xs text-muted">
                {[hit.platform, hit.appVersion].filter(Boolean).join(' · ') ||
                  'unknown device'}
              </p>
            </Card>
          ))
        : null}
    </div>
  );
}

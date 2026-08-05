// ============================================
// WHAT THIS FILE DOES (plain English):
// Edit the default Home layout (order and size of sections). Phone demo on
// the right updates as you move things around.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { HomeDefaults, HomeWidgetDefault, HomeWidgetKey } from '@bridger/shared';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { HomeLayoutPreview } from '../components/previews/HomeLayoutPreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

const LABELS: Record<HomeWidgetKey, string> = {
  event: 'This week (events)',
  alerts: 'Notifications',
  ask: 'Ask the group',
  comingup: 'Coming up',
  activity: 'Weekly activity',
  quiz: 'Quiz',
  coop: 'Co-op'
};

export function HomeDefaultsPage() {
  const [layout, setLayout] = useState<HomeWidgetDefault[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<HomeDefaults>('/admin/config/home-defaults');
      setLayout(data.layout ?? []);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load home defaults.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const move = (index: number, dir: -1 | 1) => {
    setLayout((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  };

  const toggleSize = (index: number) => {
    setLayout((prev) =>
      prev.map((row, i) =>
        i === index
          ? { ...row, size: row.size === 'half' ? 'full' : 'half' }
          : row
      )
    );
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const body: HomeDefaults = { layout };
      await api('/admin/config/home-defaults', { method: 'PUT', body });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not save home defaults.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DemoSplit
      title="Home starting layout"
      description="This is the Home screen order for people who have not rearranged it themselves. Move sections up or down and watch the phone."
      preview={<HomeLayoutPreview layout={layout} />}
      previewCaption="Home · default layout"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && layout.length === 0}
        emptyMessage="No layout rows."
        saved={saved}
        savedMessage="Home layout saved."
      />

      {!loading && layout.length > 0 ? (
        <form onSubmit={(e) => void onSave(e)}>
          <Card title="Sections (top to bottom)">
            <ol className="space-y-3">
              {layout.map((row, index) => (
                <li
                  key={`${row.key}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas/40 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-ink">
                      {LABELS[row.key] ?? row.key}
                    </p>
                    <p className="text-xs text-muted">
                      Size: {row.size === 'full' ? 'full width' : 'half width'}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Move ${LABELS[row.key]} up`}
                      disabled={index === 0}
                      onClick={() => move(index, -1)}
                    >
                      Up
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Move ${LABELS[row.key]} down`}
                      disabled={index === layout.length - 1}
                      onClick={() => move(index, 1)}
                    >
                      Down
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      aria-label={`Toggle size for ${LABELS[row.key]}`}
                      onClick={() => toggleSize(index)}
                    >
                      {row.size === 'full' ? 'Make half' : 'Make full'}
                    </Button>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save layout'}
              </Button>
            </div>
          </Card>
        </form>
      ) : null}
    </DemoSplit>
  );
}

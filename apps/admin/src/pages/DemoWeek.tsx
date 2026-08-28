// ============================================
// WHAT THIS FILE DOES (plain English):
// Admin page for the TestFlight demo week: turn the closed-beta window on or
// off and set start/end dates. While active, new users must invite a friend to
// use Bridger; people who joined via invite cannot send invite links.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { DemoWeekConfig } from '@bridger/shared';
import { PageState } from '../components/PageState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | null {
  if (!value.trim()) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function DemoWeekPage() {
  const [draft, setDraft] = useState<DemoWeekConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<DemoWeekConfig>('/admin/config/demo-week');
      setDraft(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not load demo week settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const next = await api<DemoWeekConfig>('/admin/config/demo-week', {
        method: 'PUT',
        body: JSON.stringify(draft)
      });
      setDraft(next);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return <PageState loading={loading} error={error} />;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-8">
      <div>
        <h1 className="font-pixel text-3xl text-ink">Demo week</h1>
        <p className="mt-2 text-sm text-muted">
          Closed-beta window for TestFlight. While active, people must invite a friend to
          use the app. Friends who join via invite cannot send invite links until demo week
          ends.
        </p>
      </div>

      {error ? (
        <p className="rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p className="rounded-xl border border-success/30 bg-success/5 px-4 py-3 text-sm text-success">
          Saved.
        </p>
      ) : null}

      <Card className="space-y-5 p-6">
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
            className="h-5 w-5"
          />
          <span className="font-medium text-ink">Demo week active</span>
        </label>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink" htmlFor="demo-starts">
            Starts (optional)
          </label>
          <input
            id="demo-starts"
            type="datetime-local"
            value={toLocalInput(draft.startsAt)}
            onChange={(e) =>
              setDraft({ ...draft, startsAt: fromLocalInput(e.target.value) })
            }
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-ink" htmlFor="demo-ends">
            Ends (optional)
          </label>
          <input
            id="demo-ends"
            type="datetime-local"
            value={toLocalInput(draft.endsAt)}
            onChange={(e) =>
              setDraft({ ...draft, endsAt: fromLocalInput(e.target.value) })
            }
            className="w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm"
          />
        </div>

        <Button onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save demo week'}
        </Button>
      </Card>
    </div>
  );
}

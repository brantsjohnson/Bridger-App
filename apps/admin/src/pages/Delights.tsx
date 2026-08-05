// ============================================
// WHAT THIS FILE DOES (plain English):
// Turn little surprise moments on or off (emoji bomb, etc.). Phone demo on
// the right. Go-live date = when the surprise can start showing.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { DelightEntry, DelightScope } from '@bridger/shared';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { DelightPreview } from '../components/previews/DelightPreview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { api, ApiError } from '../lib/api';

const SCOPE_OPTIONS: { value: DelightScope; label: string }[] = [
  { value: 'global', label: 'Everyone' },
  { value: 'opt-in', label: 'Only if they turn it on' },
  { value: 'gift', label: 'As a gift to a friend' }
];

export function Delights() {
  const [items, setItems] = useState<DelightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [shortName, setShortName] = useState('');
  const [name, setName] = useState('');
  const [scope, setScope] = useState<DelightScope>('global');
  const [creating, setCreating] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<DelightEntry[]>('/admin/delights');
      setItems(data);
      setPreviewId((prev) => prev ?? data[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load delights.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSaved(false);
    setError(null);
    try {
      const created = await api<DelightEntry>('/admin/delights', {
        method: 'POST',
        body: { slug: shortName.trim(), name: name.trim(), scope }
      });
      setShortName('');
      setName('');
      setScope('global');
      setSaved(true);
      await load();
      setPreviewId(created.id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create delight.'
      );
    } finally {
      setCreating(false);
    }
  };

  const patch = async (
    id: string,
    body: {
      enabled?: boolean;
      scope?: DelightScope;
      schedule?: { from?: string; to?: string };
      name?: string;
    }
  ) => {
    setSaved(false);
    setError(null);
    try {
      await api(`/admin/delights/${id}`, { method: 'PATCH', body });
      setSaved(true);
      await load();
      setPreviewId(id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not update delight.'
      );
    }
  };

  const preview =
    items.find((d) => d.id === previewId) ??
    items[0] ??
    ({
      id: 'draft',
      slug: shortName || 'new',
      name: name || 'New delight',
      enabled: false,
      scope,
      schedule: {}
    } as DelightEntry);

  return (
    <DemoSplit
      title="Surprises (delights)"
      description="Optional fun extras. Set who gets them and a go-live date. The phone shows a rough idea of the surprise."
      preview={
        <DelightPreview
          name={preview.name}
          scope={preview.scope}
          enabled={preview.enabled}
          goLiveDate={preview.schedule?.from}
        />
      }
      previewCaption="Surprise moment"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && items.length === 0}
        emptyMessage="No surprises yet."
        saved={saved}
        savedMessage="Saved."
      />

      <Card title="New surprise" className="mb-6">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
          <Field
            id="delight-name"
            label="Name people would recognize"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Field
            id="delight-slug"
            label="Short name (slug)"
            hint="Matches the plugin folder, e.g. emoji-bomb"
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <Field
            id="delight-scope"
            as="select"
            label="Who gets it"
            value={scope}
            onChange={(e) => setScope(e.target.value as DelightScope)}
          >
            {SCOPE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Field>
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </Card>

      {!loading && items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((d) => (
            <li key={d.id}>
              <Card>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setPreviewId(d.id)}
                  >
                    <h2 className="font-pixel text-lg hover:underline">
                      {d.name}
                    </h2>
                    <p className="text-xs text-muted">
                      Short name (slug): {d.slug}
                    </p>
                  </button>
                  <Badge tone={d.enabled ? 'live' : 'draft'}>
                    {d.enabled ? 'on' : 'off'}
                  </Badge>
                </div>

                <div className="space-y-3">
                  <Toggle
                    id={`enabled-${d.id}`}
                    label="Turn on"
                    checked={d.enabled}
                    onChange={(e) =>
                      void patch(d.id, { enabled: e.target.checked })
                    }
                  />
                  <Field
                    id={`scope-${d.id}`}
                    as="select"
                    label="Who gets it"
                    value={d.scope}
                    onChange={(e) =>
                      void patch(d.id, {
                        scope: e.target.value as DelightScope
                      })
                    }
                  >
                    {SCOPE_OPTIONS.map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                  </Field>
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      id={`from-${d.id}`}
                      label="Go live date"
                      type="date"
                      value={d.schedule?.from?.slice(0, 10) ?? ''}
                      onChange={(e) =>
                        void patch(d.id, {
                          schedule: {
                            ...d.schedule,
                            from: e.target.value || undefined
                          }
                        })
                      }
                    />
                    <Field
                      id={`to-${d.id}`}
                      label="Ends on"
                      type="date"
                      value={d.schedule?.to?.slice(0, 10) ?? ''}
                      onChange={(e) =>
                        void patch(d.id, {
                          schedule: {
                            ...d.schedule,
                            to: e.target.value || undefined
                          }
                        })
                      }
                    />
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </DemoSplit>
  );
}

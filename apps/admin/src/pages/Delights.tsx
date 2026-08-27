// ============================================
// WHAT THIS FILE DOES (plain English):
// Open Surprises backlog: park ideas, promote to built/live, and turn live
// standalone delighters on for users. Effects are catalog-only (screens import
// them). Scaffold happens via a repo script, not the server.
// ============================================
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import type {
  DelightEntry,
  DelightKind,
  DelightScope,
  DelightStatus
} from '@bridger/shared';
import { ADMIN } from '@bridger/shared';
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

const STATUS_OPTIONS: { value: DelightStatus; label: string }[] = [
  { value: 'idea', label: 'Idea (parked)' },
  { value: 'built', label: 'Built (code exists)' },
  { value: 'live', label: 'Live (can turn on)' }
];

const KIND_OPTIONS: { value: DelightKind; label: string }[] = [
  { value: 'standalone', label: 'Standalone (host mounts)' },
  { value: 'effect', label: 'Effect (screens import)' }
];

function scaffoldCommand(d: Pick<DelightEntry, 'slug' | 'kind' | 'scope' | 'name'>) {
  return `pnpm delight:scaffold -- ${d.slug} --kind ${d.kind} --scope ${d.scope} --name "${d.name}"`;
}

function statusTone(status: DelightStatus): 'live' | 'draft' | 'archived' {
  if (status === 'live') return 'live';
  if (status === 'built') return 'draft';
  return 'archived';
}

export function Delights() {
  const [items, setItems] = useState<DelightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [filter, setFilter] = useState<'all' | DelightStatus>('all');
  const [shortName, setShortName] = useState('');
  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [scope, setScope] = useState<DelightScope>('gift');
  const [kind, setKind] = useState<DelightKind>('standalone');
  const [status, setStatus] = useState<DelightStatus>('idea');
  const [creating, setCreating] = useState(false);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [lastScaffold, setLastScaffold] = useState<string | null>(null);

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

  const visible = useMemo(() => {
    if (filter === 'all') return items;
    return items.filter((d) => d.status === filter);
  }, [items, filter]);

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSaved(false);
    setError(null);
    try {
      const created = await api<DelightEntry>('/admin/delights', {
        method: 'POST',
        body: {
          slug: shortName.trim(),
          name: name.trim(),
          scope,
          kind,
          status,
          notes: notes.trim()
        }
      });
      setLastScaffold(scaffoldCommand(created));
      setShortName('');
      setName('');
      setNotes('');
      setScope('gift');
      setKind('standalone');
      setStatus('idea');
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
      status?: DelightStatus;
      kind?: DelightKind;
      notes?: string;
    }
  ) => {
    setSaved(false);
    setError(null);
    try {
      const updated = await api<DelightEntry>(`/admin/delights/${id}`, {
        method: 'PATCH',
        body
      });
      if (body.status === 'built' || body.status === 'live') {
        setLastScaffold(scaffoldCommand(updated));
      }
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
      status,
      kind,
      notes,
      enabled: false,
      scope,
      schedule: {}
    } as DelightEntry);

  return (
    <DemoSplit
      title="Surprises (delights)"
      description="Open backlog for optional fun. Park ideas with notes, promote when code exists, turn live standalones on for users. Incomplete on purpose."
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
        emptyMessage="No surprises yet. Add an idea below."
        saved={saved}
        savedMessage="Saved."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {(['all', 'idea', 'built', 'live'] as const).map((f) => (
          <Button
            key={f}
            type="button"
            variant={filter === f ? 'primary' : 'secondary'}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f}
          </Button>
        ))}
      </div>

      <Card title="New surprise (idea or more)" className="mb-6">
        <form
          onSubmit={(e) => void onCreate(e)}
          className="space-y-4"
          data-analytics-id={ADMIN.actions.new_delight}
        >
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
            hint="Matches the folder, e.g. emoji-bomb"
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <Field
            id="delight-kind"
            as="select"
            label="Kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as DelightKind)}
          >
            {KIND_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Field>
          <Field
            id="delight-scope"
            as="select"
            label="Who gets it (standalone)"
            value={scope}
            onChange={(e) => setScope(e.target.value as DelightScope)}
          >
            {SCOPE_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Field>
          <Field
            id="delight-status"
            as="select"
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as DelightStatus)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </Field>
          <Field
            id="delight-notes"
            as="textarea"
            label="Notes"
            hint="Where it might live, vibe, 'quiz button burst'…"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Creating…' : 'Add to backlog'}
          </Button>
        </form>
      </Card>

      {lastScaffold ? (
        <Card title="Scaffold command" className="mb-6">
          <p className="mb-2 text-sm text-muted">
            Admin cannot write into the mobile package. Run this in the repo,
            then ship a mobile build.
          </p>
          <code className="block whitespace-pre-wrap rounded-md bg-canvas p-3 text-xs">
            {lastScaffold}
          </code>
        </Card>
      ) : null}

      {!loading && visible.length > 0 ? (
        <ul className="space-y-4">
          {visible.map((d) => {
            const canEnable = d.status === 'live' && d.kind === 'standalone';
            return (
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
                        {d.slug} · {d.kind} · {d.scope}
                      </p>
                    </button>
                    <div className="flex gap-2">
                      <Badge tone={statusTone(d.status)}>{d.status}</Badge>
                      <Badge tone={d.enabled ? 'live' : 'draft'}>
                        {d.enabled ? 'on' : 'off'}
                      </Badge>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <Field
                      id={`notes-${d.id}`}
                      as="textarea"
                      label="Notes"
                      defaultValue={d.notes ?? ''}
                      key={`${d.id}-${d.notes}`}
                      onBlur={(e) => {
                        if (e.target.value !== (d.notes ?? '')) {
                          void patch(d.id, { notes: e.target.value });
                        }
                      }}
                    />
                    <Field
                      id={`status-${d.id}`}
                      as="select"
                      label="Status"
                      value={d.status}
                      onChange={(e) =>
                        void patch(d.id, {
                          status: e.target.value as DelightStatus
                        })
                      }
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Field>
                    <Field
                      id={`kind-${d.id}`}
                      as="select"
                      label="Kind"
                      value={d.kind}
                      onChange={(e) =>
                        void patch(d.id, {
                          kind: e.target.value as DelightKind
                        })
                      }
                    >
                      {KIND_OPTIONS.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </Field>

                    {d.kind === 'effect' ? (
                      <p className="text-sm text-muted">
                        Effects are imported by screens. Host toggle does not
                        apply. Put code under{' '}
                        <code>apps/mobile/delight/effects/{d.slug}</code>.
                      </p>
                    ) : (
                      <>
                        <Toggle
                          id={`enabled-${d.id}`}
                          label={
                            canEnable
                              ? 'Turn on for users'
                              : 'Turn on (only when status is live)'
                          }
                          checked={d.enabled}
                          disabled={!canEnable}
                          onChange={(e) =>
                            void patch(d.id, { enabled: e.target.checked })
                          }
                          data-analytics-id={ADMIN.actions.toggle_delight}
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
                        <p className="text-xs text-muted">
                          Scaffold:{' '}
                          <code className="text-[11px]">
                            {scaffoldCommand(d)}
                          </code>
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : null}
    </DemoSplit>
  );
}

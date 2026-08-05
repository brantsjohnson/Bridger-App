// ============================================
// WHAT THIS FILE DOES (plain English):
// Edit the three themed "post an update" squares (label + icon). Right side
// shows the take-a-picture screen so you can see what people get.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { ThemedPrompt } from '@bridger/shared';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { CapturePreview } from '../components/previews/CapturePreview';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

export function ThemedPrompts() {
  const [prompts, setPrompts] = useState<ThemedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<ThemedPrompt[]>('/admin/config/themed-prompts');
      setPrompts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load prompts.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const update = (index: number, patch: Partial<ThemedPrompt>) => {
    setPrompts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, ...patch } : p))
    );
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await api('/admin/config/themed-prompts', {
        method: 'PUT',
        body: { prompts }
      });
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not save prompts.'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <DemoSplit
      title="Photo prompts"
      description="These are the three little squares on the take-a-picture screen (OOTD, Take 0.5, Hot take). Edit them and watch the phone demo update."
      preview={<CapturePreview prompts={prompts} />}
      previewCaption="Take a photo / new update"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && prompts.length === 0}
        emptyMessage="No prompts yet."
        saved={saved}
        savedMessage="Prompts saved."
      />

      {!loading && prompts.length > 0 ? (
        <form onSubmit={(e) => void onSave(e)}>
          <Card title="The three squares">
            <div className="space-y-6">
              {prompts.map((p, i) => (
                <div
                  key={`${p.slug}-${i}`}
                  className="grid gap-3 rounded-xl border border-line bg-canvas/40 p-4 md:grid-cols-3"
                >
                  <Field
                    id={`prompt-${i}-label`}
                    label="What people see"
                    value={p.label}
                    onChange={(e) => update(i, { label: e.target.value })}
                  />
                  <Field
                    id={`prompt-${i}-icon`}
                    label="Emoji"
                    value={p.icon}
                    onChange={(e) => update(i, { icon: e.target.value })}
                  />
                  <Field
                    id={`prompt-${i}-slug`}
                    label="Short name (slug)"
                    hint="Internal id. Letters and dashes only."
                    value={p.slug}
                    onChange={(e) => update(i, { slug: e.target.value })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setPrompts([
                    ...prompts,
                    { slug: '', label: '', icon: '' }
                  ])
                }
              >
                Add prompt
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save prompts'}
              </Button>
            </div>
          </Card>
        </form>
      ) : null}

      {!loading && prompts.length === 0 && !error ? (
        <Button
          variant="primary"
          onClick={() =>
            setPrompts([
              { slug: 'ootd', label: 'OOTD', icon: '👕' },
              { slug: 'take-05', label: 'Take 0.5', icon: '🤳' },
              { slug: 'hot-take', label: 'Hot take', icon: '🌶️' }
            ])
          }
        >
          Start with the usual three
        </Button>
      ) : null}
    </DemoSplit>
  );
}

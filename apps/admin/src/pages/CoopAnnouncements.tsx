// ============================================
// WHAT THIS FILE DOES (plain English):
// Write co-op notes for members. Left: draft and publish. Right: phone demo
// of the Home co-op banner. Optional go-live date = when you want to publish.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { CoopBannerPreview } from '../components/previews/CoopBannerPreview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

type Announcement = {
  id: string;
  title: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  publishedAt?: string;
};

export function CoopAnnouncements() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [buttonLabel, setButtonLabel] = useState('');
  const [buttonLink, setButtonLink] = useState('');
  const [goLiveDate, setGoLiveDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Announcement[]>('/admin/coop/announcements');
      setItems(data);
      setPreviewId((prev) => prev ?? data[0]?.id ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load announcements.'
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
      const created = await api<Announcement>('/admin/coop/announcements', {
        method: 'POST',
        body: {
          title: title.trim(),
          body: body.trim(),
          ctaLabel: buttonLabel.trim() || undefined,
          ctaUrl: buttonLink.trim() || undefined
        }
      });
      // If go-live is today or in the past, publish right away.
      if (goLiveDate) {
        const today = new Date().toISOString().slice(0, 10);
        if (goLiveDate <= today) {
          await api(`/admin/coop/announcements/${created.id}/publish`, {
            method: 'POST'
          });
        }
      }
      setTitle('');
      setBody('');
      setButtonLabel('');
      setButtonLink('');
      setGoLiveDate('');
      setSaved(true);
      await load();
      setPreviewId(created.id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create draft.'
      );
    } finally {
      setCreating(false);
    }
  };

  const publish = async (id: string) => {
    setPublishingId(id);
    setSaved(false);
    setError(null);
    try {
      await api(`/admin/coop/announcements/${id}/publish`, { method: 'POST' });
      setSaved(true);
      await load();
      setPreviewId(id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not publish.'
      );
    } finally {
      setPublishingId(null);
    }
  };

  const preview =
    items.find((a) => a.id === previewId) ??
    ({
      id: 'draft',
      title,
      body,
      ctaLabel: buttonLabel
    } as Announcement);

  return (
    <DemoSplit
      title="Co-op announcements"
      description="Notes that show on Home for co-op members. Draft first, then publish. The phone shows the banner."
      preview={
        <CoopBannerPreview
          title={preview.title}
          body={preview.body}
          ctaLabel={preview.ctaLabel}
        />
      }
      previewCaption="Home · Co-op banner"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && items.length === 0}
        emptyMessage="No announcements yet."
        saved={saved}
        savedMessage="Announcement saved."
      />

      <Card title="New draft" className="mb-6">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
          <Field
            id="ann-title"
            label="Title"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field
            id="ann-body"
            as="textarea"
            label="Message"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <Field
            id="ann-cta-label"
            label="Button text (optional)"
            hint="What the button says, e.g. Open the portal"
            value={buttonLabel}
            onChange={(e) => setButtonLabel(e.target.value)}
          />
          <Field
            id="ann-cta-url"
            label="Button link (optional)"
            type="url"
            value={buttonLink}
            onChange={(e) => setButtonLink(e.target.value)}
          />
          <Field
            id="ann-go-live"
            label="Go live date"
            type="date"
            hint="If today or earlier, we publish as soon as you save. Otherwise keep it as a draft and publish when ready."
            value={goLiveDate}
            onChange={(e) => setGoLiveDate(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Saving…' : 'Save draft'}
          </Button>
        </form>
      </Card>

      {!loading && items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setPreviewId(a.id)}
                  >
                    <h2 className="font-pixel text-lg hover:underline">
                      {a.title}
                    </h2>
                  </button>
                  <Badge tone={a.publishedAt ? 'ok' : 'draft'}>
                    {a.publishedAt ? 'live' : 'draft'}
                  </Badge>
                </div>
                <p className="mb-3 whitespace-pre-wrap text-sm text-ink">
                  {a.body}
                </p>
                {a.ctaLabel || a.ctaUrl ? (
                  <p className="mb-3 text-xs text-muted">
                    Button: {a.ctaLabel || 'link'}
                    {a.ctaUrl ? ` → ${a.ctaUrl}` : ''}
                  </p>
                ) : null}
                {!a.publishedAt ? (
                  <Button
                    variant="primary"
                    disabled={publishingId === a.id}
                    onClick={() => void publish(a.id)}
                  >
                    {publishingId === a.id
                      ? 'Publishing…'
                      : 'Publish to members'}
                  </Button>
                ) : (
                  <p className="text-xs text-muted">
                    Went live {new Date(a.publishedAt).toLocaleString()}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </DemoSplit>
  );
}

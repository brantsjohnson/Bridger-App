// ============================================
// WHAT THIS FILE DOES (plain English):
// Manage the Home Side Quest (weekly challenge). Set title, little
// description, "ends Sunday" label, emoji, photo-or-text mode, and a cover
// that fills the card like events. Right side: phone demo.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import type { Cover } from '@bridger/shared';
import { CoverPicker } from '../components/CoverPicker';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { HomeActivityPreview } from '../components/previews/HomeActivityPreview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { api, ApiError } from '../lib/api';

type Activity = {
  id: string;
  title: string;
  prompt: string;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  closesIn?: string;
  emoji?: string;
  cover?: Cover;
  postMode?: 'photo' | 'text';
};

const EMOJI_CHOICES = [
  '✏️',
  '👕',
  '🎸',
  '🎉',
  '🌅',
  '☕',
  '🎲',
  '🪴',
  '✨',
  '🍕',
  '🚲'
];

export function WeeklyActivity() {
  const [items, setItems] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [title, setTitle] = useState('');
  const [prompt, setPrompt] = useState('');
  const [closesIn, setClosesIn] = useState('ends Sunday');
  const [emoji, setEmoji] = useState('✏️');
  const [postMode, setPostMode] = useState<'photo' | 'text'>('text');
  const [cover, setCover] = useState<Cover | undefined>({
    kind: 'emoji',
    value: '✏️',
    bg: '#FFB515'
  });
  const [goLiveDate, setGoLiveDate] = useState('');
  const [endsOn, setEndsOn] = useState('');
  const [creating, setCreating] = useState(false);
  /** Which activity the phone demo is showing. */
  const [previewId, setPreviewId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Activity[]>('/admin/activities');
      setItems(data);
      if (data.length) {
        const active = data.find((a) => a.active) ?? data[0];
        setPreviewId((prev) => prev ?? active.id);
      }
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load activities.'
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
      const created = await api<Activity>('/admin/activities', {
        method: 'POST',
        body: {
          title: title.trim(),
          prompt: prompt.trim(),
          closesIn: closesIn.trim() || 'ends Sunday',
          emoji,
          cover,
          postMode
        }
      });
      // Apply go-live dates right after create if the user set them.
      if (goLiveDate || endsOn) {
        await api(`/admin/activities/${created.id}`, {
          method: 'PATCH',
          body: {
            startsAt: goLiveDate || null,
            endsAt: endsOn || null
          }
        });
      }
      setTitle('');
      setPrompt('');
      setClosesIn('ends Sunday');
      setEmoji('✏️');
      setPostMode('text');
      setCover({ kind: 'emoji', value: '✏️', bg: '#FFB515' });
      setGoLiveDate('');
      setEndsOn('');
      setSaved(true);
      await load();
      setPreviewId(created.id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create activity.'
      );
    } finally {
      setCreating(false);
    }
  };

  const patch = async (
    id: string,
    body: {
      title?: string;
      prompt?: string;
      active?: boolean;
      startsAt?: string | null;
      endsAt?: string | null;
      closesIn?: string | null;
      emoji?: string | null;
      cover?: Cover | null;
      postMode?: 'photo' | 'text';
    }
  ) => {
    setSaved(false);
    setError(null);
    try {
      await api(`/admin/activities/${id}`, { method: 'PATCH', body });
      setSaved(true);
      await load();
      setPreviewId(id);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not update activity.'
      );
    }
  };

  const previewItem = items.find((a) => a.id === previewId) ?? items[0];
  const demoTitle = previewItem?.title || title;
  const demoPrompt = previewItem?.prompt || prompt;
  const demoClosesIn = previewItem?.closesIn || closesIn;
  const demoEmoji = previewItem?.emoji || emoji;
  const demoCover = previewItem?.cover ?? cover;
  const demoGoLive =
    previewItem?.startsAt?.slice(0, 10) || goLiveDate || undefined;
  const demoEnds = previewItem?.endsAt?.slice(0, 10) || endsOn || undefined;

  return (
    <DemoSplit
      title="Side Quest"
      description="The Home Side Quest (like Notes App Discovery). Cover fills the card like events. Set title, a little description, emoji, photo or text mode, and when it ends."
      preview={
        <HomeActivityPreview
          title={demoTitle}
          prompt={demoPrompt}
          closesIn={demoClosesIn}
          emoji={demoEmoji}
          cover={demoCover}
          active={previewItem?.active ?? false}
          goLiveDate={demoGoLive}
          endsOn={demoEnds}
        />
      }
      previewCaption="Home · Side Quest widget"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && items.length === 0}
        emptyMessage="No Side Quests yet. Make one below."
        saved={saved}
        savedMessage="Side Quest saved."
      />

      <Card title="New Side Quest" className="mb-6">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
          <Field
            id="activity-title"
            label="Title"
            hint="Big words on the widget, e.g. Notes App Discovery"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field
            id="activity-prompt"
            as="textarea"
            label="Little description"
            hint="Shown under the title, e.g. Share a blurb from your notes app archives."
            required
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
          />
          <Field
            id="activity-closes"
            label="This week line"
            hint='Shows as "This week · ends Sunday"'
            value={closesIn}
            onChange={(e) => setClosesIn(e.target.value)}
            placeholder="ends Sunday"
          />

          {/* THIS SECTION DOES: photo polaroid wall vs text-note wall */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Post style</p>
            <p className="mb-2 text-xs text-muted">
              Text = notes-style blurb input. Photo = camera polaroid.
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  { id: 'text', label: 'Text blurb' },
                  { id: 'photo', label: 'Photo polaroid' }
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={postMode === opt.id}
                  className={[
                    'rounded-xl border px-3 py-2 text-sm font-medium',
                    postMode === opt.id
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line bg-surface'
                  ].join(' ')}
                  onClick={() => setPostMode(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* --- Emoji picker --- */}
          <div>
            <p className="mb-2 text-sm font-medium text-ink">Emoji</p>
            <p className="mb-2 text-xs text-muted">
              Accent on the card when you are not using a photo cover.
            </p>
            <div className="flex flex-wrap gap-2">
              {EMOJI_CHOICES.map((glyph) => (
                <button
                  key={glyph}
                  type="button"
                  aria-label={`Emoji ${glyph}`}
                  aria-pressed={emoji === glyph}
                  className={[
                    'flex h-11 w-11 items-center justify-center rounded-xl border text-xl',
                    emoji === glyph
                      ? 'border-ink bg-ink text-canvas'
                      : 'border-line bg-surface'
                  ].join(' ')}
                  onClick={() => {
                    setEmoji(glyph);
                    if (!cover || cover.kind === 'emoji') {
                      setCover({
                        kind: 'emoji',
                        value: glyph,
                        bg:
                          cover?.kind === 'emoji'
                            ? cover.bg ?? '#FFB515'
                            : '#FFB515'
                      });
                    }
                  }}
                >
                  {glyph}
                </button>
              ))}
            </div>
            <div className="mt-3">
              <Field
                id="activity-emoji-custom"
                label="Or type your own"
                value={emoji}
                onChange={(e) => {
                  const next = e.target.value.slice(-4) || '🎉';
                  setEmoji(next);
                  if (!cover || cover.kind === 'emoji') {
                    setCover({
                      kind: 'emoji',
                      value: next,
                      bg:
                        cover?.kind === 'emoji'
                          ? cover.bg ?? '#FFB515'
                          : '#FFB515'
                    });
                  }
                }}
              />
            </div>
          </div>

          <CoverPicker
            cover={cover}
            onChange={setCover}
            textFallback={title || 'This week'}
            sizeHint="Best at 1200 x 675 (16:9). Photo fills the whole card, same as events."
          />

          <div className="grid gap-3 md:grid-cols-2">
            <Field
              id="activity-go-live"
              label="Go live date"
              type="date"
              value={goLiveDate}
              onChange={(e) => setGoLiveDate(e.target.value)}
            />
            <Field
              id="activity-ends"
              label="Ends on"
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
            />
          </div>
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </Card>

      {!loading && items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((a) => (
            <li key={a.id}>
              <Card>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    className="text-left"
                    onClick={() => setPreviewId(a.id)}
                  >
                    <h2 className="font-pixel text-lg underline-offset-2 hover:underline">
                      {a.emoji ? `${a.emoji} ` : ''}
                      {a.title}
                    </h2>
                    <p className="text-xs text-muted">
                      Tap title to preview on the phone ·{' '}
                      {a.postMode === 'text' ? 'text blurb' : 'photo polaroid'}
                    </p>
                  </button>
                  <Badge tone={a.active ? 'live' : 'draft'}>
                    {a.active ? 'on Home' : 'off'}
                  </Badge>
                </div>
                <p className="mb-1 text-sm text-muted">{a.prompt}</p>
                <p className="mb-4 text-xs text-muted">
                  This week · {a.closesIn || 'ends Sunday'}
                </p>

                <div className="mb-3">
                  <Field
                    id={`closes-${a.id}`}
                    label="This week line"
                    value={a.closesIn ?? 'ends Sunday'}
                    onChange={(e) =>
                      void patch(a.id, { closesIn: e.target.value || null })
                    }
                  />
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-ink">Post style</p>
                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        { id: 'text', label: 'Text blurb' },
                        { id: 'photo', label: 'Photo polaroid' }
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        aria-pressed={(a.postMode ?? 'photo') === opt.id}
                        className={[
                          'rounded-xl border px-3 py-2 text-sm font-medium',
                          (a.postMode ?? 'photo') === opt.id
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-line bg-surface'
                        ].join(' ')}
                        onClick={() => void patch(a.id, { postMode: opt.id })}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <p className="mb-2 text-sm font-medium text-ink">Emoji</p>
                  <div className="flex flex-wrap gap-2">
                    {EMOJI_CHOICES.map((glyph) => (
                      <button
                        key={glyph}
                        type="button"
                        aria-label={`Emoji ${glyph}`}
                        aria-pressed={a.emoji === glyph}
                        className={[
                          'flex h-10 w-10 items-center justify-center rounded-xl border text-lg',
                          a.emoji === glyph
                            ? 'border-ink bg-ink text-canvas'
                            : 'border-line bg-surface'
                        ].join(' ')}
                        onClick={() => void patch(a.id, { emoji: glyph })}
                      >
                        {glyph}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <CoverPicker
                    cover={a.cover}
                    onChange={(next) =>
                      void patch(a.id, { cover: next ?? null })
                    }
                    textFallback={a.title}
                  />
                </div>

                <div className="mb-4 grid gap-3 md:grid-cols-2">
                  <Field
                    id={`go-live-${a.id}`}
                    label="Go live date"
                    type="date"
                    value={a.startsAt?.slice(0, 10) ?? ''}
                    onChange={(e) =>
                      void patch(a.id, {
                        startsAt: e.target.value || null
                      })
                    }
                  />
                  <Field
                    id={`ends-${a.id}`}
                    label="Ends on"
                    type="date"
                    value={a.endsAt?.slice(0, 10) ?? ''}
                    onChange={(e) =>
                      void patch(a.id, {
                        endsAt: e.target.value || null
                      })
                    }
                  />
                </div>
                <Toggle
                  id={`active-${a.id}`}
                  label="Show on Home now"
                  checked={a.active}
                  onChange={(e) =>
                    void patch(a.id, { active: e.target.checked })
                  }
                />
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </DemoSplit>
  );
}

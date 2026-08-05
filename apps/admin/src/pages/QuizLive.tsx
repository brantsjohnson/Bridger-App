// ============================================
// WHAT THIS FILE DOES (plain English):
// Pick which quiz shows on Home this week, set a go-live date, edit its cover
// (photo fills the card like events) and short description, and preview the
// Home quiz card on the right.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { Cover, QuizRegistryEntry } from '@bridger/shared';
import { CoverPicker } from '../components/CoverPicker';
import { DemoSplit } from '../components/DemoSplit';
import { PageState } from '../components/PageState';
import { HomeQuizPreview } from '../components/previews/HomeQuizPreview';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

export function QuizLive() {
  const [quizzes, setQuizzes] = useState<QuizRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busySlug, setBusySlug] = useState<string | null>(null);
  const [goLiveDate, setGoLiveDate] = useState(
    () => new Date().toISOString().slice(0, 10)
  );
  const [previewSlug, setPreviewSlug] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<QuizRegistryEntry[]>('/admin/quizzes');
      setQuizzes(data);
      const live = data.find((q) => q.status === 'live');
      if (live?.liveWeek) setGoLiveDate(live.liveWeek.slice(0, 10));
      setPreviewSlug((prev) => prev ?? live?.slug ?? data[0]?.slug ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load quizzes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const makeLive = async (slug: string) => {
    setBusySlug(slug);
    setSaved(false);
    setError(null);
    try {
      await api('/admin/config/live-quiz', {
        method: 'PUT',
        body: { slug, goLiveDate }
      });
      setSaved(true);
      setPreviewSlug(slug);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not set live quiz.');
    } finally {
      setBusySlug(null);
    }
  };

  const patchQuiz = async (
    slug: string,
    body: {
      description?: string | null;
      cover?: Cover | null;
    }
  ) => {
    setSaved(false);
    setError(null);
    try {
      await api(`/admin/quizzes/${encodeURIComponent(slug)}`, {
        method: 'PATCH',
        body
      });
      setSaved(true);
      setPreviewSlug(slug);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not update quiz cover.'
      );
    }
  };

  const live = quizzes.find((q) => q.status === 'live');
  const preview =
    quizzes.find((q) => q.slug === previewSlug) ?? live ?? quizzes[0];

  return (
    <DemoSplit
      title="This week's quiz"
      description="Choose which quiz people take on Home. Cover fills the card like events. Set a go-live date, then make it live."
      preview={
        <HomeQuizPreview
          title={preview?.title ?? ''}
          description={preview?.description}
          cover={preview?.cover}
          isLive={preview?.status === 'live'}
          goLiveDate={
            preview?.status === 'live'
              ? preview.liveWeek?.slice(0, 10)
              : goLiveDate
          }
        />
      }
      previewCaption="Home · Quiz card"
    >
      <PageState
        loading={loading}
        error={error}
        empty={!loading && quizzes.length === 0}
        emptyMessage="No quizzes yet. Add one under All quizzes."
        saved={saved}
        savedMessage={
          live ? `Live quiz is now "${live.title}".` : 'Quiz updated.'
        }
      />

      <Card title="When should it go live?" className="mb-6">
        <Field
          id="quiz-go-live"
          label="Go live date"
          type="date"
          value={goLiveDate}
          onChange={(e) => setGoLiveDate(e.target.value)}
          hint="Used the next time you tap Make live."
        />
      </Card>

      {preview ? (
        <Card title={`Card look · ${preview.title}`} className="mb-6">
          <p className="mb-3 text-xs text-muted">
            Editing the quiz selected on the phone ({preview.slug}).
          </p>
          <Field
            id="quiz-description"
            as="textarea"
            label="Little description"
            hint="Short line under the title on Home"
            value={preview.description ?? ''}
            onChange={(e) => {
              // Optimistic local update while typing; save on blur via button.
              setQuizzes((prev) =>
                prev.map((q) =>
                  q.slug === preview.slug
                    ? { ...q, description: e.target.value }
                    : q
                )
              );
            }}
            onBlur={(e) =>
              void patchQuiz(preview.slug, {
                description: e.target.value.trim() || null
              })
            }
          />
          <div className="mt-4">
            <CoverPicker
              cover={preview.cover}
              onChange={(next) =>
                void patchQuiz(preview.slug, { cover: next ?? null })
              }
              textFallback={preview.title}
              sizeHint="Best at 1200 x 675 (16:9). Photo fills the whole card, same as events."
            />
          </div>
        </Card>
      ) : null}

      {!loading && quizzes.length > 0 ? (
        <Card title="All quizzes">
          <ul className="divide-y divide-line">
            {quizzes.map((q) => (
              <li
                key={q.slug}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <button
                  type="button"
                  className="text-left"
                  onClick={() => setPreviewSlug(q.slug)}
                >
                  <p className="font-medium text-ink hover:underline">
                    {q.title}
                  </p>
                  <p className="text-xs text-muted">
                    Short name (slug): {q.slug}
                    {q.liveWeek ? ` · go live ${q.liveWeek.slice(0, 10)}` : ''}
                  </p>
                </button>
                <div className="flex items-center gap-2">
                  <Badge
                    tone={
                      q.status === 'live'
                        ? 'live'
                        : q.status === 'draft'
                          ? 'draft'
                          : 'archived'
                    }
                  >
                    {q.status === 'live'
                      ? 'on Home'
                      : q.status === 'draft'
                        ? 'draft'
                        : 'archived'}
                  </Badge>
                  {q.status === 'live' ? (
                    <span className="text-sm text-ok">Current</span>
                  ) : (
                    <Button
                      variant="primary"
                      disabled={busySlug === q.slug}
                      onClick={() => void makeLive(q.slug)}
                    >
                      {busySlug === q.slug ? 'Setting…' : 'Make live'}
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </DemoSplit>
  );
}

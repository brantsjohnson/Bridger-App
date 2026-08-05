// ============================================
// WHAT THIS FILE DOES (plain English):
// List of every quiz. Create a new draft with a title + short name (slug),
// then open the editor to write questions.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import type { QuizRegistryEntry } from '@bridger/shared';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

export function QuizRegistry() {
  const [quizzes, setQuizzes] = useState<QuizRegistryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [shortName, setShortName] = useState('');
  const [title, setTitle] = useState('');
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<QuizRegistryEntry[]>('/admin/quizzes');
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load quizzes.');
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
      await api('/admin/quizzes', {
        method: 'POST',
        body: { slug: shortName.trim(), title: title.trim() }
      });
      setShortName('');
      setTitle('');
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create quiz.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 font-pixel text-3xl">All quizzes</h1>
      <p className="mb-6 text-sm text-muted">
        Every quiz Bridger knows about. Open one to edit its questions.
      </p>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && quizzes.length === 0}
        emptyMessage="No quizzes yet. Add one below."
        saved={saved}
        savedMessage="Quiz created."
      />

      <Card title="New quiz" className="mb-6">
        <form
          onSubmit={(e) => void onCreate(e)}
          className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        >
          <Field
            id="new-quiz-title"
            label="Title"
            hint="What people see, e.g. Which road trip are you?"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Field
            id="new-quiz-slug"
            label="Short name (slug)"
            hint="URL-safe id, e.g. which-road-trip"
            required
            value={shortName}
            onChange={(e) => setShortName(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </Card>

      {!loading && quizzes.length > 0 ? (
        <Card title="Quizzes">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-3 font-medium">Title</th>
                  <th className="py-2 pr-3 font-medium">Short name (slug)</th>
                  <th className="py-2 pr-3 font-medium">Status</th>
                  <th className="py-2 pr-3 font-medium">Go live</th>
                  <th className="py-2 font-medium">Edit</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((q) => (
                  <tr key={q.slug} className="border-b border-line last:border-0">
                    <td className="py-3 pr-3 font-medium text-ink">{q.title}</td>
                    <td className="py-3 pr-3 text-muted">{q.slug}</td>
                    <td className="py-3 pr-3">
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
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {q.liveWeek?.slice(0, 10) ?? '-'}
                    </td>
                    <td className="py-3">
                      <Link
                        to={`/quizzes/${encodeURIComponent(q.slug)}`}
                        className="inline-flex min-h-tap min-w-tap items-center text-sm font-medium text-ink underline underline-offset-2"
                      >
                        Open editor
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : null}
    </div>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Set the 5 questions for the weekly recap podcast. Create a new week, make one
// live, and pull in the questions friends submitted (most-voted first). Only one
// week is live at a time; that's the one people record into on the Friends tab.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

type RecapWeekRow = {
  id: string;
  weekOf: string;
  active: boolean;
  questions: string[];
};

type SubmittedQuestion = {
  id: string;
  text: string;
  authorId: string;
  votes: number;
  used: boolean;
};

const EMPTY_FIVE = ['', '', '', '', ''];

export function WeeklyRecap() {
  const [weeks, setWeeks] = useState<RecapWeekRow[]>([]);
  const [submitted, setSubmitted] = useState<SubmittedQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // New-week form.
  const [weekOf, setWeekOf] = useState('');
  const [questions, setQuestions] = useState<string[]>([...EMPTY_FIVE]);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [weekData, subData] = await Promise.all([
        api<RecapWeekRow[]>('/admin/recap/weeks'),
        api<SubmittedQuestion[]>('/admin/recap/submitted-questions')
      ]);
      setWeeks(weekData);
      setSubmitted(subData);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load recap.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const setQuestionAt = (idx: number, value: string) => {
    setQuestions((prev) => prev.map((q, i) => (i === idx ? value : q)));
  };

  /** Drop a submitted question into the first empty slot (or Q5). */
  const useSubmitted = (text: string) => {
    setQuestions((prev) => {
      const firstEmpty = prev.findIndex((q) => !q.trim());
      const target = firstEmpty === -1 ? 4 : firstEmpty;
      return prev.map((q, i) => (i === target ? text : q));
    });
  };

  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSaved(false);
    setError(null);
    try {
      await api('/admin/recap/weeks', {
        method: 'POST',
        body: {
          weekOf: weekOf.trim(),
          questions: questions.map((q) => q.trim())
        }
      });
      setWeekOf('');
      setQuestions([...EMPTY_FIVE]);
      setSaved(true);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not create the week.'
      );
    } finally {
      setCreating(false);
    }
  };

  const makeLive = async (id: string) => {
    setSaved(false);
    setError(null);
    try {
      await api(`/admin/recap/weeks/${id}`, {
        method: 'PATCH',
        body: { active: true }
      });
      setSaved(true);
      await load();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not set the live week.'
      );
    }
  };

  const filledCount = questions.filter((q) => q.trim()).length;

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 font-pixel text-3xl">Weekly recap</h1>
      <p className="mb-6 text-sm text-muted">
        The 5 questions everyone answers by voice on the Friends tab. Make one
        week live at a time.
      </p>

      <PageState
        loading={loading}
        error={error}
        empty={false}
        saved={saved}
        savedMessage="Recap saved."
      />

      <Card title="New week" className="mb-6">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
          <Field
            id="recap-week-of"
            label="Week label"
            hint='What people see, e.g. "Week of 27 Jul"'
            required
            value={weekOf}
            onChange={(e) => setWeekOf(e.target.value)}
          />
          <div className="space-y-3">
            <p className="text-sm font-medium text-ink">
              The 5 questions ({filledCount}/5)
            </p>
            {questions.map((q, i) => (
              <Field
                key={i}
                id={`recap-q-${i}`}
                label={`Question ${i + 1}`}
                required
                value={q}
                onChange={(e) => setQuestionAt(i, e.target.value)}
              />
            ))}
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={creating || filledCount !== 5}
          >
            {creating ? 'Creating…' : 'Create week'}
          </Button>
        </form>
      </Card>

      {submitted.length > 0 ? (
        <Card title="Questions friends suggested" className="mb-6">
          <p className="mb-3 text-xs text-muted">
            Most-voted first. Tap Use to drop one into the form above.
          </p>
          <ul className="divide-y divide-line">
            {submitted.map((q) => (
              <li
                key={q.id}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-ink">{q.text}</p>
                  <p className="text-xs text-muted">
                    {q.votes} vote{q.votes === 1 ? '' : 's'}
                    {q.used ? ' · used' : ''}
                  </p>
                </div>
                <Button variant="secondary" onClick={() => useSubmitted(q.text)}>
                  Use
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      {!loading && weeks.length > 0 ? (
        <Card title="All weeks">
          <ul className="space-y-4">
            {weeks.map((w) => (
              <li
                key={w.id}
                className="rounded-xl border border-line p-4"
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-pixel text-lg">{w.weekOf}</h2>
                  <div className="flex items-center gap-2">
                    <Badge tone={w.active ? 'live' : 'draft'}>
                      {w.active ? 'live now' : 'draft'}
                    </Badge>
                    {w.active ? (
                      <span className="text-sm text-ok">Current</span>
                    ) : (
                      <Button
                        variant="primary"
                        onClick={() => void makeLive(w.id)}
                      >
                        Make live
                      </Button>
                    )}
                  </div>
                </div>
                <ol className="list-decimal space-y-1 pl-5 text-sm text-muted">
                  {w.questions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ol>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}

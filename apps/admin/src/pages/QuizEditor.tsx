// ============================================
// WHAT THIS FILE DOES (plain English):
// Edit one quiz's design: goal, dimensions, questions (with option weights),
// explain flag, moderator instructions, and adaptation policy.
// Loads/saves via GET/PUT /admin/quizzes/:slug/design.
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import type {
  AdaptationPolicy,
  QuizDimension,
  QuizQuestion
} from '@bridger/shared';
import { PageState } from '../components/PageState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { Toggle } from '../components/ui/Toggle';
import { api, ApiError } from '../lib/api';

type Design = {
  slug: string;
  title: string;
  quizId: string;
  version: number;
  goal: string;
  dimensions: QuizDimension[];
  moderatorInstructions: string;
  adaptationPolicy: AdaptationPolicy;
  questions: QuizQuestion[];
};

/** Hands-off until confidence is clearly low; ML may tune the floor later. */
const DEFAULT_POLICY: AdaptationPolicy = {
  mayReword: true,
  mayInsertClarifiers: true,
  maxInsertedQuestions: 2,
  mayReorder: false,
  adaptBelowConfidence: 0.35
};

function newQuestion(): QuizQuestion {
  const id = crypto.randomUUID();
  return {
    id,
    prompt: '',
    type: 'single',
    allowExplain: false,
    options: [
      { id: 'a', label: 'Option A', weights: {} },
      { id: 'b', label: 'Option B', weights: {} }
    ]
  };
}

export function QuizEditor() {
  const { slug = '' } = useParams();
  const [design, setDesign] = useState<Design | null>(null);
  const [dimensionsText, setDimensionsText] = useState('[]');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api<Design>(
        `/admin/quizzes/${encodeURIComponent(slug)}/design`
      );
      setDesign(data);
      setDimensionsText(JSON.stringify(data.dimensions ?? [], null, 2));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load design.');
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!design || !slug) return;
    setSaving(true);
    setSaved(false);
    setError(null);

    let dimensions: QuizDimension[];
    try {
      dimensions = JSON.parse(dimensionsText) as QuizDimension[];
      if (!Array.isArray(dimensions)) throw new Error('not array');
    } catch {
      setError('Dimensions must be a JSON array of { key, label }.');
      setSaving(false);
      return;
    }

    try {
      const updated = await api<Design>(
        `/admin/quizzes/${encodeURIComponent(slug)}/design`,
        {
          method: 'PUT',
          body: {
            goal: design.goal,
            dimensions,
            moderatorInstructions: design.moderatorInstructions,
            adaptationPolicy: design.adaptationPolicy,
            questions: design.questions
          }
        }
      );
      setDesign(updated);
      setDimensionsText(JSON.stringify(updated.dimensions ?? [], null, 2));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save design.');
    } finally {
      setSaving(false);
    }
  };

  const updateQuestion = (index: number, patch: Partial<QuizQuestion>) => {
    setDesign((prev) => {
      if (!prev) return prev;
      const questions = prev.questions.map((q, i) =>
        i === index ? { ...q, ...patch } : q
      );
      return { ...prev, questions };
    });
  };

  const updateOption = (
    qIndex: number,
    oIndex: number,
    patch: Partial<QuizQuestion['options'][number]>
  ) => {
    setDesign((prev) => {
      if (!prev) return prev;
      const questions = prev.questions.map((q, i) => {
        if (i !== qIndex) return q;
        const options = q.options.map((o, j) =>
          j === oIndex ? { ...o, ...patch } : o
        );
        return { ...q, options };
      });
      return { ...prev, questions };
    });
  };

  const policy = design?.adaptationPolicy ?? DEFAULT_POLICY;

  return (
    <div className="mx-auto max-w-3xl">
      <p className="mb-2">
        <Link
          to="/quizzes"
          className="text-sm text-muted underline underline-offset-2"
        >
          Back to all quizzes
        </Link>
      </p>
      <h1 className="mb-1 font-pixel text-3xl">
        {design?.title ?? 'Quiz editor'}
      </h1>
      <p className="mb-6 text-sm text-muted">
        Short name (slug): {slug}
        {design ? ` · version ${design.version}` : ''}
      </p>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && !design}
        emptyMessage="Quiz not found."
        saved={saved}
        savedMessage="Design saved."
      />

      {design ? (
        <form onSubmit={(e) => void onSave(e)} className="space-y-6">
          <Card title="Basics">
            <div className="space-y-4">
              <Field
                id="goal"
                as="textarea"
                label="Goal"
                value={design.goal}
                onChange={(e) =>
                  setDesign({ ...design, goal: e.target.value })
                }
              />
              <Field
                id="dimensions"
                as="textarea"
                label="Dimensions (JSON)"
                hint='[{ "key": "spontaneity", "label": "Spontaneity" }]'
                value={dimensionsText}
                onChange={(e) => setDimensionsText(e.target.value)}
              />
              <Field
                id="moderator"
                as="textarea"
                label="Moderator instructions"
                value={design.moderatorInstructions}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    moderatorInstructions: e.target.value
                  })
                }
              />
            </div>
          </Card>

          <Card title="Adaptation policy">
            <div className="space-y-3">
              <Toggle
                id="may-reword"
                label="May reword questions"
                checked={policy.mayReword}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    adaptationPolicy: {
                      ...policy,
                      mayReword: e.target.checked
                    }
                  })
                }
              />
              <Toggle
                id="may-clarifiers"
                label="May insert clarifiers"
                checked={policy.mayInsertClarifiers}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    adaptationPolicy: {
                      ...policy,
                      mayInsertClarifiers: e.target.checked
                    }
                  })
                }
              />
              <Toggle
                id="may-reorder"
                label="May reorder questions"
                checked={policy.mayReorder}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    adaptationPolicy: {
                      ...policy,
                      mayReorder: e.target.checked
                    }
                  })
                }
              />
              <Field
                id="max-inserted"
                label="Max inserted questions"
                type="number"
                min={0}
                value={policy.maxInsertedQuestions}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    adaptationPolicy: {
                      ...policy,
                      maxInsertedQuestions: Number(e.target.value) || 0
                    }
                  })
                }
              />
              <Field
                id="adapt-below"
                label="Adapt only below confidence (0–1)"
                type="number"
                min={0}
                max={1}
                step={0.05}
                value={policy.adaptBelowConfidence ?? 0.35}
                onChange={(e) =>
                  setDesign({
                    ...design,
                    adaptationPolicy: {
                      ...policy,
                      adaptBelowConfidence: Number(e.target.value) || 0
                    }
                  })
                }
              />
              <p className="text-sm text-ink-mute">
                AI stays hands-off until a dimension&apos;s confidence drops below
                this floor. Use 1 to disable adaptation. ML may tune later.
              </p>
            </div>
          </Card>

          <Card
            title="Questions"
            description="Options include scoring weights (server-side only)."
          >
            <div className="space-y-6">
              {design.questions.map((q, qi) => (
                <div
                  key={q.id}
                  className="rounded-xl border border-line bg-canvas/40 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">Question {qi + 1}</p>
                    <Button
                      variant="ghost"
                      type="button"
                      onClick={() =>
                        setDesign({
                          ...design,
                          questions: design.questions.filter((_, i) => i !== qi)
                        })
                      }
                    >
                      Remove
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <Field
                      id={`q-${qi}-prompt`}
                      as="textarea"
                      label="Prompt"
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestion(qi, { prompt: e.target.value })
                      }
                    />
                    <Field
                      id={`q-${qi}-type`}
                      as="select"
                      label="Type"
                      value={q.type}
                      onChange={(e) =>
                        updateQuestion(qi, {
                          type: e.target.value as 'single' | 'multi'
                        })
                      }
                    >
                      <option value="single">Single</option>
                      <option value="multi">Multi</option>
                    </Field>
                    <Toggle
                      id={`q-${qi}-explain`}
                      label="Allow explain"
                      checked={q.allowExplain}
                      onChange={(e) =>
                        updateQuestion(qi, { allowExplain: e.target.checked })
                      }
                    />

                    {q.options.map((opt, oi) => (
                      <div
                        key={opt.id}
                        className="grid gap-3 rounded-xl border border-line bg-surface p-3 md:grid-cols-2"
                      >
                        <Field
                          id={`q-${qi}-o-${oi}-label`}
                          label={`Option ${oi + 1} label`}
                          value={opt.label}
                          onChange={(e) =>
                            updateOption(qi, oi, { label: e.target.value })
                          }
                        />
                        <Field
                          id={`q-${qi}-o-${oi}-weights`}
                          label="Weights JSON"
                          hint='e.g. {"spontaneity": 2}'
                          value={JSON.stringify(opt.weights)}
                          onChange={(e) => {
                            try {
                              const weights = JSON.parse(
                                e.target.value
                              ) as Record<string, number>;
                              updateOption(qi, oi, { weights });
                            } catch {
                              // Keep typing; save will use last valid parse via stringify round-trip
                            }
                          }}
                        />
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() =>
                        updateQuestion(qi, {
                          options: [
                            ...q.options,
                            {
                              id: String.fromCharCode(97 + q.options.length),
                              label: `Option ${String.fromCharCode(65 + q.options.length)}`,
                              weights: {}
                            }
                          ]
                        })
                      }
                    >
                      Add option
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="secondary"
                onClick={() =>
                  setDesign({
                    ...design,
                    questions: [...design.questions, newQuestion()]
                  })
                }
              >
                Add question
              </Button>
            </div>
          </Card>

          <Button type="submit" variant="primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save design'}
          </Button>
        </form>
      ) : null}
    </div>
  );
}

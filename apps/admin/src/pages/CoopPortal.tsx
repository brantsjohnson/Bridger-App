// ============================================
// WHAT THIS FILE DOES (plain English):
// Operator view of the co-op portal: pending ideas to approve/decline, support
// tallies, beta vote summary, and mission support counts. Members never see
// these numbers in the app.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { PageState } from '../components/PageState';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

type IdeaRow = {
  id: string;
  title: string;
  body?: string;
  category: string;
  status: string;
  supportCount: number;
  authorId: string;
  public: boolean;
  createdAt: string;
};

type IdeaDetail = IdeaRow & {
  evidence?: string;
  drawbacks?: string;
  comments: {
    id: string;
    authorId: string;
    body: string;
    createdAt: string;
  }[];
};

type VotesSummary = {
  pendingIdeas: number;
  topIdeas: { id: string; title: string; supportCount: number; status: string }[];
  beta: {
    versionId: string;
    label: string;
    tally: { yes: number; no: number; extend: number };
  } | null;
  missionSupportCounts: { id: string; title: string; count: number }[];
};

export function CoopPortal() {
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [summary, setSummary] = useState<VotesSummary | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<IdeaDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = tab === 'pending' ? 'pending' : undefined;
      const q = status ? `?status=${status}` : '';
      const [list, votes] = await Promise.all([
        api<IdeaRow[]>(`/admin/coop/portal/ideas${q}`),
        api<VotesSummary>('/admin/coop/portal/votes/summary')
      ]);
      setIdeas(list);
      setSummary(votes);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load portal queue.'
      );
    } finally {
      setLoading(false);
    }
  }, [tab]);

  useEffect(() => {
    void load();
  }, [load]);

  // --- Load full idea detail (comments + extra fields) when operator picks one ---
  useEffect(() => {
    if (!selectedId) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setDetailLoading(true);
    void api<IdeaDetail>(`/admin/coop/portal/ideas/${selectedId}`)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof ApiError ? err.message : 'Failed to load idea detail.'
          );
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function setStatus(id: string, status: string, makePublic?: boolean) {
    setBusy(true);
    try {
      await api(`/admin/coop/portal/ideas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, public: makePublic })
      });
      setSelectedId(null);
      setDetail(null);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 font-pixel text-3xl">Co-op portal</h1>
      <p className="mb-6 text-sm text-muted">
        Review ideas, see vote tallies (hidden from members), and track mission
        support. New ideas also email COOP_IDEA_REVIEW_EMAIL when configured.
      </p>

      {summary ? (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card title="Pending ideas">
            <p className="font-pixel text-3xl">{summary.pendingIdeas}</p>
          </Card>
          <Card title="Beta tally">
            {summary.beta ? (
              <p className="text-sm">
                {summary.beta.label}: yes {summary.beta.tally.yes} · no{' '}
                {summary.beta.tally.no} · extend {summary.beta.tally.extend}
              </p>
            ) : (
              <p className="text-sm text-muted">No open beta</p>
            )}
          </Card>
          <Card title="Top supported">
            <ul className="space-y-1 text-sm">
              {summary.topIdeas.slice(0, 3).map((i) => (
                <li key={i.id}>
                  {i.supportCount} · {i.title}
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Mission support">
            <ul className="space-y-1 text-sm">
              {summary.missionSupportCounts.map((m) => (
                <li key={m.id}>
                  {m.count} · {m.title}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}

      <div className="mb-4 flex gap-2">
        <Button
          variant={tab === 'pending' ? 'primary' : 'secondary'}
          onClick={() => setTab('pending')}
        >
          Pending
        </Button>
        <Button
          variant={tab === 'all' ? 'primary' : 'secondary'}
          onClick={() => setTab('all')}
        >
          All
        </Button>
      </div>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && ideas.length === 0}
        emptyMessage="No ideas in this queue."
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Ideas">
          <ul className="divide-y divide-line">
            {ideas.map((idea) => (
              <li key={idea.id}>
                <button
                  type="button"
                  className={`w-full py-3 text-left hover:bg-canvas ${
                    selectedId === idea.id ? 'bg-canvas' : ''
                  }`}
                  onClick={() => setSelectedId(idea.id)}
                >
                  <p className="text-sm font-medium text-ink">{idea.title}</p>
                  <p className="text-xs text-muted">
                    {idea.status} · {idea.supportCount} supports ·{' '}
                    {idea.category}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </Card>

        <Card title="Review">
          {!selectedId ? (
            <p className="text-sm text-muted">Select an idea.</p>
          ) : detailLoading || !detail ? (
            <p className="text-sm text-muted">Loading idea…</p>
          ) : (
            <div className="space-y-3">
              <p className="font-medium">{detail.title}</p>
              <p className="text-sm text-muted whitespace-pre-wrap">
                {detail.body ?? '(no body)'}
              </p>
              {detail.evidence ? (
                <div>
                  <p className="text-xs font-medium text-ink">Evidence</p>
                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {detail.evidence}
                  </p>
                </div>
              ) : null}
              {detail.drawbacks ? (
                <div>
                  <p className="text-xs font-medium text-ink">Drawbacks</p>
                  <p className="text-sm text-muted whitespace-pre-wrap">
                    {detail.drawbacks}
                  </p>
                </div>
              ) : null}
              <p className="font-mono text-xs text-muted">
                author {detail.authorId} · {detail.status} · {detail.supportCount}{' '}
                supports
              </p>

              {detail.comments.length > 0 ? (
                <div>
                  <p className="mb-1 text-xs font-medium text-ink">Comments</p>
                  <ul className="space-y-2">
                    {detail.comments.map((c) => (
                      <li
                        key={c.id}
                        className="rounded border border-line p-2 text-sm"
                      >
                        <p className="text-muted whitespace-pre-wrap">{c.body}</p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {c.authorId} ·{' '}
                          {new Date(c.createdAt).toLocaleString()}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-xs text-muted">No comments yet.</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={busy}
                  onClick={() =>
                    void setStatus(detail.id, 'community_discussion', true)
                  }
                >
                  Approve & publish
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setStatus(detail.id, 'under_review')}
                >
                  Under review
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    void setStatus(detail.id, 'needs_more_detail')
                  }
                >
                  Needs more detail
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setStatus(detail.id, 'planned', true)}
                >
                  Mark planned
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setStatus(detail.id, 'implemented', true)}
                >
                  Implemented
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => void setStatus(detail.id, 'declined', false)}
                >
                  Decline
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

// ============================================
// WHAT THIS FILE DOES (plain English):
// Read-only list of active co-op members from GET /admin/coop/members.
// Shows opaque user ids only (no PII).
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { PageState } from '../components/PageState';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

type Member = {
  userId: string;
  since: string;
  duesPaidThrough?: string;
  cancelAtPeriodEnd?: boolean;
  cancelledAt?: string;
};

type MembersResponse = {
  count: number;
  members: Member[];
};

export function CoopMembers() {
  const [data, setData] = useState<MembersResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<MembersResponse>('/admin/coop/members');
      setData(res);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Failed to load members.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-pixel text-3xl">Co-op members</h1>
      <p className="mb-6 text-sm text-muted">
        Active memberships. User ids only (privacy).
      </p>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && (data?.members.length ?? 0) === 0}
        emptyMessage="No active members."
      />

      {data && data.members.length > 0 ? (
        <Card title={`Active (${data.count})`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-muted">
                  <th className="py-2 pr-3 font-medium">User id</th>
                  <th className="py-2 pr-3 font-medium">Since</th>
                  <th className="py-2 pr-3 font-medium">Dues through</th>
                  <th className="py-2 font-medium">Cancel</th>
                </tr>
              </thead>
              <tbody>
                {data.members.map((m) => (
                  <tr
                    key={m.userId}
                    className="border-b border-line last:border-0"
                  >
                    <td className="py-3 pr-3 font-mono text-xs text-ink">
                      {m.userId}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {m.since ? new Date(m.since).toLocaleDateString() : 'n/a'}
                    </td>
                    <td className="py-3 pr-3 text-muted">
                      {m.duesPaidThrough
                        ? new Date(m.duesPaidThrough).toLocaleDateString()
                        : 'n/a'}
                    </td>
                    <td className="py-3 text-muted">
                      {m.cancelAtPeriodEnd ? 'At period end' : '—'}
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

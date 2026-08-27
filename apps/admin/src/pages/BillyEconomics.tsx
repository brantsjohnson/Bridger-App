// ============================================
// WHAT THIS FILE DOES (plain English):
// Admin view of Billy AI money: open vendor alerts, grant amounts, and soft
// grant Billy+ to a user id. Never shows prompts or API keys.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import type { BillyConfigDto } from '@bridger/shared';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

type Overview = {
  config: BillyConfigDto;
  openAlerts: Array<{
    id: string;
    source: string;
    code: string;
    detail: string;
    job: string | null;
    created_at: string;
  }>;
  personalAgentSpendUsdMonth: number;
  topUsers: Array<{
    userRef: string;
    lifetimeSpentUsd: number;
    balanceUsd: number;
  }>;
};

export function BillyEconomics() {
  const [overview, setOverview] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grantUserId, setGrantUserId] = useState('');
  const [cfgDraft, setCfgDraft] = useState<BillyConfigDto | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Overview>('/admin/assistant/billy/overview');
      setOverview(data);
      setCfgDraft(data.config);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load Billy economics.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveConfig() {
    if (!cfgDraft) return;
    setSaving(true);
    try {
      await api('/admin/assistant/billy/config', {
        method: 'PUT',
        body: JSON.stringify(cfgDraft)
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  }

  async function resolveAlert(id: string) {
    await api(`/admin/assistant/billy/alerts/${id}/resolve`, { method: 'POST' });
    await load();
  }

  async function grantPlus() {
    if (!grantUserId.trim()) return;
    await api('/admin/assistant/billy/grant-plus', {
      method: 'POST',
      body: JSON.stringify({ userId: grantUserId.trim() })
    });
    setGrantUserId('');
    await load();
  }

  const alerts = overview?.openAlerts ?? [];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl text-ink">Billy / AI economics</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Per-member Billy allowances (USD of model cost) and org vendor
            alerts. Co-op dues fund ambient AI; Billy+ funds personal_agent.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </header>

      {alerts.length > 0 ? (
        <Card className="border-2 border-danger bg-[#FFF5F5] p-4">
          <p className="font-bold text-danger">
            Open vendor / budget alerts ({alerts.length})
          </p>
          <ul className="mt-3 space-y-2">
            {alerts.map((a) => (
              <li
                key={a.id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  <Badge tone="danger">{a.code}</Badge>{' '}
                  {a.source}
                  {a.job ? ` · ${a.job}` : ''} — {a.detail}
                </span>
                <Button
                  variant="secondary"
                  onClick={() => void resolveAlert(a.id)}
                >
                  Resolve
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}

      <PageState loading={loading} error={error}>
        {overview && cfgDraft ? (
          <>
            <Card className="p-4">
              <p className="text-sm text-muted">
                personal_agent spend this UTC month
              </p>
              <p className="font-pixel text-2xl text-ink">
                ${overview.personalAgentSpendUsdMonth.toFixed(4)}
              </p>
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <h2 className="font-pixel text-xl text-ink">Plan defaults</h2>
              {(
                [
                  ['tasteGrantUsd', 'Taste grant USD'],
                  ['plusPriceUsd', 'Billy+ price USD'],
                  ['plusGrantUsd', 'Billy+ grant USD'],
                  ['rolloverCapMultiplier', 'Rollover cap multiplier'],
                  ['minBalanceToStartTurnUsd', 'Min balance to start turn']
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="flex flex-col gap-1 text-sm">
                  <span className="text-muted">{label}</span>
                  <input
                    type="number"
                    step="0.01"
                    className="rounded border border-ink-line px-3 py-2"
                    value={cfgDraft[key]}
                    onChange={(e) =>
                      setCfgDraft({
                        ...cfgDraft,
                        [key]: Number(e.target.value)
                      })
                    }
                  />
                </label>
              ))}
              <Button onClick={() => void saveConfig()} disabled={saving}>
                {saving ? 'Saving…' : 'Save config'}
              </Button>
            </Card>

            <Card className="flex flex-col gap-3 p-4">
              <h2 className="font-pixel text-xl text-ink">Soft grant Billy+</h2>
              <input
                className="rounded border border-ink-line px-3 py-2 text-sm"
                placeholder="User UUID"
                value={grantUserId}
                onChange={(e) => setGrantUserId(e.target.value)}
              />
              <Button onClick={() => void grantPlus()}>Grant Billy+</Button>
            </Card>

            <Card className="p-4">
              <h2 className="font-pixel text-xl text-ink">Top spenders</h2>
              <ul className="mt-2 space-y-1 text-sm">
                {overview.topUsers.map((u) => (
                  <li key={u.userRef} className="font-mono text-xs">
                    {u.userRef.slice(0, 8)}… spent $
                    {u.lifetimeSpentUsd.toFixed(4)} · bal $
                    {u.balanceUsd.toFixed(4)}
                  </li>
                ))}
                {overview.topUsers.length === 0 ? (
                  <li className="text-muted">No balances yet.</li>
                ) : null}
              </ul>
            </Card>
          </>
        ) : null}
      </PageState>
    </div>
  );
}

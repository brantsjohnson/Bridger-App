// ============================================
// WHAT THIS FILE DOES (plain English):
// Shows whether Bridger's outbound APIs (Spotify, Supabase, AI keys, email…)
// are configured and answering. Refresh anytime. Never shows secret values.
// ============================================
import { useCallback, useEffect, useState } from 'react';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { api, ApiError } from '../lib/api';

type IntegrationStatus = 'ok' | 'warn' | 'error' | 'skip';

type IntegrationCheck = {
  id: string;
  label: string;
  status: IntegrationStatus;
  detail: string;
  kind: 'config' | 'live' | 'self';
  checkedAt: string;
};

type IntegrationsHealthReport = {
  checkedAt: string;
  overall: IntegrationStatus;
  checks: IntegrationCheck[];
};

function toneFor(status: IntegrationStatus): 'ok' | 'muted' | 'danger' | 'draft' {
  if (status === 'ok') return 'ok';
  if (status === 'warn') return 'draft';
  if (status === 'error') return 'danger';
  return 'muted';
}

function labelFor(status: IntegrationStatus): string {
  if (status === 'ok') return 'OK';
  if (status === 'warn') return 'Warn';
  if (status === 'error') return 'Error';
  return 'Skip';
}

function kindLabel(kind: IntegrationCheck['kind']): string {
  if (kind === 'live') return 'Live probe';
  if (kind === 'self') return 'This process';
  return 'Config';
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function IntegrationsHealth() {
  const [report, setReport] = useState<IntegrationsHealthReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<IntegrationsHealthReport>('/admin/integrations/health');
      setReport(data);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'Failed to load integrations health.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-pixel text-3xl text-ink">API / integrations</h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Health of outbound services Bridger depends on (Spotify, Supabase,
            AI keys, email). Checks never show secret values. When you add a
            new external API, register it here too.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void load()}>
          Refresh
        </Button>
      </header>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && !error && !report}
        emptyMessage="No health report yet."
      />

      {!loading && !error && report ? (
        <>
          <Card className="flex flex-wrap items-center gap-3">
            <Badge tone={toneFor(report.overall)}>{labelFor(report.overall)}</Badge>
            <span className="text-sm text-ink">Overall</span>
            <span className="ml-auto text-xs text-muted">
              Checked {formatWhen(report.checkedAt)}
            </span>
          </Card>

          {report.checks.map((check) => (
            <Card key={check.id} className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={toneFor(check.status)}>{labelFor(check.status)}</Badge>
                <span className="font-medium text-ink">{check.label}</span>
                <Badge tone="muted">{kindLabel(check.kind)}</Badge>
                <span className="ml-auto font-mono text-xs text-muted">{check.id}</span>
              </div>
              <p className="text-sm text-muted">{check.detail}</p>
            </Card>
          ))}
        </>
      ) : null}
    </div>
  );
}

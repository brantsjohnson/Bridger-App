// ============================================
// WHAT THIS FILE DOES (plain English):
// Saves a "someone hit a missing screen" row. Called from the mobile app when
// the Magic Patterns 404 shows. PRIVACY: path trail only.
// ============================================
import { Injectable } from '@nestjs/common';
import type { NotFoundHit, NotFoundReason } from '@bridger/shared';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class TelemetryService {
  constructor(private readonly supabase: SupabaseService) {}

  async recordNotFound(input: {
    missingPath: string;
    pathTrail: string[];
    reason?: NotFoundReason;
    platform?: string;
    appVersion?: string;
    sessionId?: string;
  }): Promise<NotFoundHit> {
    const reason: NotFoundReason = input.reason ?? 'unmatched_route';
    const trail = Array.isArray(input.pathTrail)
      ? input.pathTrail
          .filter((p): p is string => typeof p === 'string' && p.length > 0)
          .slice(-20)
          .map((p) => p.slice(0, 200))
      : [];
    const missingPath = String(input.missingPath ?? '/unknown').slice(0, 300);

    const { data, error } = await this.supabase.admin
      .from('client_not_found_hits')
      .insert({
        missing_path: missingPath,
        path_trail: trail,
        reason,
        platform: input.platform?.slice(0, 40) ?? null,
        app_version: input.appVersion?.slice(0, 40) ?? null,
        session_id: input.sessionId?.slice(0, 80) ?? null
      } as never)
      .select('*')
      .single();
    if (error) throw error;

    return mapHit(data as DbHit);
  }

  async listNotFoundHits(limit = 100): Promise<NotFoundHit[]> {
    const { data, error } = await this.supabase.admin
      .from('client_not_found_hits')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 200));
    if (error) throw error;
    const rows = (data ?? []) as DbHit[];
    if (rows.length === 0) return DEMO_HITS;
    return rows.map(mapHit);
  }
}

type DbHit = {
  id: string;
  created_at: string;
  missing_path: string;
  path_trail: string[] | null;
  reason: string;
  platform: string | null;
  app_version: string | null;
  session_id: string | null;
};

function mapHit(row: DbHit): NotFoundHit {
  const reason = (
    row.reason === 'connection_error' || row.reason === 'runtime_error'
      ? row.reason
      : 'unmatched_route'
  ) as NotFoundReason;
  return {
    id: row.id,
    createdAt: row.created_at,
    missingPath: row.missing_path,
    pathTrail: Array.isArray(row.path_trail) ? row.path_trail : [],
    reason,
    platform: row.platform ?? undefined,
    appVersion: row.app_version ?? undefined,
    sessionId: row.session_id ?? undefined
  };
}

/** Sample rows so the admin page is not empty before real traffic. */
const DEMO_HITS: NotFoundHit[] = [
  {
    id: 'demo-1',
    createdAt: new Date(Date.now() - 3600_000).toISOString(),
    missingPath: '/person/old-link',
    pathTrail: ['/home', '/friends', '/person/old-link'],
    reason: 'unmatched_route',
    platform: 'ios',
    appVersion: '0.0.1'
  },
  {
    id: 'demo-2',
    createdAt: new Date(Date.now() - 7200_000).toISOString(),
    missingPath: '/reveal/missing',
    pathTrail: ['/discover', '/reveal/missing'],
    reason: 'connection_error',
    platform: 'web',
    appVersion: '0.0.1'
  }
];

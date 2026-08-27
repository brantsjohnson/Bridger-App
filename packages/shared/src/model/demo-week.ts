// ============================================
// WHAT THIS FILE DOES (plain English):
// The admin knob for TestFlight / demo week: a time window where new people
// must invite a friend to use Bridger, and people who joined via invite cannot
// send invite links themselves.
// ============================================

/** Stored on admin_config.demo_week (jsonb). */
export type DemoWeekConfig = {
  enabled: boolean;
  /** ISO-8601 start (inclusive). Null = no lower bound. */
  startsAt: string | null;
  /** ISO-8601 end (inclusive). Null = no upper bound. */
  endsAt: string | null;
};

export const DEFAULT_DEMO_WEEK: DemoWeekConfig = {
  enabled: false,
  startsAt: null,
  endsAt: null
};

/** What the mobile app reads from GET /me/access. */
export type InviteAccessStatus = {
  /** True when admin demo week is on and now is inside the window (or env override). */
  demoWeekActive: boolean;
  /** False for invitees during demo week; everyone else true. */
  canInvite: boolean;
  /** Accepted connection count for this account. */
  friendCount: number;
  /** Whether the person may use the app tabs (demo week gate). */
  accessGranted: boolean;
  /** They tapped invite and we recorded a send during demo week. */
  demoInviteSent: boolean;
};

/** Parse admin_config.demo_week from jsonb (snake or camel). */
export function parseDemoWeekConfig(raw: unknown): DemoWeekConfig {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ...DEFAULT_DEMO_WEEK };
  }
  const row = raw as Record<string, unknown>;
  const enabled = row.enabled === true;
  const startsAt =
    typeof row.starts_at === 'string'
      ? row.starts_at
      : typeof row.startsAt === 'string'
        ? row.startsAt
        : null;
  const endsAt =
    typeof row.ends_at === 'string'
      ? row.ends_at
      : typeof row.endsAt === 'string'
        ? row.endsAt
        : null;
  return { enabled, startsAt, endsAt };
}

/** True when the config is enabled and `at` falls inside the optional bounds. */
export function isDemoWeekActive(
  config: DemoWeekConfig,
  at: Date = new Date()
): boolean {
  if (!config.enabled) return false;
  const t = at.getTime();
  if (config.startsAt) {
    const start = new Date(config.startsAt).getTime();
    if (!Number.isNaN(start) && t < start) return false;
  }
  if (config.endsAt) {
    const end = new Date(config.endsAt).getTime();
    if (!Number.isNaN(end) && t > end) return false;
  }
  return true;
}

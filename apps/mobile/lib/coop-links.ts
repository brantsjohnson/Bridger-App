// ============================================
// WHAT THIS FILE DOES (plain English):
// One place that turns a co-op announcement CTA into a route or external URL.
// Fake demo copy can say "Open the portal"; this still lands on /coop/portal.
// ============================================

export type CoopAnnouncementLink = {
  ctaUrl?: string;
  action?: string;
  ctaLabel?: string;
};

/**
 * Where a co-op announcement CTA should go.
 * - blank / portal-shaped → in-app /coop/portal
 * - other `/…` path → that path
 * - http(s) → open externally (caller uses Linking)
 */
export function hrefForCoopAnnouncement(a: CoopAnnouncementLink): {
  kind: 'in_app' | 'external';
  href: string;
} {
  const raw = (a.ctaUrl ?? '').trim();
  if (!raw || raw === '/coop' || raw === '/coop/portal') {
    return { kind: 'in_app', href: '/coop/portal' };
  }
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    return { kind: 'external', href: raw };
  }
  if (raw.startsWith('/')) {
    return { kind: 'in_app', href: raw };
  }
  return { kind: 'in_app', href: '/coop/portal' };
}

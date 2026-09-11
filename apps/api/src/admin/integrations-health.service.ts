// ============================================
// WHAT THIS FILE DOES (plain English):
// Checks whether Bridger's outbound APIs and keys look healthy for the admin
// console. Never returns secret values. A green check means "configured" and,
// when we can do it safely, "responded to a lightweight probe."
// ============================================
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  loadAppleMusicPrivateKey,
  mintAppleMusicDeveloperToken
} from '../music/apple-music-jwt';
import { readVaultLoadStatus } from '../load-server-secret';
import { PhotoFiltersService } from '../photo-filters/photo-filters.service';
import { PosthogService } from '../posthog/posthog.service';
import { SupabaseService } from '../supabase/supabase.service';

export type IntegrationStatus = 'ok' | 'warn' | 'error' | 'skip';

export type IntegrationCheck = {
  id: string;
  label: string;
  status: IntegrationStatus;
  /** Short plain-English note for the admin UI. Never secrets. */
  detail: string;
  /** configured | live | self */
  kind: 'config' | 'live' | 'self';
  checkedAt: string;
};

export type IntegrationsHealthReport = {
  checkedAt: string;
  overall: IntegrationStatus;
  checks: IntegrationCheck[];
};

@Injectable()
export class IntegrationsHealthService {
  private readonly log = new Logger(IntegrationsHealthService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly supabase: SupabaseService,
    private readonly posthog: PosthogService,
    private readonly photoFilters: PhotoFiltersService
  ) {}

  async checkAll(): Promise<IntegrationsHealthReport> {
    const checkedAt = new Date().toISOString();
    const checks: IntegrationCheck[] = [];

    checks.push(this.selfCheck(checkedAt));
    checks.push(this.vaultCheck(checkedAt));
    checks.push(await this.supabaseCheck(checkedAt));
    checks.push(await this.spotifyCheck(checkedAt));
    checks.push(await this.appleMusicCheck(checkedAt));
    checks.push(this.keyCheck('anthropic', 'Anthropic (Claude)', 'ANTHROPIC_API_KEY', checkedAt));
    checks.push(this.keyCheck('openai', 'OpenAI embeddings', 'OPENAI_API_KEY', checkedAt));
    checks.push(this.keyCheck('resend', 'Resend email', 'RESEND_API_KEY', checkedAt));
    checks.push(
      this.keyCheck(
        'music_token_key',
        'Music token encryption',
        'MUSIC_TOKEN_ENCRYPTION_KEY',
        checkedAt,
        'EMAIL_ENCRYPTION_KEY'
      )
    );
    checks.push(await this.posthogCheck(checkedAt));
    checks.push(await this.imageMagickCheck(checkedAt));
    checks.push(
      this.keyCheck(
        'revenuecat_webhook',
        'RevenueCat webhooks',
        'REVENUECAT_WEBHOOK_SECRET',
        checkedAt
      )
    );
    checks.push(this.stripeCheck(checkedAt));
    checks.push(this.twilioCheck(checkedAt));

    const overall = rollup(checks);
    return { checkedAt, overall, checks };
  }

  // THIS SECTION DOES: say whether boot read the AWS vault (key names only).
  private vaultCheck(checkedAt: string): IntegrationCheck {
    const status = readVaultLoadStatus();
    if (!status || !status.attempted) {
      return {
        id: 'secret_vault',
        label: 'AWS secret vault',
        status: 'warn',
        detail:
          'This process did not load bridger/api/server. Local .env is in use, or BRIDGER_SERVER_SECRET_NAME is unset.',
        kind: 'config',
        checkedAt
      };
    }
    if (!status.loaded) {
      return {
        id: 'secret_vault',
        label: 'AWS secret vault',
        status: 'error',
        detail: `Vault load failed (${status.error ?? 'unknown'}). Stripe / MusicKit keys in the vault are unused.`,
        kind: 'config',
        checkedAt
      };
    }
    const interesting = [
      'APPLE_MUSIC_PRIVATE_KEY',
      'SPOTIFY_CLIENT_SECRET',
      'STRIPE_SECRET_KEY',
      'REVENUECAT_WEBHOOK_SECRET'
    ];
    const filledHit = interesting.filter((k) => status.filled.includes(k) || status.skippedExisting.includes(k));
    const emptyHit = interesting.filter((k) => status.empty.includes(k));
    return {
      id: 'secret_vault',
      label: 'AWS secret vault',
      status: emptyHit.length ? 'warn' : 'ok',
      detail: `Loaded. copied=${status.filled.length} kept=${status.skippedExisting.length} empty=${status.empty.length}. music/pay filled: ${filledHit.join(', ') || 'none'}. still empty: ${emptyHit.join(', ') || 'none'}.`,
      kind: 'live',
      checkedAt
    };
  }

  // THIS SECTION DOES: confirm this Nest process itself answered.
  private selfCheck(checkedAt: string): IntegrationCheck {
    return {
      id: 'nest_api',
      label: 'Nest API process',
      status: 'ok',
      detail: 'Admin health endpoint reached this process.',
      kind: 'self',
      checkedAt
    };
  }

  // THIS SECTION DOES: one cheap DB round-trip with the service role.
  private async supabaseCheck(checkedAt: string): Promise<IntegrationCheck> {
    const url = this.config.get<string>('SUPABASE_URL');
    const secret = this.config.get<string>('SUPABASE_SECRET_KEY');
    if (!url || !secret) {
      return {
        id: 'supabase',
        label: 'Supabase',
        status: 'error',
        detail: 'SUPABASE_URL or SUPABASE_SECRET_KEY is missing.',
        kind: 'config',
        checkedAt
      };
    }
    try {
      const { error } = await this.supabase.admin
        .from('users')
        .select('id')
        .limit(1);
      if (error) {
        return {
          id: 'supabase',
          label: 'Supabase',
          status: 'error',
          detail: `Query failed (${error.code ?? 'error'}).`,
          kind: 'live',
          checkedAt
        };
      }
      return {
        id: 'supabase',
        label: 'Supabase',
        status: 'ok',
        detail: 'Service role can query the database.',
        kind: 'live',
        checkedAt
      };
    } catch (e) {
      this.log.warn(`Supabase health failed: ${String(e)}`);
      return {
        id: 'supabase',
        label: 'Supabase',
        status: 'error',
        detail: 'Could not reach Supabase.',
        kind: 'live',
        checkedAt
      };
    }
  }

  // THIS SECTION DOES: Spotify keys present + client-credentials token probe.
  private async spotifyCheck(checkedAt: string): Promise<IntegrationCheck> {
    const clientId = this.config.get<string>('SPOTIFY_CLIENT_ID');
    const clientSecret = this.config.get<string>('SPOTIFY_CLIENT_SECRET');
    const redirect = this.config.get<string>('SPOTIFY_REDIRECT_URI');
    if (!clientId || !clientSecret) {
      return {
        id: 'spotify',
        label: 'Spotify Web API',
        status: 'error',
        detail: 'SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET is missing.',
        kind: 'config',
        checkedAt
      };
    }
    if (!redirect) {
      return {
        id: 'spotify',
        label: 'Spotify Web API',
        status: 'warn',
        detail: 'Keys present, but SPOTIFY_REDIRECT_URI is empty (connect will fail).',
        kind: 'config',
        checkedAt
      };
    }
    // Loopback redirects break Connect on a real phone (Safari hits the phone, not Nest).
    try {
      const host = new URL(redirect).hostname.toLowerCase();
      if (host === '127.0.0.1' || host === 'localhost' || host === '::1') {
        return {
          id: 'spotify',
          label: 'Spotify Web API',
          status: 'warn',
          detail:
            'SPOTIFY_REDIRECT_URI is loopback (127.0.0.1/localhost). Phones cannot finish Agree. Set it to the public API /music/spotify/callback and match the Spotify dashboard.',
          kind: 'config',
          checkedAt
        };
      }
    } catch {
      return {
        id: 'spotify',
        label: 'Spotify Web API',
        status: 'warn',
        detail: 'SPOTIFY_REDIRECT_URI is not a valid URL.',
        kind: 'config',
        checkedAt
      };
    }
    try {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basic}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({ grant_type: 'client_credentials' }).toString()
      });
      if (!res.ok) {
        return {
          id: 'spotify',
          label: 'Spotify Web API',
          status: 'error',
          detail: `Token probe failed (HTTP ${res.status}). Check Client ID/secret.`,
          kind: 'live',
          checkedAt
        };
      }
      return {
        id: 'spotify',
        label: 'Spotify Web API',
        status: 'ok',
        detail: 'Configured; client-credentials token succeeded.',
        kind: 'live',
        checkedAt
      };
    } catch (e) {
      this.log.warn(`Spotify health failed: ${String(e)}`);
      return {
        id: 'spotify',
        label: 'Spotify Web API',
        status: 'error',
        detail: 'Could not reach accounts.spotify.com.',
        kind: 'live',
        checkedAt
      };
    }
  }

  // THIS SECTION DOES: Apple MusicKit keys present + developer JWT mint probe.
  private async appleMusicCheck(checkedAt: string): Promise<IntegrationCheck> {
    const teamId = this.config.get<string>('APPLE_MUSIC_TEAM_ID')?.trim();
    const keyId = this.config.get<string>('APPLE_MUSIC_KEY_ID')?.trim();
    const path = this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY_PATH')?.trim();
    const inline = this.config.get<string>('APPLE_MUSIC_PRIVATE_KEY')?.trim();
    if (!teamId || !keyId) {
      return {
        id: 'apple_music',
        label: 'Apple Music (MusicKit)',
        status: 'error',
        detail: 'APPLE_MUSIC_TEAM_ID or APPLE_MUSIC_KEY_ID is missing.',
        kind: 'config',
        checkedAt
      };
    }
    if (!path && !inline) {
      return {
        id: 'apple_music',
        label: 'Apple Music (MusicKit)',
        status: 'error',
        detail: 'APPLE_MUSIC_PRIVATE_KEY_PATH or APPLE_MUSIC_PRIVATE_KEY is missing.',
        kind: 'config',
        checkedAt
      };
    }
    try {
      const privateKeyPem = loadAppleMusicPrivateKey({ path, inlinePem: inline });
      await mintAppleMusicDeveloperToken({
        teamId,
        keyId,
        privateKeyPem,
        ttlSeconds: 60
      });
      return {
        id: 'apple_music',
        label: 'Apple Music (MusicKit)',
        status: 'ok',
        detail: 'Configured; developer JWT mint succeeded.',
        kind: 'live',
        checkedAt
      };
    } catch (e) {
      this.log.warn(`Apple Music health failed: ${String(e)}`);
      return {
        id: 'apple_music',
        label: 'Apple Music (MusicKit)',
        status: 'error',
        detail: 'Could not mint a MusicKit developer token. Check Team ID, Key ID, and .p8.',
        kind: 'live',
        checkedAt
      };
    }
  }

  // THIS SECTION DOES: PostHog project probe (never returns the personal key).
  private async posthogCheck(checkedAt: string): Promise<IntegrationCheck> {
    const result = await this.posthog.healthCheck();
    return {
      id: 'posthog',
      label: 'PostHog analytics',
      status: result.status,
      detail: result.detail,
      kind: result.kind,
      checkedAt
    };
  }

  // THIS SECTION DOES: confirm ImageMagick (the photo-filter engine) is
  // installed so Pop art / Comic / X-ray / Sepia can bake. It is a local
  // tool, not an outbound API.
  private async imageMagickCheck(checkedAt: string): Promise<IntegrationCheck> {
    try {
      const ok = await this.photoFilters.isAvailable();
      return {
        id: 'imagemagick',
        label: 'ImageMagick (photo filters)',
        status: ok ? 'ok' : 'error',
        detail: ok
          ? 'ImageMagick binary is available for server-side photo looks.'
          : 'ImageMagick is not installed; profile-photo looks will fail.',
        kind: 'self',
        checkedAt
      };
    } catch {
      return {
        id: 'imagemagick',
        label: 'ImageMagick (photo filters)',
        status: 'error',
        detail: 'Could not check for ImageMagick.',
        kind: 'self',
        checkedAt
      };
    }
  }

  // THIS SECTION DOES: confirm a secret env var is set (never echo the value).
  private keyCheck(
    id: string,
    label: string,
    primaryKey: string,
    checkedAt: string,
    fallbackKey?: string
  ): IntegrationCheck {
    const primary = this.config.get<string>(primaryKey);
    const fallback = fallbackKey ? this.config.get<string>(fallbackKey) : undefined;
    if (primary && primary.trim()) {
      return {
        id,
        label,
        status: 'ok',
        detail: `${primaryKey} is set.`,
        kind: 'config',
        checkedAt
      };
    }
    if (fallback && fallback.trim()) {
      return {
        id,
        label,
        status: 'warn',
        detail: `${primaryKey} unset; using ${fallbackKey} as fallback.`,
        kind: 'config',
        checkedAt
      };
    }
    return {
      id,
      label,
      status: 'error',
      detail: `${primaryKey} is missing.`,
      kind: 'config',
      checkedAt
    };
  }

  // THIS SECTION DOES: Stripe secret + at least one price id + webhook secret.
  private stripeCheck(checkedAt: string): IntegrationCheck {
    const key = this.config.get<string>('STRIPE_SECRET_KEY')?.trim();
    const monthly = this.config.get<string>('STRIPE_PRICE_MONTHLY')?.trim();
    const yearly = this.config.get<string>('STRIPE_PRICE_YEARLY')?.trim();
    const webhook = this.config.get<string>('STRIPE_WEBHOOK_SECRET')?.trim();
    if (!key) {
      return {
        id: 'stripe',
        label: 'Stripe (card membership)',
        status: 'error',
        detail: 'STRIPE_SECRET_KEY is missing.',
        kind: 'config',
        checkedAt
      };
    }
    if (!monthly && !yearly) {
      return {
        id: 'stripe',
        label: 'Stripe (card membership)',
        status: 'error',
        detail: 'STRIPE_PRICE_MONTHLY and STRIPE_PRICE_YEARLY are both missing.',
        kind: 'config',
        checkedAt
      };
    }
    if (!webhook) {
      return {
        id: 'stripe',
        label: 'Stripe (card membership)',
        status: 'warn',
        detail: 'Secret + price set; STRIPE_WEBHOOK_SECRET missing (Checkout cannot grant membership).',
        kind: 'config',
        checkedAt
      };
    }
    return {
      id: 'stripe',
      label: 'Stripe (card membership)',
      status: 'ok',
      detail: 'STRIPE_SECRET_KEY, price id(s), and STRIPE_WEBHOOK_SECRET are set.',
      kind: 'config',
      checkedAt
    };
  }

  // THIS SECTION DOES: confirm Twilio is configured for phone OTP (never echo tokens).
  private twilioCheck(checkedAt: string): IntegrationCheck {
    const sid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const token =
      this.config.get<string>('TWILIO_AUTH_TOKEN') ||
      this.config.get<string>('SUPABASE_AUTH_SMS_TWILIO_AUTH_TOKEN');
    const from =
      this.config.get<string>('TWILIO_MESSAGE_SERVICE_SID') ||
      this.config.get<string>('TWILIO_FROM_NUMBER');
    if (!sid || !token) {
      return {
        id: 'twilio_sms',
        label: 'Twilio SMS (phone sign-in)',
        status: 'warn',
        detail:
          'TWILIO_ACCOUNT_SID or auth token is missing. Phone OTP will fail until Twilio is configured in Supabase Auth.',
        kind: 'config',
        checkedAt
      };
    }
    if (!from) {
      return {
        id: 'twilio_sms',
        label: 'Twilio SMS (phone sign-in)',
        status: 'warn',
        detail: 'Account is set; add TWILIO_MESSAGE_SERVICE_SID or TWILIO_FROM_NUMBER.',
        kind: 'config',
        checkedAt
      };
    }
    return {
      id: 'twilio_sms',
      label: 'Twilio SMS (phone sign-in)',
      status: 'ok',
      detail: 'Twilio account + sender are set. Auth token is not shown.',
      kind: 'config',
      checkedAt
    };
  }
}

function rollup(checks: IntegrationCheck[]): IntegrationStatus {
  if (checks.some((c) => c.status === 'error')) return 'error';
  if (checks.some((c) => c.status === 'warn')) return 'warn';
  if (checks.every((c) => c.status === 'ok' || c.status === 'skip')) return 'ok';
  return 'warn';
}

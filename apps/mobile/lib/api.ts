// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny helper for calling the NestJS API from the mobile app. It puts the
// signed-in Supabase session token on each request so the API knows who you
// are. Demo mode never needs this (fixtures stay local).
//
// SECURITY: never hard-crash the app when the API address is missing. A missing
// EXPO_PUBLIC_API_URL used to throw a red error before any screen painted on
// TestFlight. We warn, mark the build as unconfigured, and throw a soft
// ApiHttpError that callers can catch (same idea as supabase.ts).
// ============================================
import Constants from 'expo-constants';
import { supabase } from './supabase';

/** Nest error with a stable `code` (e.g. billy_allowance_exhausted). */
export class ApiHttpError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly body?: Record<string, unknown>;

  constructor(
    status: number,
    path: string,
    body?: Record<string, unknown>,
    rawText?: string
  ) {
    const msg =
      typeof body?.message === 'string'
        ? body.message
        : `API ${status} ${path}${rawText ? `: ${rawText.slice(0, 200)}` : ''}`;
    super(msg);
    this.name = 'ApiHttpError';
    this.status = status;
    this.code = typeof body?.code === 'string' ? body.code : undefined;
    this.body = body;
  }
}

/**
 * Read the Nest API base URL. Prefer the Metro-inlined env var; fall back to
 * Expo `extra.apiUrl` baked at EAS config time (same pattern as RevenueCat).
 */
function readApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim() ?? '';
  const extra = Constants.expoConfig?.extra as Record<string, unknown> | undefined;
  const fromExtra = typeof extra?.apiUrl === 'string' ? extra.apiUrl.trim() : '';
  return (fromEnv || fromExtra).replace(/\/$/, '');
}

/** True when this build was shipped with a Nest API address. */
export const isApiConfigured = Boolean(readApiUrl());

if (!isApiConfigured) {
  console.warn(
    '[bridger] EXPO_PUBLIC_API_URL missing in this build. Live API calls will fail softly until EAS env is set. Demo unlock still works.'
  );
}

/** Base URL for the Nest API (e.g. http://localhost:3000). */
function apiBase(): string {
  const base = readApiUrl();
  if (!base) {
    // Soft failure: never use a "Missing … .env" Error that kills cold start.
    throw new ApiHttpError(503, '(api-base)', {
      code: 'api_not_configured',
      message: 'API URL not configured in this build'
    });
  }
  return base;
}

/**
 * Fetch JSON from the Bridger API with the current auth token.
 * SECURITY: never put secrets in the client beyond the user's own session.
 */
export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const url = `${apiBase()}${path.startsWith('/') ? path : `/${path}`}`;
  const res = await fetch(url, { ...init, headers });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    let body: Record<string, unknown> | undefined;
    try {
      body = text ? (JSON.parse(text) as Record<string, unknown>) : undefined;
    } catch {
      body = undefined;
    }
    throw new ApiHttpError(res.status, path, body, text);
  }

  // Some endpoints return 204 / empty body.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

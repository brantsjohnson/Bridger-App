// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny helper for calling the NestJS API from the mobile app. It puts the
// signed-in Supabase session token on each request so the API knows who you
// are. Demo mode never needs this (fixtures stay local).
// ============================================
import { supabase } from './supabase';

/** Base URL for the Nest API (e.g. http://localhost:3000). */
function apiBase(): string {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (!base) {
    throw new Error('Missing EXPO_PUBLIC_API_URL. Check apps/mobile/.env');
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
    throw new Error(
      `API ${res.status} ${path}${text ? `: ${text.slice(0, 200)}` : ''}`
    );
  }

  // Some endpoints return 204 / empty body.
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

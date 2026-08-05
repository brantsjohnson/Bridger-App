// ============================================
// WHAT THIS FILE DOES (plain English):
// Tiny fetch helper for talking to the NestJS API. Attaches the admin JWT
// from localStorage and sends people back to /login if the token is rejected.
//
// SECURITY: never store the admin password in localStorage, sessionStorage,
// cookies, or source. Only the short-lived JWT lives on the client.
// ============================================

const TOKEN_KEY = 'bridger_admin_token';

/** Where the NestJS API lives (set in .env.local). */
function apiBase(): string {
  const base = import.meta.env.VITE_API_URL as string | undefined;
  if (!base) {
    throw new Error(
      'VITE_API_URL is missing. Copy apps/admin/.env.example to .env.local.'
    );
  }
  return base.replace(/\/$/, '');
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/** SECURITY: clears the session token only. Never touch a password field. */
export function clearAdminToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  /** Skip Bearer header (used for login). */
  auth?: boolean;
};

/**
 * Call an admin API path (e.g. "/admin/quizzes").
 * On 401: clear token and send the browser to /login.
 */
export async function api<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const { method = 'GET', body, auth = true } = options;
  const headers: Record<string, string> = {
    Accept: 'application/json'
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getAdminToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${apiBase()}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body)
  });

  // --- Session expired or never valid ---
  if (res.status === 401) {
    clearAdminToken();
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.assign('/login');
    }
    throw new ApiError(401, 'Session expired. Sign in again.');
  }

  const text = await res.text();
  let parsed: unknown = null;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      typeof parsed === 'object' &&
      parsed &&
      'message' in parsed &&
      typeof (parsed as { message: unknown }).message === 'string'
        ? (parsed as { message: string }).message
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}

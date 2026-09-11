// ============================================
// WHAT THIS FILE DOES (plain English):
// TEMPORARY debug instrumentation for the lag / error sweep. It watches the
// app while you use it and reports to a local debug server: which errors
// fire, which network calls happen (and how slow they are), and when the
// JavaScript thread freezes. It will be removed once the bugs are fixed.
// ============================================

// #region agent log
const DEBUG_ENDPOINT = 'http://127.0.0.1:7342/ingest/5893d51f-0bb0-4f73-ad67-eda076bc0ba4';
const SESSION = 'dd99f5';

// THIS SECTION DOES: one tiny helper that ships a log line to the debug server.
function dbg(location: string, message: string, data: Record<string, unknown>, hypothesisId: string) {
  try {
    // Use the ORIGINAL fetch so our own logs never go through the wrapper below.
    originalFetch(DEBUG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': SESSION },
      body: JSON.stringify({
        sessionId: SESSION,
        location,
        message,
        data,
        hypothesisId,
        timestamp: Date.now()
      })
    }).catch(() => {});
  } catch {
    // Never let debugging crash the app.
  }
}

// THIS SECTION DOES: keep a handle to the real fetch before we wrap it.
const originalFetch: typeof fetch = global.fetch.bind(global);

// --- H-D: capture every console.error / console.warn (what errors, how often) ---
const seenConsole = new Map<string, number>();
function hookConsole(kind: 'error' | 'warn') {
  const original = console[kind].bind(console);
  console[kind] = (...args: unknown[]) => {
    try {
      const text = args
        .map((a) => (typeof a === 'string' ? a : a instanceof Error ? `${a.name}: ${a.message}` : safeStringify(a)))
        .join(' ')
        .slice(0, 400);
      const count = (seenConsole.get(text) ?? 0) + 1;
      seenConsole.set(text, count);
      // Log the first 3 occurrences of each unique message, then every 25th.
      if (count <= 3 || count % 25 === 0) {
        dbg('debug-instrumentation.ts:consoleHook', `console.${kind}`, { text, count }, 'H-D');
      }
    } catch {}
    original(...args);
  };
}
function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v)?.slice(0, 200) ?? String(v);
  } catch {
    return String(v);
  }
}
hookConsole('error');
hookConsole('warn');

// --- H-A: wrap fetch so we see every network call, its duration, and failures ---
global.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url;
  // Skip our own debug traffic so we do not loop forever.
  if (url.includes('7342')) return originalFetch(input as RequestInfo, init);
  const started = Date.now();
  return originalFetch(input as RequestInfo, init).then(
    (res) => {
      const ms = Date.now() - started;
      // Log slow (>500ms) or failed requests; sample fast ones (1 in 10).
      if (ms > 500 || !res.ok || Math.random() < 0.1) {
        dbg('debug-instrumentation.ts:fetchWrap', 'fetch done', { url: url.slice(0, 200), ms, status: res.status, slow: ms > 500 }, 'H-A');
      }
      return res;
    },
    (err) => {
      dbg('debug-instrumentation.ts:fetchWrap', 'fetch FAILED', { url: url.slice(0, 200), ms: Date.now() - started, error: String(err).slice(0, 200) }, 'H-A');
      throw err;
    }
  );
}) as typeof fetch;

// --- H-B: JS-thread stall detector. A 500ms heartbeat that arrives late means
//     the JavaScript thread was blocked (this is exactly what "lag" feels like). ---
let lastBeat = Date.now();
setInterval(() => {
  const now = Date.now();
  const drift = now - lastBeat - 500;
  lastBeat = now;
  if (drift > 250) {
    dbg('debug-instrumentation.ts:stallDetector', 'JS thread stalled', { stallMs: drift }, 'H-B');
  }
}, 500);

// --- H-C: exported counter the tab-badges notifier calls, so we can see
//     re-render storms (too many notify() fan-outs per second). ---
let notifyCount = 0;
let notifyWindowStart = Date.now();
export function debugCountNotify(source: string): void {
  notifyCount += 1;
  const now = Date.now();
  if (now - notifyWindowStart >= 2000) {
    if (notifyCount > 4) {
      dbg('debug-instrumentation.ts:notifyCounter', 'subscription notify burst', { source, countIn2s: notifyCount }, 'H-C');
    }
    notifyCount = 0;
    notifyWindowStart = now;
  }
}

// --- H-B/H-C: route-change marker so stalls and bursts line up with navigation. ---
export function debugRouteChange(pathname: string): void {
  dbg('debug-instrumentation.ts:routeChange', 'route changed', { pathname }, 'H-B');
}

// --- H-E: avatar/photo resolver timing marker (call sites report how long
//     a photo took from "asked for" to "resolved"). ---
export function debugPhotoResolved(personId: string, ms: number, source: string): void {
  if (ms > 100) {
    dbg('debug-instrumentation.ts:photoResolve', 'slow photo resolve', { personId, ms, source }, 'H-E');
  }
}

// --- H-F: record every guard redirect the root layout makes, with the reason,
//     so we can see redirects that fire in the middle of your navigation. ---
export function debugGuardRedirect(target: string, reason: string, segments: string): void {
  dbg('debug-instrumentation.ts:guardRedirect', 'guard redirect', { target, reason, segments }, 'H-F');
}

// --- H-G: record every screen mount/unmount so we can see a page you did NOT
//     tap being mounted underneath the one you did. ---
export function debugScreenMount(screen: string): () => void {
  const mountedAt = Date.now();
  dbg('debug-instrumentation.ts:screenMount', 'screen MOUNTED', { screen }, 'H-G');
  return () => {
    dbg('debug-instrumentation.ts:screenMount', 'screen UNMOUNTED', { screen, aliveMs: Date.now() - mountedAt }, 'H-G');
  };
}

// --- H-I / H-J: story viewer tap tracing (do tap zones fire? does the slide
//     index actually move?). ---
export function debugStoryEvent(message: string, data: Record<string, unknown>): void {
  dbg('debug-instrumentation.ts:story', message, data, 'H-I');
}

// --- H-K / H-L: photo filter (Comic) tracing: which surface, which bake path
//     (server / web canvas / native stub), how long each stage takes. ---
export function debugFilterEvent(message: string, data: Record<string, unknown>): void {
  dbg('debug-instrumentation.ts:photoFilter', message, data, 'H-K');
}

// --- H-H: camera spin-up timing (mount → ready, and 4s timeout fallbacks). ---
export function debugCameraEvent(message: string, data: Record<string, unknown>): void {
  dbg('debug-instrumentation.ts:camera', message, data, 'H-H');
}

dbg('debug-instrumentation.ts:boot', 'instrumentation active', { platform: 'app-boot' }, 'H-D');
// #endregion

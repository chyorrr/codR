import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase access with a circuit breaker.
 *
 * The database is optional in codR — the arena runs off the local catalog — so
 * every call here is best-effort. When the host is unreachable (paused project,
 * deleted project, no network) we stop dialling it for a while instead of making
 * every single request pay a DNS timeout.
 */

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;

/**
 * The service role key bypasses RLS, which is exactly what these routes need:
 * the schema grants the anon key read-only access, so match results and ELO can
 * only be written by trusted server code. It falls back to the anon key so the
 * app still reads fine if only the public key is configured.
 */
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const QUERY_TIMEOUT_MS = 4000;
const BREAKER_COOLDOWN_MS = 60_000;

let client = null;
let breakerOpenedAt = 0;

export function isConfigured() {
  return Boolean(URL && KEY && /^https?:\/\//.test(URL));
}

/** True when writes are actually permitted (service role present). */
export function canWrite() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function getSupabase() {
  if (!isConfigured()) return null;
  if (Date.now() - breakerOpenedAt < BREAKER_COOLDOWN_MS) return null;
  if (!client) {
    client = createClient(URL, KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return client;
}

function tripBreaker() {
  breakerOpenedAt = Date.now();
}

/**
 * Runs a Supabase query, returning `fallback` on any failure.
 * `run` receives the client and must return a PostgREST builder / promise.
 */
export async function safeQuery(run, fallback = null) {
  const supabase = getSupabase();
  if (!supabase) return fallback;

  try {
    const result = await Promise.race([
      run(supabase),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('supabase-timeout')), QUERY_TIMEOUT_MS)
      ),
    ]);

    if (result?.error) {
      // PGRST116 = "no rows", an expected outcome rather than an outage.
      if (result.error.code !== 'PGRST116') {
        console.warn('[supabase] query error:', result.error.message);
      }
      return fallback;
    }
    return result?.data ?? fallback;
  } catch (err) {
    const message = String(err?.message || err);
    if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout|network/i.test(message)) {
      tripBreaker();
      console.warn('[supabase] unreachable — serving local data for the next 60s');
    } else {
      console.warn('[supabase] unexpected failure:', message);
    }
    return fallback;
  }
}

/** Like safeQuery but reports whether the write actually happened. */
export async function safeWrite(run) {
  const supabase = getSupabase();
  if (!supabase) return { ok: false, reason: 'unavailable' };

  try {
    const result = await Promise.race([
      run(supabase),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('supabase-timeout')), QUERY_TIMEOUT_MS)
      ),
    ]);
    if (result?.error) return { ok: false, reason: result.error.message };
    return { ok: true, data: result?.data ?? null };
  } catch (err) {
    const message = String(err?.message || err);
    if (/fetch failed|ENOTFOUND|ECONNREFUSED|timeout|network/i.test(message)) tripBreaker();
    return { ok: false, reason: message };
  }
}

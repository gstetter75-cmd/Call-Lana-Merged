// Shared in-memory rate limiter for Edge Functions.
// Uses a sliding window per key (typically user ID or IP).
// Note: Each Edge Function instance has its own memory,
// so this is per-instance, not global — but sufficient
// to prevent rapid abuse from a single connection.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodic cleanup to prevent memory leak in long-running instances
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 60_000;

function cleanup(now: number): void {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

/**
 * Check if a request should be allowed.
 * @param key - Unique identifier (user ID, IP, etc.)
 * @param maxRequests - Maximum requests per window (default: 20)
 * @param windowMs - Time window in ms (default: 60s)
 * @returns Object with `allowed` boolean and `retryAfterMs` if blocked.
 */
export function rateLimit(
  key: string,
  maxRequests = 20,
  windowMs = 60_000,
): { allowed: boolean; retryAfterMs: number } {
  const now = Date.now();
  cleanup(now);

  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }

  entry.count++;
  return { allowed: true, retryAfterMs: 0 };
}

/** Creates a standard 429 Response for rate-limited requests. */
export function rateLimitResponse(retryAfterMs: number, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: 'Too many requests. Please try again later.' }),
    {
      status: 429,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    },
  );
}

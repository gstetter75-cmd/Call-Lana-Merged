import { describe, it, expect, beforeEach } from 'vitest';

// Test the rate limit logic directly (mirrored from _shared/rate-limit.ts)
// Since the Edge Function uses Deno imports, we re-implement for Node testing.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

function rateLimit(key: string, maxRequests = 20, windowMs = 60_000) {
  const now = Date.now();
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

describe('Rate Limiter', () => {
  beforeEach(() => {
    store.clear();
  });

  it('allows first request', () => {
    const result = rateLimit('user-1', 5, 60_000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it('allows requests up to the limit', () => {
    for (let i = 0; i < 5; i++) {
      const result = rateLimit('user-2', 5, 60_000);
      expect(result.allowed).toBe(true);
    }
  });

  it('blocks requests exceeding the limit', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('user-3', 5, 60_000);
    }
    const result = rateLimit('user-3', 5, 60_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it('isolates different keys', () => {
    for (let i = 0; i < 5; i++) {
      rateLimit('user-a', 5, 60_000);
    }
    // user-b should still be allowed
    const result = rateLimit('user-b', 5, 60_000);
    expect(result.allowed).toBe(true);
  });

  it('resets after window expires', () => {
    // Fill the limit
    for (let i = 0; i < 5; i++) {
      rateLimit('user-4', 5, 1); // 1ms window
    }
    // Wait for window to expire (synchronous — it's already past)
    const entry = store.get('user-4')!;
    entry.resetAt = Date.now() - 1; // Force expiry

    const result = rateLimit('user-4', 5, 1);
    expect(result.allowed).toBe(true);
  });

  it('returns retryAfterMs in milliseconds', () => {
    for (let i = 0; i < 3; i++) {
      rateLimit('user-5', 3, 30_000);
    }
    const result = rateLimit('user-5', 3, 30_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeLessThanOrEqual(30_000);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });
});

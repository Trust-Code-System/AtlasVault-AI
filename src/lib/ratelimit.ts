/**
 * In-memory sliding-window rate limiter — adequate for single-instance
 * deployment; swap for Redis (Upstash) when scaling horizontally.
 */
const buckets = new Map<string, number[]>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfterSec: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    const retryAfterSec = Math.ceil((hits[0] + windowMs - now) / 1000);
    return { ok: false, retryAfterSec: Math.max(1, retryAfterSec) };
  }
  hits.push(now);
  buckets.set(key, hits);
  // opportunistic cleanup
  if (buckets.size > 5000) {
    for (const [k, v] of buckets) if (v.every((t) => t <= windowStart)) buckets.delete(k);
  }
  return { ok: true, retryAfterSec: 0 };
}

export const LIMITS = {
  ask: { limit: 20, windowMs: 60_000 },
  upload: { limit: 30, windowMs: 60_000 },
  generate: { limit: 10, windowMs: 60_000 },
  auth: { limit: 10, windowMs: 60_000 },
};

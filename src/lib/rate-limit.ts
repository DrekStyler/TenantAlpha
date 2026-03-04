/**
 * Simple in-memory sliding-window rate limiter.
 *
 * NOTE: This works per-instance (Vercel serverless function instance).
 * For strict global enforcement, swap in Redis-backed storage.
 * This still provides meaningful protection against rapid abuse from
 * a single client hitting the same instance.
 */

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

// Clean up stale entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;

  const cutoff = now - windowMs;
  for (const [key, entry] of store) {
    entry.timestamps = entry.timestamps.filter((t) => t > cutoff);
    if (entry.timestamps.length === 0) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests allowed in the window */
  maxRequests: number;
  /** Window size in milliseconds */
  windowMs: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs?: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - config.windowMs;

  cleanup(config.windowMs);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest = entry.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: oldest + config.windowMs - now,
    };
  }

  entry.timestamps.push(now);
  return {
    allowed: true,
    remaining: config.maxRequests - entry.timestamps.length,
  };
}

/**
 * Pre-configured rate limit presets for different endpoint categories.
 */
export const RATE_LIMITS = {
  /** AI endpoints: 10 requests per minute per user */
  ai: { maxRequests: 10, windowMs: 60_000 },
  /** PDF export: 5 per minute per user */
  pdf: { maxRequests: 5, windowMs: 60_000 },
  /** Public questionnaire: 10 per minute per IP/token */
  questionnaire: { maxRequests: 10, windowMs: 60_000 },
  /** Upload: 5 per minute per user */
  upload: { maxRequests: 5, windowMs: 60_000 },
  /** Location/geocoding: 20 per minute per user (calls Google API) */
  location: { maxRequests: 20, windowMs: 60_000 },
} as const;

type Bucket = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

const globalStore = globalThis as unknown as {
  __rateLimitStore?: Map<string, Bucket>;
};

function getStore(): Map<string, Bucket> {
  if (!globalStore.__rateLimitStore) {
    globalStore.__rateLimitStore = new Map<string, Bucket>();
  }
  return globalStore.__rateLimitStore;
}

function pruneExpired(store: Map<string, Bucket>, now: number) {
  if (store.size < 5000) return;
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  const store = getStore();

  pruneExpired(store, now);

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      retryAfterMs: 0
    };
  }

  if (existing.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(existing.resetAt - now, 0)
    };
  }

  existing.count += 1;
  store.set(key, existing);

  return {
    allowed: true,
    remaining: Math.max(limit - existing.count, 0),
    retryAfterMs: 0
  };
}

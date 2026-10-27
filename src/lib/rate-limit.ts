import { NextRequest } from "next/server";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();
const MAX_ENTRIES = 5_000;
let nextCleanupAt = 0;

export function clientAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** A lightweight per-instance guard. Use an edge-backed store or CAPTCHA for global protection at scale. */
export function isRateLimited(request: NextRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  if (now >= nextCleanupAt || store.size >= MAX_ENTRIES) {
    for (const [storedKey, entry] of store) {
      if (entry.resetAt <= now) store.delete(storedKey);
    }
    while (store.size >= MAX_ENTRIES) {
      const oldestKey = store.keys().next().value as string | undefined;
      if (!oldestKey) break;
      store.delete(oldestKey);
    }
    nextCleanupAt = now + 60_000;
  }
  const key = `${scope}:${clientAddress(request)}`;
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

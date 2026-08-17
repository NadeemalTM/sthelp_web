import { NextRequest } from "next/server";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function clientAddress(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** A lightweight per-instance guard. Use an edge-backed store or CAPTCHA for global protection at scale. */
export function isRateLimited(request: NextRequest, scope: string, limit: number, windowMs: number) {
  const now = Date.now();
  const key = `${scope}:${clientAddress(request)}`;
  const current = store.get(key);
  if (!current || current.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count > limit;
}

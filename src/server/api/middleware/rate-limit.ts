import type { Context } from "hono";
import { createMiddleware } from "hono/factory";

import { jsonError } from "../response";
import type { ApiContext, RateLimitInfo } from "../types";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 120;

type RateState = {
  windowStart: number;
  hits: number;
};

const globalForRateLimit = globalThis as unknown as {
  apiRateLimit?: Map<string, RateState>;
};

const store = globalForRateLimit.apiRateLimit ?? new Map<string, RateState>();
globalForRateLimit.apiRateLimit ??= store;

const getKey = (c: Context<ApiContext>) => {
  const user = c.get("user");
  if (user?.id) {
    return `user:${user.id}`;
  }

  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) {
    return `ip:${forwarded.split(",")[0]!.trim()}`;
  }

  const realIp = c.req.header("x-real-ip");
  if (realIp) {
    return `ip:${realIp}`;
  }

  return `ip:${c.req.header("cf-connecting-ip") ?? "anonymous"}`;
};

const attachMetadata = (c: Context<ApiContext>, info: RateLimitInfo) => {
  c.set("rateLimit", info);
  c.header("x-rate-limit-limit", info.limit.toString());
  c.header("x-rate-limit-remaining", info.remaining.toString());
  c.header("x-rate-limit-reset", info.resetAt.getTime().toString());
};

export const rateLimit = createMiddleware<ApiContext>(async (c, next) => {
  const key = getKey(c);
  const now = Date.now();
  const existing = store.get(key);

  if (!existing || now - existing.windowStart >= WINDOW_MS) {
    store.set(key, { windowStart: now, hits: 1 });
  } else {
    if (existing.hits >= MAX_REQUESTS) {
      const resetAt = new Date(existing.windowStart + WINDOW_MS);
      attachMetadata(c, {
        limit: MAX_REQUESTS,
        remaining: 0,
        resetAt,
      });
      return jsonError(c, "Too Many Requests", 429, "RATE_LIMITED");
    }

    existing.hits += 1;
    store.set(key, existing);
  }

  const current = store.get(key)!;
  const resetAt = new Date(current.windowStart + WINDOW_MS);
  const remaining = Math.max(0, MAX_REQUESTS - current.hits);

  attachMetadata(c, {
    limit: MAX_REQUESTS,
    remaining,
    resetAt,
  });

  await next();
});

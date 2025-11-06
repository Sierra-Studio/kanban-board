import type { Context } from "hono";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyApiContext = Context<any>;

export function jsonSuccess<T>(
  c: AnyApiContext,
  data: T,
  status = 200,
) {
  return c.json({ data, success: true }, status as never);
}

export function jsonList<T>(
  c: AnyApiContext,
  data: T[],
  total: number,
  page: number,
  status = 200,
) {
  return c.json({ data, total, page, success: true }, status as never);
}

export function jsonError(
  c: AnyApiContext,
  error: string,
  status = 400,
  code?: string,
) {
  const body = code ? { error, code, success: false } : { error, success: false };
  return c.json(body, status as never);
}

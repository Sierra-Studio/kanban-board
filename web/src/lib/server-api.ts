import { cookies } from "next/headers";

import type { BoardDetail, BoardSummary, Session } from "~/lib/types";

/**
 * Base URL used for server-side (SSR / middleware) calls to the API. Inside
 * Docker this must be the internal service URL (e.g. http://api:8000), which is
 * different from the browser-facing NEXT_PUBLIC_API_URL (e.g. http://localhost:8000).
 */
const SERVER_API_BASE_URL =
  process.env.INTERNAL_API_URL ??
  process.env.NEXT_PUBLIC_API_URL ??
  "http://localhost:8000";

/**
 * Server-side fetch helper for React Server Components. Forwards the browser's
 * session cookie to the Python API so requests are authenticated.
 */
async function serverFetch<T>(path: string): Promise<T | null> {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();

  try {
    const response = await fetch(`${SERVER_API_BASE_URL}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : {},
      cache: "no-store",
    });

    const data = (await response.json().catch(() => null)) as
      | { success: true; data: T }
      | { success: false }
      | null;

    if (!response.ok || data?.success !== true) {
      return null;
    }

    return data.data;
  } catch (error) {
    console.error(`Server API request failed: ${path}`, error);
    return null;
  }
}

export async function getSession(): Promise<Session | null> {
  return await serverFetch<Session | null>("/api/auth/get-session");
}

export async function getBoards(): Promise<BoardSummary[]> {
  const boards = await serverFetch<BoardSummary[]>("/api/boards");
  return boards ?? [];
}

export async function getBoardDetail(
  boardId: string,
): Promise<BoardDetail | null> {
  return await serverFetch<BoardDetail>(`/api/boards/${boardId}`);
}

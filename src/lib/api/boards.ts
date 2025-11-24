"use client";

import { peekSessionStatus } from "~/lib/auth-client";

export type SuccessResponse<T> = {
  success: true;
  data: T;
};

export type ErrorResponse = {
  success: false;
  error: string;
  code?: string;
};

export type ApiResponse<T> = SuccessResponse<T> | ErrorResponse;

export async function apiFetch<T>(url: string, init?: RequestInit): Promise<T> {
  await peekSessionStatus();

  const response = await fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "include",
  });

  const data = (await response.json()) as ApiResponse<T>;

  if (!response.ok || data.success !== true) {
    const message = "error" in data ? data.error : response.statusText;
    throw new Error(message || "Request failed");
  }

  return data.data;
}

export type CreateBoardPayload = {
  title: string;
  description?: string;
};

export type BoardSummaryResponse = {
  board: {
    id: string;
    title: string;
    description: string | null;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
    role: string;
    memberCount: number;
    columnCount: number;
  };
};

export type BoardDetailResponse = {
  board: BoardSummaryResponse["board"];
  columns: Array<{
    id: string;
    name: string;
    position: number;
    isCollapsed: boolean;
    createdAt: string;
    updatedAt: string;
  }>;
};

export async function createBoard(payload: CreateBoardPayload) {
  const result = await apiFetch<BoardDetailResponse>("/api/boards", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result;
}

export async function archiveBoard(boardId: string, isArchived: boolean) {
  const result = await apiFetch<BoardSummaryResponse>(`/api/boards/${boardId}/archive`, {
    method: "POST",
    body: JSON.stringify({ isArchived }),
  });

  return result.board;
}

export async function duplicateBoard(boardId: string, title?: string) {
  const result = await apiFetch<BoardDetailResponse>(`/api/boards/${boardId}/duplicate`, {
    method: "POST",
    body: JSON.stringify({ title }),
  });

  return result;
}

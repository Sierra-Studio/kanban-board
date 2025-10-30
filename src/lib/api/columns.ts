"use client";

import { apiFetch } from "./boards";

export type ColumnResponse = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  createdAt: string;
  updatedAt: string;
  cardCount: number;
};

export async function renameColumnRequest(columnId: string, name: string) {
  const result = await apiFetch<{ column: ColumnResponse }>(`/api/columns/${columnId}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });

  return result.column;
}

export async function toggleColumnCollapseRequest(columnId: string, isCollapsed: boolean) {
  const result = await apiFetch<{ column: ColumnResponse }>(
    `/api/columns/${columnId}/collapse`,
    {
      method: "POST",
      body: JSON.stringify({ isCollapsed }),
    },
  );

  return result.column;
}

export async function reorderColumnsRequest(boardId: string, columnIds: string[]) {
  const result = await apiFetch<{ columns: ColumnResponse[] }>(`/api/columns/reorder`, {
    method: "POST",
    body: JSON.stringify({ boardId, columnIds }),
  });

  return result.columns;
}

"use client";

import { apiFetch } from "./boards";

export type CardResponse = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

export async function createCardRequest(columnId: string, payload: { title: string; description?: string }) {
  const result = await apiFetch<{ card: CardResponse }>(`/api/columns/${columnId}/cards`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.card;
}

export async function listCardsRequest(columnId: string) {
  const result = await apiFetch<{ cards: CardResponse[] }>(`/api/columns/${columnId}/cards`, {
    method: "GET",
  });

  return result.cards;
}

export async function updateCardRequest(cardId: string, payload: { title?: string; description?: string | null }) {
  const result = await apiFetch<{ card: CardResponse }>(`/api/cards/${cardId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  return result.card;
}

export async function deleteCardRequest(cardId: string) {
  await apiFetch<{ deleted: boolean }>(`/api/cards/${cardId}`, {
    method: "DELETE",
  });
}

export async function moveCardRequest(cardId: string, payload: { toColumnId: string; index: number }) {
  const result = await apiFetch<{ card: CardResponse }>(`/api/cards/${cardId}/move`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return result.card;
}

export async function reorderCardsRequest(columnId: string, cardIds: string[]) {
  const result = await apiFetch<{ cards: CardResponse[] }>(`/api/cards/reorder`, {
    method: "POST",
    body: JSON.stringify({ columnId, cardIds }),
  });

  return result.cards;
}

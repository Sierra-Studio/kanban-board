import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { cards, columns } from "~/server/db/schema";

import { ServiceError } from "./errors";

const POSITION_GAP = 1000;

type CardRecord = typeof cards.$inferSelect;

export type CardSummary = {
  id: string;
  columnId: string;
  title: string;
  description: string | null;
  position: number;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

function mapCard(record: CardRecord): CardSummary {
  return {
    id: record.id,
    columnId: record.columnId,
    title: record.title,
    description: record.description ?? null,
    position: record.position,
    createdBy: record.createdBy,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

async function getColumnBoard(columnId: string) {
  const [row] = await db
    .select({
      column: columns,
    })
    .from(columns)
    .where(eq(columns.id, columnId))
    .limit(1);

  if (!row) {
    throw new ServiceError("Column not found", 404, "COLUMN_NOT_FOUND");
  }

  return row.column;
}

async function getCard(cardId: string) {
  const [row] = await db
    .select()
    .from(cards)
    .where(eq(cards.id, cardId))
    .limit(1);

  return row ?? null;
}

export async function listCards(columnId: string, userId: string) {
  const rows = await db
    .select()
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(asc(cards.position));

  return rows.map(mapCard);
}

export async function createCard(
  columnId: string,
  userId: string,
  data: { title: string; description?: string | null },
) {
  const column = await getColumnBoard(columnId);

  const trimmed = data.title.trim();
  if (!trimmed || trimmed.length > 500) {
    throw new ServiceError("Invalid card title", 400, "INVALID_CARD_TITLE");
  }

  let description: string | null = null;
  if (data.description !== undefined) {
    const trimmedDescription = data.description?.trim() ?? "";
    if (trimmedDescription.length > 10_000) {
      throw new ServiceError("Description too long", 400, "INVALID_CARD_DESCRIPTION");
    }
    description = trimmedDescription ? trimmedDescription : null;
  }

  const [lastCard] = await db
    .select({ position: cards.position })
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(desc(cards.position))
    .limit(1);

  const position = lastCard ? lastCard.position + POSITION_GAP : POSITION_GAP;

  const [created] = await db
    .insert(cards)
    .values({
      columnId,
      title: trimmed,
      description,
      position,
      createdBy: userId,
    })
    .returning();

  if (!created) {
    throw new ServiceError("Failed to create card", 500, "CARD_CREATE_FAILED");
  }

  return mapCard(created);
}

export async function getCardDetail(cardId: string, userId: string) {
  const card = await getCard(cardId);
  if (!card) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  return mapCard(card);
}

export async function updateCard(
  cardId: string,
  userId: string,
  data: { title?: string; description?: string | null },
) {
  const card = await getCard(cardId);
  if (!card) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  const updates: Partial<typeof cards.$inferInsert> = {};
  if (data.title !== undefined) {
    const trimmed = data.title.trim();
    if (!trimmed || trimmed.length > 500) {
      throw new ServiceError("Invalid card title", 400, "INVALID_CARD_TITLE");
    }
    updates.title = trimmed;
  }
  if (data.description !== undefined) {
    const trimmedDescription = data.description?.trim() ?? "";
    if (trimmedDescription.length > 10_000) {
      throw new ServiceError("Description too long", 400, "INVALID_CARD_DESCRIPTION");
    }
    updates.description = trimmedDescription ? trimmedDescription : null;
  }

  if (Object.keys(updates).length === 0) {
    return mapCard(card);
  }

  const [updated] = await db
    .update(cards)
    .set(updates)
    .where(eq(cards.id, cardId))
    .returning();

  if (!updated) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  return mapCard(updated);
}

export async function deleteCard(cardId: string, userId: string) {
  const card = await getCard(cardId);
  if (!card) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  await db.delete(cards).where(eq(cards.id, cardId));
}

export async function moveCard(
  cardId: string,
  userId: string,
  targetColumnId: string,
  positionIndex: number,
) {
  const card = await getCard(cardId);
  if (!card) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  const sourceColumn = await getColumnBoard(card.columnId);
  const targetColumn = await getColumnBoard(targetColumnId);

  if (sourceColumn.boardId !== targetColumn.boardId) {
    throw new ServiceError("Cannot move card across boards", 400, "CARD_CROSS_BOARD_MOVE");
  }

  const position = await calculatePosition(targetColumnId, positionIndex);

  const [updated] = await db
    .update(cards)
    .set({
      columnId: targetColumnId,
      position,
    })
    .where(eq(cards.id, cardId))
    .returning();

  if (!updated) {
    throw new ServiceError("Card not found", 404, "CARD_NOT_FOUND");
  }

  return mapCard(updated);
}

async function calculatePosition(columnId: string, index: number) {
  const ordered = await db
    .select({ id: cards.id, position: cards.position })
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(asc(cards.position));

  if (ordered.length === 0) {
    return POSITION_GAP;
  }

  // Always maintain fixed gaps - just rebalance all positions
  // The new card will be inserted at the given index
  await rebalancePositions(columnId, ordered);

  // Return the position for the new card at the specified index
  return (index + 1) * POSITION_GAP;
}

async function rebalancePositions(columnId: string, rows?: { id: string; position: number }[]) {
  const list =
    rows ??
    (await db
      .select({ id: cards.id, position: cards.position })
      .from(cards)
      .where(eq(cards.columnId, columnId))
      .orderBy(asc(cards.position)));

  await db.transaction(async (tx) => {
    for (let index = 0; index < list.length; index += 1) {
      const card = list[index]!;
      const newPosition = (index + 1) * POSITION_GAP;
      await tx
        .update(cards)
        .set({ position: newPosition })
        .where(eq(cards.id, card.id));
    }
  });
}

export async function reorderCards(
  columnId: string,
  userId: string,
  orderedCardIds: string[],
) {
  if (!Array.isArray(orderedCardIds) || orderedCardIds.length === 0) {
    throw new ServiceError("No cards provided", 400, "INVALID_CARD_ORDER");
  }

  const existing = await db
    .select({ id: cards.id })
    .from(cards)
    .where(eq(cards.columnId, columnId));

  const existingIds = existing.map((card) => card.id);
  if (existingIds.length !== orderedCardIds.length) {
    throw new ServiceError("Card order mismatch", 400, "INVALID_CARD_ORDER");
  }

  const invalid = orderedCardIds.some((id) => !existingIds.includes(id));
  if (invalid) {
    throw new ServiceError("Invalid card identifiers", 400, "INVALID_CARD_ORDER");
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedCardIds.length; index += 1) {
      const cardId = orderedCardIds[index]!;
      const newPosition = (index + 1) * POSITION_GAP;
      await tx
        .update(cards)
        .set({ position: newPosition })
        .where(and(eq(cards.id, cardId), eq(cards.columnId, columnId)));
    }
  });

  const reordered = await db
    .select()
    .from(cards)
    .where(eq(cards.columnId, columnId))
    .orderBy(asc(cards.position));

  return reordered.map(mapCard);
}

export async function duplicateCards(sourceBoardId: string, targetBoardId: string) {
  if (sourceBoardId === targetBoardId) return;

  const sourceColumns = await db
    .select({ id: columns.id, position: columns.position })
    .from(columns)
    .where(eq(columns.boardId, sourceBoardId));

  if (sourceColumns.length === 0) return;

  const targetColumns = await db
    .select({ id: columns.id, position: columns.position })
    .from(columns)
    .where(eq(columns.boardId, targetBoardId));

  const targetByPosition = new Map<number, string>();
  for (const column of targetColumns) {
    targetByPosition.set(column.position, column.id);
  }

  for (const sourceColumn of sourceColumns) {
    const targetColumnId = targetByPosition.get(sourceColumn.position);
    if (!targetColumnId) continue;

    const sourceCards = await db
      .select()
      .from(cards)
      .where(eq(cards.columnId, sourceColumn.id))
      .orderBy(asc(cards.position));

    if (sourceCards.length === 0) continue;

    await db.insert(cards).values(
      sourceCards.map((card) => ({
        columnId: targetColumnId,
        title: card.title,
        description: card.description,
        position: card.position,
        createdBy: card.createdBy,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      })),
    );
  }
}
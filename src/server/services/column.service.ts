import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import { cards, columns } from "~/server/db/schema";

import { assertRole, getBoardAccess } from "./board-access";
import { ServiceError } from "./errors";
import { canEditColumns, canViewBoard } from "./permissions/board";

type ColumnRecord = typeof columns.$inferSelect;

export type ColumnWithMeta = {
  id: string;
  boardId: string;
  name: string;
  position: number;
  isCollapsed: boolean;
  createdAt: Date;
  updatedAt: Date;
  cardCount: number;
};

export function mapColumnRecord(record: ColumnRecord, cardCount = 0): ColumnWithMeta {
  return {
    id: record.id,
    boardId: record.boardId,
    name: record.name,
    position: record.position,
    isCollapsed: record.isCollapsed,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    cardCount,
  };
}

async function getColumn(columnId: string) {
  const [record] = await db
    .select()
    .from(columns)
    .where(eq(columns.id, columnId))
    .limit(1);

  return record ?? null;
}

async function getColumnCardCount(columnId: string) {
  const result = await db
    .select({ value: sql<number>`count(*)` })
    .from(cards)
    .where(eq(cards.columnId, columnId));

  return Number(result[0]?.value ?? 0);
}

export async function listBoardColumns(boardId: string, userId: string) {
  const { membership } = await getBoardAccess(boardId, userId);
  assertRole(membership.role, canViewBoard, "Forbidden", "BOARD_FORBIDDEN");

  const rows = await db
    .select({
      column: columns,
      cardCount: sql<number>`(
        select count(*) from ${cards} where ${cards.columnId} = ${columns.id}
      )`,
    })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  return rows.map(({ column, cardCount }) => mapColumnRecord(column, Number(cardCount ?? 0)));
}

export async function renameColumn(columnId: string, userId: string, name: string) {
  const column = await getColumn(columnId);
  if (!column) {
    throw new ServiceError("Column not found", 404, "COLUMN_NOT_FOUND");
  }

  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    throw new ServiceError("Invalid column name", 400, "INVALID_COLUMN_NAME");
  }

  const { membership } = await getBoardAccess(column.boardId, userId);
  assertRole(membership.role, canEditColumns, "Insufficient permissions", "COLUMN_FORBIDDEN");

  const [updated] = await db
    .update(columns)
    .set({ name: trimmed })
    .where(eq(columns.id, columnId))
    .returning();

  if (!updated) {
    throw new ServiceError("Column not found", 404, "COLUMN_NOT_FOUND");
  }

  const cardCount = await getColumnCardCount(columnId);

  return mapColumnRecord(updated, cardCount);
}

export async function toggleColumnCollapse(
  columnId: string,
  userId: string,
  isCollapsed: boolean,
) {
  const column = await getColumn(columnId);
  if (!column) {
    throw new ServiceError("Column not found", 404, "COLUMN_NOT_FOUND");
  }

  const { membership } = await getBoardAccess(column.boardId, userId);
  assertRole(membership.role, canEditColumns, "Insufficient permissions", "COLUMN_FORBIDDEN");

  const [updated] = await db
    .update(columns)
    .set({ isCollapsed })
    .where(eq(columns.id, columnId))
    .returning();

  if (!updated) {
    throw new ServiceError("Column not found", 404, "COLUMN_NOT_FOUND");
  }

  const cardCount = await getColumnCardCount(columnId);

  return mapColumnRecord(updated, cardCount);
}

export async function reorderColumns(
  boardId: string,
  userId: string,
  orderedColumnIds: string[],
) {
  if (!Array.isArray(orderedColumnIds) || orderedColumnIds.length === 0) {
    throw new ServiceError("No columns provided", 400, "INVALID_COLUMN_ORDER");
  }

  const { membership } = await getBoardAccess(boardId, userId);
  assertRole(membership.role, canEditColumns, "Insufficient permissions", "COLUMN_REORDER_FORBIDDEN");

  const existing = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  const existingIds = existing.map((column) => column.id);

  if (existingIds.length !== orderedColumnIds.length) {
    throw new ServiceError("Column order mismatch", 400, "INVALID_COLUMN_ORDER");
  }

  const mismatched = orderedColumnIds.some((id) => !existingIds.includes(id));
  if (mismatched) {
    throw new ServiceError("Invalid column identifiers", 400, "INVALID_COLUMN_ORDER");
  }

  await db.transaction(async (tx) => {
    for (let index = 0; index < orderedColumnIds.length; index += 1) {
      const columnId = orderedColumnIds[index]!;
      const newPosition = (index + 1) * 1000;

      await tx
        .update(columns)
        .set({ position: newPosition })
        .where(and(eq(columns.id, columnId), eq(columns.boardId, boardId)));
    }
  });

  const reordered = await db
    .select({
      column: columns,
      cardCount: sql<number>`(
        select count(*) from ${cards} where ${cards.columnId} = ${columns.id}
      )`,
    })
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  return reordered.map(({ column, cardCount }) => mapColumnRecord(column, Number(cardCount ?? 0)));
}

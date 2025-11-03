import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  boards,
  columns,
  user,
} from "~/server/db/schema";

import { ServiceError } from "./errors";
import { getUserSafe } from "./user.service";
import {
  listBoardColumns,
  mapColumnRecord,
  type ColumnWithMeta,
} from "./column.service";
import { duplicateCards, listCards, type CardSummary } from "./card.service";

const DEFAULT_COLUMNS = [
  { name: "To Do", position: 1000 },
  { name: "In Progress", position: 2000 },
  { name: "Done", position: 3000 },
];

type BoardRecord = typeof boards.$inferSelect;
type ColumnRecord = typeof columns.$inferSelect;

export type BoardSummary = {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  columnCount: number;
};

export type BoardColumnDetail = ColumnWithMeta & {
  cards: CardSummary[];
};

export type BoardDetail = {
  board: BoardSummary;
  columns: BoardColumnDetail[];
};

function mapBoardSummary(
  record: BoardRecord,
  columnCount: number,
): BoardSummary {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? null,
    isArchived: record.isArchived,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    columnCount,
  };
}

async function getBoardById(boardId: string): Promise<BoardRecord> {
  const [board] = await db
    .select()
    .from(boards)
    .where(eq(boards.id, boardId))
    .limit(1);

  if (!board) {
    throw new ServiceError("Board not found", 404, "BOARD_NOT_FOUND");
  }

  return board;
}

function assertOwner(board: BoardRecord, userId: string) {
  if (board.userId !== userId) {
    throw new ServiceError("Only the board owner can perform this action", 403, "BOARD_OWNER_REQUIRED");
  }
}

export async function listBoardsForUser(userId: string) {
  const rows = await db
    .select({
      board: boards,
      columnCount: sql<number>`(
        select count(*)
        from ${columns}
        where ${columns.boardId} = ${boards.id}
      )`,
    })
    .from(boards)
    .where(eq(boards.userId, userId))
    .orderBy(asc(boards.title));

  return rows.map((row) =>
    mapBoardSummary(
      row.board,
      Number(row.columnCount ?? 0),
    ),
  );
}

export async function createBoard({
  title,
  description,
  ownerId,
}: {
  title: string;
  description?: string | null;
  ownerId: string;
}): Promise<BoardDetail> {
  return db.transaction(async (tx) => {
    const [board] = await tx
      .insert(boards)
      .values({
        title,
        description: description ?? null,
        userId: ownerId,
      })
      .returning();

    if (!board) {
      throw new ServiceError("Failed to create board", 500, "BOARD_CREATE_FAILED");
    }

    const insertedColumns = await tx
      .insert(columns)
      .values(
        DEFAULT_COLUMNS.map((col) => ({
          boardId: board.id,
          name: col.name,
          position: col.position,
        })),
      )
      .returning();

    const summary = mapBoardSummary(board, insertedColumns.length);

    return {
      board: summary,
      columns: insertedColumns.map((column) => ({
        ...mapColumnRecord(column, 0),
        cards: [],
      })),
    };
  });
}

export async function getBoardDetail(boardId: string, userId: string): Promise<BoardDetail> {
  const board = await getBoardById(boardId);
  
  const columnsData = await listBoardColumns(boardId, userId);
  const columnsWithCards: BoardColumnDetail[] = await Promise.all(
    columnsData.map(async (column) => ({
      ...column,
      cards: await listCards(column.id, userId),
    })),
  );

  const summary = mapBoardSummary(board, columnsData.length);

  return {
    board: summary,
    columns: columnsWithCards,
  };
}

export async function updateBoard(
  boardId: string,
  userId: string,
  data: { title?: string; description?: string | null },
): Promise<BoardSummary> {
  const board = await getBoardById(boardId);
  assertOwner(board, userId);

  const [updated] = await db
    .update(boards)
    .set({
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
    })
    .where(eq(boards.id, boardId))
    .returning();

  if (!updated) {
    throw new ServiceError("Board not found", 404, "BOARD_NOT_FOUND");
  }

  const columnCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(columns)
    .where(eq(columns.boardId, boardId));

  return mapBoardSummary(
    updated,
    Number(columnCountResult[0]?.value ?? 0),
  );
}

export async function setBoardArchive(
  boardId: string,
  userId: string,
  isArchived: boolean,
): Promise<BoardSummary> {
  const board = await getBoardById(boardId);
  assertOwner(board, userId);

  const [updated] = await db
    .update(boards)
    .set({ isArchived })
    .where(eq(boards.id, boardId))
    .returning();

  if (!updated) {
    throw new ServiceError("Board not found", 404, "BOARD_NOT_FOUND");
  }

  const columnCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(columns)
    .where(eq(columns.boardId, boardId));

  return mapBoardSummary(
    updated,
    Number(columnCountResult[0]?.value ?? 0),
  );
}

export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  const board = await getBoardById(boardId);
  assertOwner(board, userId);

  await db.delete(boards).where(eq(boards.id, boardId));
}

export async function duplicateBoard(
  boardId: string,
  userId: string,
  options: { title?: string } = {},
): Promise<BoardDetail> {
  const board = await getBoardById(boardId);
  assertOwner(board, userId);

  const columnsData = await db
    .select()
    .from(columns)
    .where(eq(columns.boardId, boardId))
    .orderBy(asc(columns.position));

  const newBoardId = await db.transaction(async (tx) => {
    const [newBoard] = await tx
      .insert(boards)
      .values({
        title: options.title ?? `${board.title} (Copy)`,
        description: board.description,
        userId,
      })
      .returning();

    if (!newBoard) {
      throw new ServiceError("Failed to duplicate board", 500, "BOARD_DUPLICATE_FAILED");
    }

    if (columnsData.length > 0) {
      await tx.insert(columns).values(
        columnsData.map((column) => ({
          boardId: newBoard.id,
          name: column.name,
          position: column.position,
          isCollapsed: column.isCollapsed,
        })),
      );
    }

    return newBoard.id;
  });

  await duplicateCards(boardId, newBoardId);

  return await getBoardDetail(newBoardId, userId);
}
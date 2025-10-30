import { and, asc, eq, sql } from "drizzle-orm";

import { db } from "~/server/db";
import {
  boardMembers,
  boards,
  columns,
  type BoardRole,
  boardRoles,
  user,
} from "~/server/db/schema";

import { assertRole, getBoardAccess } from "./board-access";
import { ServiceError } from "./errors";
import {
  canDeleteBoard,
  canManageBoard,
  canManageMembers,
  canViewBoard,
  isOwner,
} from "./permissions/board";
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
type BoardMemberRecord = typeof boardMembers.$inferSelect;

export type BoardSummary = {
  id: string;
  title: string;
  description: string | null;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
  role: BoardRole;
  memberCount: number;
  columnCount: number;
};

export type BoardColumnDetail = ColumnWithMeta & {
  cards: CardSummary[];
};

export type BoardDetail = {
  board: BoardSummary;
  columns: BoardColumnDetail[];
};

export type BoardMemberInfo = {
  id: string;
  boardId: string;
  userId: string;
  role: BoardRole;
  name: string | null;
  email: string;
  image: string | null;
  joinedAt: Date;
};

const DEFAULT_MEMBER_COUNT = 1;

function mapBoardSummary(
  record: BoardRecord,
  role: BoardRole,
  memberCount: number,
  columnCount: number,
): BoardSummary {
  return {
    id: record.id,
    title: record.title,
    description: record.description ?? null,
    isArchived: record.isArchived,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    role,
    memberCount,
    columnCount,
  };
}

export async function listBoardsForUser(userId: string) {
  const rows = await db
    .select({
      board: boards,
      role: boardMembers.role,
      memberCount: sql<number>`(
        select count(*)
        from ${boardMembers}
        where ${boardMembers.boardId} = ${boards.id}
      )`,
      columnCount: sql<number>`(
        select count(*)
        from ${columns}
        where ${columns.boardId} = ${boards.id}
      )`,
    })
    .from(boardMembers)
    .innerJoin(boards, eq(boardMembers.boardId, boards.id))
    .where(eq(boardMembers.userId, userId))
    .orderBy(asc(boards.title));

  return rows.map((row) =>
    mapBoardSummary(
      row.board,
      row.role ?? "viewer",
      Number(row.memberCount ?? 0),
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

    await tx.insert(boardMembers).values({
      boardId: board.id,
      userId: ownerId,
      role: "owner",
    });

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

    const summary = mapBoardSummary(board, "owner", DEFAULT_MEMBER_COUNT, insertedColumns.length);

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
  const { board, membership } = await getBoardAccess(boardId, userId);

  if (!canViewBoard(membership.role)) {
    throw new ServiceError("Forbidden", 403, "BOARD_FORBIDDEN");
  }

  const columnsData = await listBoardColumns(boardId, userId);
  const columnsWithCards: BoardColumnDetail[] = await Promise.all(
    columnsData.map(async (column) => ({
      ...column,
      cards: await listCards(column.id, userId),
    })),
  );

  const memberCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

  const memberCount = Number(memberCountResult[0]?.value ?? 0);

  const summary = mapBoardSummary(board, membership.role, memberCount, columnsData.length);

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
  const { board, membership } = await getBoardAccess(boardId, userId);

  assertRole(membership.role, canManageBoard, "Insufficient permissions", "BOARD_UPDATE_FORBIDDEN");

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

  const memberCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

  const columnCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(columns)
    .where(eq(columns.boardId, boardId));

  return mapBoardSummary(
    updated,
    membership.role,
    Number(memberCountResult[0]?.value ?? 0),
    Number(columnCountResult[0]?.value ?? 0),
  );
}

export async function setBoardArchive(
  boardId: string,
  userId: string,
  isArchived: boolean,
): Promise<BoardSummary> {
  const { membership } = await getBoardAccess(boardId, userId);

  assertRole(membership.role, canManageBoard, "Insufficient permissions", "BOARD_ARCHIVE_FORBIDDEN");

  const [updated] = await db
    .update(boards)
    .set({ isArchived })
    .where(eq(boards.id, boardId))
    .returning();

  if (!updated) {
    throw new ServiceError("Board not found", 404, "BOARD_NOT_FOUND");
  }

  const memberCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(boardMembers)
    .where(eq(boardMembers.boardId, boardId));

  const columnCountResult = await db
    .select({ value: sql<number>`count(*)` })
    .from(columns)
    .where(eq(columns.boardId, boardId));

  return mapBoardSummary(
    updated,
    membership.role,
    Number(memberCountResult[0]?.value ?? 0),
    Number(columnCountResult[0]?.value ?? 0),
  );
}

export async function deleteBoard(boardId: string, userId: string): Promise<void> {
  const { membership } = await getBoardAccess(boardId, userId);

  assertRole(membership.role, canDeleteBoard, "Only owners can delete boards", "BOARD_DELETE_FORBIDDEN");

  await db.delete(boards).where(eq(boards.id, boardId));
}

export async function duplicateBoard(
  boardId: string,
  userId: string,
  options: { title?: string } = {},
): Promise<BoardDetail> {
  const { board, membership } = await getBoardAccess(boardId, userId);

  assertRole(membership.role, canManageBoard, "Insufficient permissions", "BOARD_DUPLICATE_FORBIDDEN");

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

    await tx.insert(boardMembers).values({
      boardId: newBoard.id,
      userId,
      role: "owner",
    });

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

export async function listBoardMembers(boardId: string, userId: string): Promise<BoardMemberInfo[]> {
  const { membership } = await getBoardAccess(boardId, userId);

  assertRole(membership.role, canViewBoard, "Forbidden", "BOARD_MEMBERS_FORBIDDEN");

  const rows = await db
    .select({
      member: boardMembers,
      user,
    })
    .from(boardMembers)
    .innerJoin(user, eq(boardMembers.userId, user.id))
    .where(eq(boardMembers.boardId, boardId))
    .orderBy(asc(user.name));

  return rows.map(({ member, user: userRecord }) => ({
    id: member.id,
    boardId: member.boardId,
    userId: member.userId,
    role: member.role,
    name: userRecord.name,
    email: userRecord.email,
    image: userRecord.image,
    joinedAt: member.joinedAt,
  }));
}

async function getMember(boardId: string, memberId: string) {
  const [row] = await db
    .select()
    .from(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, memberId)))
    .limit(1);

  return row ?? null;
}

export async function addBoardMember(
  boardId: string,
  userId: string,
  actorId: string,
  role: BoardRole,
): Promise<BoardMemberInfo> {
  const { membership } = await getBoardAccess(boardId, actorId);

  assertRole(membership.role, canManageMembers, "Insufficient permissions", "BOARD_MEMBER_FORBIDDEN");

  if (!boardRoles.includes(role)) {
    throw new ServiceError("Invalid role", 400, "INVALID_ROLE");
  }

  if (userId === actorId) {
    throw new ServiceError("Cannot change your own membership", 400, "BOARD_MEMBER_SELF");
  }

  const targetUser = await getUserSafe(userId);
  if (!targetUser) {
    throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
  }

  const existingMember = await getMember(boardId, userId);
  if (existingMember) {
    throw new ServiceError("User is already a member", 409, "BOARD_MEMBER_EXISTS");
  }

  const [inserted] = await db
    .insert(boardMembers)
    .values({
      boardId,
      userId,
      role,
    })
    .returning();

  if (!inserted) {
    throw new ServiceError("Failed to add member", 500, "BOARD_MEMBER_CREATE_FAILED");
  }

  return {
    id: inserted.id,
    boardId: inserted.boardId,
    userId: inserted.userId,
    role: inserted.role,
    name: targetUser.name,
    email: targetUser.email,
    image: targetUser.image,
    joinedAt: inserted.joinedAt,
  };
}

export async function updateBoardMemberRole(
  boardId: string,
  memberId: string,
  actorId: string,
  role: BoardRole,
): Promise<BoardMemberInfo> {
  if (!boardRoles.includes(role)) {
    throw new ServiceError("Invalid role", 400, "INVALID_ROLE");
  }

  const { membership } = await getBoardAccess(boardId, actorId);
  assertRole(membership.role, canManageMembers, "Insufficient permissions", "BOARD_MEMBER_FORBIDDEN");

  const target = await getMember(boardId, memberId);
  if (!target) {
    throw new ServiceError("Member not found", 404, "BOARD_MEMBER_NOT_FOUND");
  }

  if (isOwner(target.role) && !isOwner(membership.role)) {
    throw new ServiceError("Cannot modify the owner", 403, "BOARD_OWNER_MODIFY_FORBIDDEN");
  }

  const [updated] = await db
    .update(boardMembers)
    .set({ role })
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, memberId)))
    .returning();

  if (!updated) {
    throw new ServiceError("Member not found", 404, "BOARD_MEMBER_NOT_FOUND");
  }

  const targetUser = await getUserSafe(memberId);
  if (!targetUser) {
    throw new ServiceError("User not found", 404, "USER_NOT_FOUND");
  }

  return {
    id: updated.id,
    boardId: updated.boardId,
    userId: updated.userId,
    role: updated.role,
    name: targetUser.name,
    email: targetUser.email,
    image: targetUser.image,
    joinedAt: updated.joinedAt,
  };
}

export async function removeBoardMember(boardId: string, memberId: string, actorId: string) {
  const { membership } = await getBoardAccess(boardId, actorId);

  assertRole(membership.role, canManageMembers, "Insufficient permissions", "BOARD_MEMBER_FORBIDDEN");

  const target = await getMember(boardId, memberId);
  if (!target) {
    throw new ServiceError("Member not found", 404, "BOARD_MEMBER_NOT_FOUND");
  }

  if (isOwner(target.role)) {
    throw new ServiceError("Cannot remove the board owner", 403, "BOARD_OWNER_REMOVE_FORBIDDEN");
  }

  await db
    .delete(boardMembers)
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, memberId)));
}

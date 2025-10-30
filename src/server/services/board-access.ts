import { and, eq } from "drizzle-orm";

import { db } from "~/server/db";
import { boardMembers, boards, type BoardRole } from "~/server/db/schema";

import { ServiceError } from "./errors";

type BoardRecord = typeof boards.$inferSelect;
type BoardMemberRecord = typeof boardMembers.$inferSelect;

export type BoardAccess = {
  board: BoardRecord;
  membership: BoardMemberRecord;
};

export async function getBoardAccess(boardId: string, userId: string): Promise<BoardAccess> {
  const [result] = await db
    .select({
      board: boards,
      membership: boardMembers,
    })
    .from(boardMembers)
    .innerJoin(boards, eq(boardMembers.boardId, boards.id))
    .where(and(eq(boardMembers.boardId, boardId), eq(boardMembers.userId, userId)))
    .limit(1);

  if (!result) {
    throw new ServiceError("Board not found", 404, "BOARD_NOT_FOUND");
  }

  return {
    board: result.board,
    membership: result.membership,
  };
}

export function assertRole(
  role: BoardRole | null | undefined,
  predicate: (role: BoardRole | null | undefined) => boolean,
  message: string,
  code: string,
) {
  if (!predicate(role)) {
    throw new ServiceError(message, 403, code);
  }
}

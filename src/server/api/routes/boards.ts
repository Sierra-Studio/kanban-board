import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { boardRoles } from "~/server/db/schema";
import {
  addBoardMember,
  createBoard,
  deleteBoard,
  duplicateBoard,
  getBoardDetail,
  listBoardMembers,
  listBoardsForUser,
  removeBoardMember,
  setBoardArchive,
  updateBoard,
  updateBoardMemberRole,
} from "~/server/services/board.service";
import { listBoardColumns } from "~/server/services/column.service";
import { ServiceError } from "~/server/services/errors";

import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { jsonError, jsonList, jsonSuccess } from "../response";
import type { AuthContext } from "../types";

const boardRoutes = new Hono<AuthContext>();

const boardIdParams = z.object({
  id: z.string().min(1),
});

const boardMemberParams = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
});

const createBoardSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional(),
});

const updateBoardSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(2000).nullable().optional(),
});

const archiveSchema = z.object({
  isArchived: z.boolean(),
});

const duplicateSchema = z.object({
  title: z.string().min(1).max(255).optional(),
});

const memberRoleSchema = z.enum(boardRoles);

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: memberRoleSchema,
});

const updateMemberRoleSchema = z.object({
  role: memberRoleSchema,
});

function handleServiceError(c: Context<AuthContext>, error: unknown) {
  if (error instanceof ServiceError) {
    return jsonError(c, error.message, error.status, error.code);
  }

  throw error;
}

boardRoutes.use("*", authMiddleware);
boardRoutes.use("*", rateLimit);

boardRoutes.get("/", async (c) => {
  try {
    const user = c.get("user");
    const boards = await listBoardsForUser(user.id);
    // For now, we don't have pagination implemented, so we return page 1 with all results
    return jsonList(c, boards, boards.length, 1);
  } catch (error) {
    return handleServiceError(c, error);
  }
});

boardRoutes.post("/", zValidator("json", createBoardSchema), async (c) => {
  try {
    const user = c.get("user");
    const body = c.req.valid("json");
    const result = await createBoard({
      title: body.title,
      description: body.description,
      ownerId: user.id,
    });

    return jsonSuccess(c, result, 201);
  } catch (error) {
    return handleServiceError(c, error);
  }
});

boardRoutes.get(
  "/:id",
  zValidator("param", boardIdParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const board = await getBoardDetail(id, user.id);
      return jsonSuccess(c, board);
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.patch(
  "/:id",
  zValidator("param", boardIdParams),
  zValidator("json", updateBoardSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const updates = c.req.valid("json");
      const board = await updateBoard(id, user.id, updates);
      return jsonSuccess(c, { board });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.post(
  "/:id/archive",
  zValidator("param", boardIdParams),
  zValidator("json", archiveSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { isArchived } = c.req.valid("json");
      const user = c.get("user");
      const board = await setBoardArchive(id, user.id, isArchived);
      return jsonSuccess(c, { board });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.post(
  "/:id/duplicate",
  zValidator("param", boardIdParams),
  zValidator("json", duplicateSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const body = c.req.valid("json");
      const duplicated = await duplicateBoard(id, user.id, body);
      return jsonSuccess(c, duplicated, 201);
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.get(
  "/:id/columns",
  zValidator("param", boardIdParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const columns = await listBoardColumns(id, user.id);
      return jsonSuccess(c, { columns });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.delete(
  "/:id",
  zValidator("param", boardIdParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      await deleteBoard(id, user.id);
      return jsonSuccess(c, { deleted: true });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.get(
  "/:id/members",
  zValidator("param", boardIdParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const members = await listBoardMembers(id, user.id);
      return jsonSuccess(c, { members });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.post(
  "/:id/members",
  zValidator("param", boardIdParams),
  zValidator("json", addMemberSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { userId, role } = c.req.valid("json");
      const actor = c.get("user");
      const member = await addBoardMember(id, userId, actor.id, role);
      return jsonSuccess(c, { member }, 201);
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.patch(
  "/:id/members/:userId",
  zValidator("param", boardMemberParams),
  zValidator("json", updateMemberRoleSchema),
  async (c) => {
    try {
      const { id, userId } = c.req.valid("param");
      const { role } = c.req.valid("json");
      const actor = c.get("user");
      const member = await updateBoardMemberRole(id, userId, actor.id, role);
      return jsonSuccess(c, { member });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

boardRoutes.delete(
  "/:id/members/:userId",
  zValidator("param", boardMemberParams),
  async (c) => {
    try {
      const { id, userId } = c.req.valid("param");
      const actor = c.get("user");
      await removeBoardMember(id, userId, actor.id);
      return jsonSuccess(c, { removed: true });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

export { boardRoutes };

import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { ServiceError } from "~/server/services/errors";
import {
  listBoardColumns,
  renameColumn,
  reorderColumns,
  toggleColumnCollapse,
} from "~/server/services/column.service";

import { jsonError, jsonSuccess } from "../response";
import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import type { AuthContext } from "../types";

const boardColumnsRoutes = new Hono<AuthContext>();
const columnRoutes = new Hono<AuthContext>();

const boardParams = z.object({
  id: z.string().min(1),
});

const columnParams = z.object({
  id: z.string().min(1),
});

const reorderColumnsSchema = z.object({
  boardId: z.string().min(1),
  columnIds: z.array(z.string().min(1)).min(1),
});

const renameColumnSchema = z.object({
  name: z.string().min(1).max(100),
});

const toggleCollapseSchema = z.object({
  isCollapsed: z.boolean(),
});


boardColumnsRoutes.use("*", authMiddleware);
boardColumnsRoutes.use("*", rateLimit);

columnRoutes.use("*", authMiddleware);
columnRoutes.use("*", rateLimit);

function handleServiceError(c: Context<AuthContext>, error: unknown) {
  if (error instanceof ServiceError) {
    return jsonError(c, error.message, error.status, error.code);
  }

  throw error;
}

boardColumnsRoutes.get(
  "/:id/columns",
  zValidator("param", boardParams),
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

boardColumnsRoutes.post(
  "/:id/columns",
  zValidator("param", boardParams),
  async (c) => {
    void c.req.valid("param");
    return jsonError(c, "Column creation is not available", 405, "COLUMN_CREATE_DISABLED");
  },
);

columnRoutes.patch(
  "/:id",
  zValidator("param", columnParams),
  zValidator("json", renameColumnSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { name } = c.req.valid("json");
      const user = c.get("user");
      const column = await renameColumn(id, user.id, name);
      return jsonSuccess(c, { column });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

columnRoutes.delete(
  "/:id",
  zValidator("param", columnParams),
  async (c) => {
    void c.req.valid("param");
    return jsonError(c, "Column deletion is not available", 405, "COLUMN_DELETE_DISABLED");
  },
);

columnRoutes.post(
  "/reorder",
  zValidator("json", reorderColumnsSchema),
  async (c) => {
    try {
      const { boardId, columnIds } = c.req.valid("json");
      const user = c.get("user");
      const columns = await reorderColumns(boardId, user.id, columnIds);
      return jsonSuccess(c, { columns });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

columnRoutes.post(
  "/:id/collapse",
  zValidator("param", columnParams),
  zValidator("json", toggleCollapseSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { isCollapsed } = c.req.valid("json");
      const user = c.get("user");
      const column = await toggleColumnCollapse(id, user.id, isCollapsed);
      return jsonSuccess(c, { column });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

export { boardColumnsRoutes, columnRoutes };

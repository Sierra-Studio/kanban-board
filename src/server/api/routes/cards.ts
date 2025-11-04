import { Hono, type Context } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import {
  createCard,
  deleteCard,
  getCardDetail,
  listCards,
  moveCard,
  reorderCards,
  updateCard,
} from "~/server/services/card.service";
import { ServiceError } from "~/server/services/errors";

import { jsonError, jsonSuccess } from "../response";
import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import type { AuthContext } from "../types";

const columnCardRoutes = new Hono<AuthContext>();
const cardRoutes = new Hono<AuthContext>();

const columnParams = z.object({
  columnId: z.string().min(1),
});

const cardParams = z.object({
  id: z.string().min(1),
});

const createCardSchema = z.object({
  title: z.string().trim().min(1).max(500),
  description: z.string().max(10_000).optional(),
});

const updateCardSchema = z.object({
  title: z.string().trim().min(1).max(500).optional(),
  description: z.string().max(10_000).nullable().optional(),
});

const moveCardSchema = z.object({
  toColumnId: z.string().min(1),
  index: z.number().int().nonnegative(),
});

columnCardRoutes.use("*", authMiddleware);
columnCardRoutes.use("*", rateLimit);

cardRoutes.use("*", authMiddleware);
cardRoutes.use("*", rateLimit);

const reorderCardsSchema = z.object({
  columnId: z.string().min(1),
  cardIds: z.array(z.string().min(1)).min(1),
});

function handleServiceError(c: Context<AuthContext>, error: unknown) {
  if (error instanceof ServiceError) {
    return jsonError(c, error.message, error.status, error.code);
  }

  throw error;
}

columnCardRoutes.get(
  "/:columnId/cards",
  zValidator("param", columnParams),
  async (c) => {
    try {
      const { columnId } = c.req.valid("param");
      const user = c.get("user");
      const cards = await listCards(columnId, user.id);
      return jsonSuccess(c, { cards });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

columnCardRoutes.post(
  "/:columnId/cards",
  zValidator("param", columnParams),
  zValidator("json", createCardSchema),
  async (c) => {
    try {
      const { columnId } = c.req.valid("param");
      const user = c.get("user");
      const body = c.req.valid("json");
      const card = await createCard(columnId, user.id, body);
      return jsonSuccess(c, { card }, 201);
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

cardRoutes.get(
  "/:id",
  zValidator("param", cardParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const card = await getCardDetail(id, user.id);
      return jsonSuccess(c, { card });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

cardRoutes.patch(
  "/:id",
  zValidator("param", cardParams),
  zValidator("json", updateCardSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      const updates = c.req.valid("json");
      const card = await updateCard(id, user.id, updates);
      return jsonSuccess(c, { card });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

cardRoutes.delete(
  "/:id",
  zValidator("param", cardParams),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const user = c.get("user");
      await deleteCard(id, user.id);
      return jsonSuccess(c, {});
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

cardRoutes.post(
  "/:id/move",
  zValidator("param", cardParams),
  zValidator("json", moveCardSchema),
  async (c) => {
    try {
      const { id } = c.req.valid("param");
      const { toColumnId, index } = c.req.valid("json");
      const user = c.get("user");
      const card = await moveCard(id, user.id, toColumnId, index);
      return jsonSuccess(c, { card });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

cardRoutes.post(
  "/reorder",
  zValidator("json", reorderCardsSchema),
  async (c) => {
    try {
      const { columnId, cardIds } = c.req.valid("json");
      const user = c.get("user");
      const cards = await reorderCards(columnId, user.id, cardIds);
      return jsonSuccess(c, { cards });
    } catch (error) {
      return handleServiceError(c, error);
    }
  },
);

export { cardRoutes, columnCardRoutes };

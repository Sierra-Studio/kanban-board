import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { jsonError, jsonSuccess } from "../response";
import type { AuthContext } from "../types";
import { getUserById, updateUserProfile } from "~/server/services/user.service";

const userRoutes = new Hono<AuthContext>();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().nullable().optional(),
});

userRoutes.use("*", authMiddleware);
userRoutes.use("*", rateLimit);

userRoutes.get("/me", async (c) => {
  const sessionUser = c.get("user");
  const userRecord = await getUserById(sessionUser.id);

  const payload = userRecord ?? {
    id: sessionUser.id,
    email: sessionUser.email,
    name: sessionUser.name,
    image: sessionUser.image,
    emailVerified: sessionUser.emailVerified,
    createdAt: sessionUser.createdAt,
  };

  return jsonSuccess(c, { user: payload });
});

userRoutes.patch(
  "/me",
  zValidator("json", updateProfileSchema),
  async (c) => {
    const sessionUser = c.get("user");
    const updates = c.req.valid("json");

    const updated = await updateUserProfile(sessionUser.id, updates);

    if (!updated) {
      return jsonError(c, "User not found", 404, "USER_NOT_FOUND");
    }

    return jsonSuccess(c, { user: updated });
  },
);

export { userRoutes };

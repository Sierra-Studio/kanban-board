import { Hono } from "hono";
import { z } from "zod";
import { zValidator } from "@hono/zod-validator";

import { authMiddleware } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { jsonError, jsonSuccess } from "../response";
import type { AuthContext } from "../types";
import { getUserById, updateUserProfile } from "~/server/services/user.service";
import { onboardNewUser } from "~/server/services/user-onboarding";

const userRoutes = new Hono<AuthContext>();

const updateProfileSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  image: z.string().url().nullable().optional(),
});

const userIdParams = z.object({
  id: z.string().min(1),
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

userRoutes.post("/onboard", async (c) => {
  const sessionUser = c.get("user");

  try {
    await onboardNewUser(sessionUser.id);
    return jsonSuccess(c, { onboarded: true });
  } catch (error) {
    console.error("Failed to onboard user:", error);
    // Return success anyway - user can create boards manually
    // We don't want to fail the request if demo board creation fails
    return jsonSuccess(c, { onboarded: false });
  }
});

userRoutes.get(
  "/:id",
  zValidator("param", userIdParams),
  async (c) => {
    const { id } = c.req.valid("param");
    const userRecord = await getUserById(id);

    if (!userRecord) {
      return jsonError(c, "User not found", 404, "USER_NOT_FOUND");
    }

    return jsonSuccess(c, { user: userRecord });
  },
);

export { userRoutes };

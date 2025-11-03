import { createMiddleware } from "hono/factory";

import { auth } from "~/server/auth/config";

import { jsonError } from "../response";
import type { ApiSession, ApiUser, AuthContext } from "../types";

export const authMiddleware = createMiddleware<AuthContext>(async (c, next) => {
  try {
    const sessionData = await auth.api.getSession({
      headers: c.req.raw.headers,
    });

    if (!sessionData || !sessionData.user || !sessionData.session) {
      return jsonError(c, "Unauthorized", 401);
    }

    const user: ApiUser = {
      id: sessionData.user.id,
      email: sessionData.user.email,
      name: sessionData.user.name ?? null,
      image: sessionData.user.image ?? null,
      emailVerified: Boolean(sessionData.user.emailVerified),
      createdAt: new Date(sessionData.user.createdAt),
      updatedAt: new Date(sessionData.user.updatedAt ?? sessionData.user.createdAt),
    };

    const session: ApiSession = {
      id: sessionData.session.id,
      expiresAt: new Date(sessionData.session.expiresAt),
      token: sessionData.session.token,
      userId: sessionData.session.userId,
    };

    c.set("user", user);
    c.set("session", session);

    await next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return jsonError(c, "Authentication failed", 401);
  }
});


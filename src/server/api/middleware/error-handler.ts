import { createMiddleware } from "hono/factory";

import { jsonError } from "../response";
import type { ApiContext } from "../types";

export const errorHandler = createMiddleware<ApiContext>(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("API error:", error);
    return jsonError(c, "Internal Server Error", 500);
  }
});

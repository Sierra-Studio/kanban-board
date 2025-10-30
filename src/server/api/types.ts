import type { Context } from "hono";

export interface ApiUser {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiSession {
  id: string;
  expiresAt: Date;
  token: string;
  userId: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: Date;
}

export interface ApiContext {
  Variables: {
    user?: ApiUser;
    session?: ApiSession;
    rateLimit?: RateLimitInfo;
  };
}

export interface AuthContext extends ApiContext {
  Variables: ApiContext["Variables"] & {
    user: ApiUser;
    session: ApiSession;
  };
}

export type ApiHandlerContext = Context<ApiContext>;
export type AuthHandlerContext = Context<AuthContext>;

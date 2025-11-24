"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : "",
});

export const {
  signIn,
  signUp,
  signOut,
  useSession,
} = authClient;

export async function peekSessionStatus(): Promise<void> {
  try {
    await authClient.getSession({
      query: {
        disableCookieCache: true,
        disableRefresh: true,
      },
    });
  } catch (error) {
    console.warn("Session status probe failed", error);
  }
}

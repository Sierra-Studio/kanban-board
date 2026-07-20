"use client";

import { apiUrl } from "~/lib/api/config";

export type AuthResult = {
  error: { message: string } | null;
};

type EnvelopeError = { success: false; error?: string; code?: string };

async function authRequest(
  path: string,
  body?: Record<string, unknown>,
): Promise<AuthResult> {
  try {
    const response = await fetch(apiUrl(path), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
    });

    const data = (await response.json().catch(() => null)) as
      | { success: true }
      | EnvelopeError
      | null;

    if (!response.ok || data?.success !== true) {
      const errorData = data as EnvelopeError | null;
      return { error: { message: errorData?.error ?? "Request failed" } };
    }

    return { error: null };
  } catch (error) {
    return {
      error: {
        message: error instanceof Error ? error.message : "Network error",
      },
    };
  }
}

export const signIn = {
  email: async ({
    email,
    password,
  }: {
    email: string;
    password: string;
  }): Promise<AuthResult> => authRequest("/api/auth/sign-in", { email, password }),
};

export const signUp = {
  email: async ({
    email,
    password,
    name,
  }: {
    email: string;
    password: string;
    name: string;
  }): Promise<AuthResult> =>
    authRequest("/api/auth/sign-up", { email, password, name }),
};

export async function signOut(): Promise<void> {
  await authRequest("/api/auth/sign-out");
}

export async function onboardCurrentUser(): Promise<void> {
  await fetch(apiUrl("/api/user/onboard"), {
    method: "POST",
    credentials: "include",
  });
}

/**
 * Kept for API compatibility with the previous Better Auth client. Probes the
 * session endpoint so the session cookie is validated before subsequent calls.
 */
export async function peekSessionStatus(): Promise<void> {
  try {
    await fetch(apiUrl("/api/auth/get-session"), {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
  } catch (error) {
    console.warn("Session status probe failed", error);
  }
}

"use client";

import { apiFetch } from "./boards";

export type UserResponse = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

export async function getUserById(userId: string): Promise<UserResponse> {
  const result = await apiFetch<{ user: UserResponse }>(`/api/users/${userId}`, {
    method: "GET",
  });

  return result.user;
}

export async function getCurrentUser(): Promise<UserResponse> {
  const result = await apiFetch<{ user: UserResponse }>(`/api/users/me`, {
    method: "GET",
  });

  return result.user;
}
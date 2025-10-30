import type { BoardRole } from "~/server/db/schema";

export function canViewBoard(role: BoardRole | null | undefined) {
  return role === "owner" || role === "admin" || role === "member" || role === "viewer";
}

export function canManageBoard(role: BoardRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canManageMembers(role: BoardRole | null | undefined) {
  return role === "owner" || role === "admin";
}

export function canDeleteBoard(role: BoardRole | null | undefined) {
  return role === "owner";
}

export function isOwner(role: BoardRole | null | undefined) {
  return role === "owner";
}

export function canEditColumns(role: BoardRole | null | undefined) {
  return role === "owner" || role === "admin" || role === "member";
}

// Example model schema from the Drizzle docs
// https://orm.drizzle.team/docs/sql-schema-declaration

import { sql } from "drizzle-orm";
import { index, sqliteTableCreator, uniqueIndex } from "drizzle-orm/sqlite-core";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator(
  (name) => `kanban-challenge_${name}`,
);

// ============================================================================
// AUTHENTICATION TABLES (Better-Auth Schema)
// ============================================================================

export const user = createTable(
  "user",
  (d) => ({
    id: d.text().primaryKey(),
    name: d.text(),
    email: d.text().notNull().unique(),
    emailVerified: d.integer({ mode: "boolean" }).default(false).notNull(),
    image: d.text(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [index("user_email_idx").on(t.email)],
);

export const session = createTable(
  "session",
  (d) => ({
    id: d.text().primaryKey(),
    expiresAt: d.integer({ mode: "timestamp" }).notNull(),
    token: d.text().notNull().unique(),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull()
      .$onUpdate(() => new Date()),
    ipAddress: d.text(),
    userAgent: d.text(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  }),
  (t) => [
    index("session_token_idx").on(t.token),
    index("session_user_id_idx").on(t.userId),
  ],
);

export const account = createTable(
  "account",
  (d) => ({
    id: d.text().primaryKey(),
    accountId: d.text().notNull(),
    providerId: d.text().notNull(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: d.text(),
    refreshToken: d.text(),
    idToken: d.text(),
    accessTokenExpiresAt: d.integer({ mode: "timestamp" }),
    refreshTokenExpiresAt: d.integer({ mode: "timestamp" }),
    scope: d.text(),
    password: d.text(), // For email/password auth
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull()
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("account_user_id_idx").on(t.userId),
    index("account_provider_idx").on(t.providerId, t.accountId),
  ],
);

export const verification = createTable("verification", (d) => ({
  id: d.text().primaryKey(),
  identifier: d.text().notNull(),
  value: d.text().notNull(),
  expiresAt: d.integer({ mode: "timestamp" }).notNull(),
  createdAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull(),
  updatedAt: d
    .integer({ mode: "timestamp" })
    .default(sql`(unixepoch())`)
    .notNull()
    .$onUpdate(() => new Date()),
}));

// ============================================================================
// APPLICATION TABLES
// ============================================================================

// Keep the example posts table for now (can be removed later)
export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer({ mode: "number" }).primaryKey({ autoIncrement: true }),
    name: d.text({ length: 256 }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .default(sql`(unixepoch())`)
      .notNull(),
    updatedAt: d.integer({ mode: "timestamp" }).$onUpdate(() => new Date()),
  }),
  (t) => [index("name_idx").on(t.name)],
);

// ============================================================================
// BOARD MANAGEMENT TABLES
// ============================================================================

export const boardRoles = ["owner", "admin", "member", "viewer"] as const;
export type BoardRole = (typeof boardRoles)[number];

export const boards = createTable(
  "board",
  (d) => ({
    id: d
      .text()
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    title: d.text().notNull(),
    description: d.text(),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    isArchived: d.integer({ mode: "boolean" }).notNull().default(false),
    createdAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("board_user_id_idx").on(t.userId),
    index("board_is_archived_idx").on(t.isArchived),
  ],
);

export const boardMembers = createTable(
  "board_member",
  (d) => ({
    id: d
      .text()
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    boardId: d
      .text()
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    userId: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    role: d
      .text({ enum: boardRoles })
      .notNull(),
    joinedAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
  }),
  (t) => [
    index("board_member_board_id_idx").on(t.boardId),
    index("board_member_user_id_idx").on(t.userId),
    uniqueIndex("board_member_unique").on(t.boardId, t.userId),
  ],
);

export const columns = createTable(
  "column",
  (d) => ({
    id: d
      .text()
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    boardId: d
      .text()
      .notNull()
      .references(() => boards.id, { onDelete: "cascade" }),
    name: d.text().notNull(),
    position: d.integer({ mode: "number" }).notNull(),
    isCollapsed: d.integer({ mode: "boolean" }).notNull().default(false),
    createdAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("column_board_id_idx").on(t.boardId),
    index("column_position_idx").on(t.position),
  ],
);

export const cards = createTable(
  "card",
  (d) => ({
    id: d
      .text()
      .primaryKey()
      .default(sql`(lower(hex(randomblob(16))))`),
    columnId: d
      .text()
      .notNull()
      .references(() => columns.id, { onDelete: "cascade" }),
    title: d.text().notNull(),
    description: d.text(),
    position: d.integer({ mode: "number" }).notNull(),
    createdBy: d
      .text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: d
      .integer({ mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  }),
  (t) => [
    index("card_column_id_idx").on(t.columnId),
    index("card_position_idx").on(t.position),
  ],
);

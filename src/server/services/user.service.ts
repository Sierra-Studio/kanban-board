import { eq } from "drizzle-orm";

import { db } from "~/server/db";
import { user } from "~/server/db/schema";

export type UserSummary = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  createdAt: Date;
};

type UserRecord = typeof user.$inferSelect;

function mapUser(record: UserRecord): UserSummary {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    image: record.image,
    emailVerified: record.emailVerified,
    createdAt: record.createdAt,
  };
}

export async function getUserById(userId: string): Promise<UserSummary | null> {
  const [row] = await db
    .select({ user })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1);

  if (!row) return null;

  return mapUser(row.user);
}

export async function getUserSafe(userId: string) {
  const userRecord = await getUserById(userId);
  if (!userRecord) {
    return null;
  }

  return userRecord;
}

export async function updateUserProfile(
  userId: string,
  data: { name?: string | null; image?: string | null },
): Promise<UserSummary | null> {
  const updatePayload: Partial<UserRecord> = {};

  if (data.name !== undefined) {
    updatePayload.name = data.name;
  }

  if (data.image !== undefined) {
    updatePayload.image = data.image;
  }

  if (Object.keys(updatePayload).length === 0) {
    return await getUserById(userId);
  }

  const [updated] = await db
    .update(user)
    .set(updatePayload)
    .where(eq(user.id, userId))
    .returning();

  if (!updated) {
    return null;
  }

  return mapUser(updated);
}

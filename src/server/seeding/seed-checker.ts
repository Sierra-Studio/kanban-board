import { db } from "~/server/db";
import { user } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export const KANBAN_ADMIN_EMAIL = "kanban-admin@system.local";
export const KANBAN_ADMIN_NAME = "🤖 Kanban Admin";

/**
 * Check if the Kanban Admin user exists
 */
export async function kanbanAdminExists(): Promise<boolean> {
  try {
    const [admin] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, KANBAN_ADMIN_EMAIL))
      .limit(1);

    const exists = !!admin;
    if (exists) {
      console.log("🤖 Kanban Admin user already exists");
    } else {
      console.log("🆕 Kanban Admin user not found");
    }
    return exists;
  } catch (error) {
    console.error("❌ Error checking for Kanban Admin (migrations may not be applied):", error);
    return false;
  }
}

/**
 * Check if seeding should run
 */
export async function shouldRunSeeding(): Promise<{ shouldRun: boolean; reason: string }> {
  console.log("🔍 Checking if seeding is needed...");

  const adminExists = await kanbanAdminExists();
  if (adminExists) {
    return {
      shouldRun: false,
      reason: "Kanban Admin already exists. Seeding has already been completed."
    };
  }

  console.log("✅ Ready for seeding!");
  return {
    shouldRun: true,
    reason: "Database is ready for initial seeding"
  };
}
import { db } from "~/server/db";
import { user, account } from "~/server/db/schema";
import { KANBAN_ADMIN_EMAIL, KANBAN_ADMIN_NAME } from "./seed-checker";

/**
 * Create the special Kanban Admin system user
 */
export async function createKanbanAdmin(): Promise<string> {
  console.log("🤖 Creating Kanban Admin user...");

  try {
    // Create the admin user
    const [adminUser] = await db
      .insert(user)
      .values({
        email: KANBAN_ADMIN_EMAIL,
        name: KANBAN_ADMIN_NAME,
        emailVerified: true,
        image: null, // Will use initials "KA" in avatar
      })
      .returning();

    if (!adminUser) {
      throw new Error("Failed to create Kanban Admin user");
    }

    // Create an account record for the admin (email/password auth)
    await db.insert(account).values({
      userId: adminUser.id,
      accountId: adminUser.id,
      providerId: "credential",
      password: null, // System user doesn't need a password
    });

    console.log(`✅ Kanban Admin created with ID: ${adminUser.id}`);
    return adminUser.id;
  } catch (error) {
    console.error("❌ Failed to create Kanban Admin:", error);
    throw error;
  }
}
import { createDemoBoard } from "~/server/seeding/demo-board";
import { createCrowdedBoard } from "~/server/seeding/crowded-board";
import { getUserByEmail } from "~/server/services/user.service";
import { KANBAN_ADMIN_EMAIL } from "~/server/seeding/seed-checker";

/**
 * Onboard a new user by creating a demo board for them
 * This function is called automatically when a new user signs up
 */
export async function onboardNewUser(userId: string): Promise<void> {
  try {
    console.log(`🎯 Onboarding new user: ${userId}`);

    // Get Kanban Admin user to use as card creator
    const kanbanAdmin = await getUserByEmail(KANBAN_ADMIN_EMAIL);
    if (!kanbanAdmin) {
      throw new Error("Kanban Admin user not found - database may not be seeded");
    }

    // Create demo board owned by new user, but with cards created by Kanban Admin
    const demoBoardId = await createDemoBoard(userId, kanbanAdmin.id);
    const crowdedBoardId = await createCrowdedBoard(userId, kanbanAdmin.id);

    console.log(
      `✅ User ${userId} onboarded with demo board ${demoBoardId} and crowded board ${crowdedBoardId}`
    );
  } catch (error) {
    console.error(`❌ Failed to onboard user ${userId}:`, error);
    // Don't throw - we don't want signup to fail if demo board creation fails
    // User can create their own boards manually
  }
}

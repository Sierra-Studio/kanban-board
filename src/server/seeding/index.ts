import { shouldRunSeeding } from "./seed-checker";
import { createKanbanAdmin } from "./admin-user";
import { createDemoBoard } from "./demo-board";

/**
 * Main seeding orchestrator
 * Runs the complete seeding process if conditions are met
 */
export async function runSeeding(): Promise<{ success: boolean; message: string }> {
  const startTime = Date.now();
  console.log("🌱 Starting Kanban seeding process...");

  try {
    // Check if seeding should run
    const { shouldRun, reason } = await shouldRunSeeding();
    
    if (!shouldRun) {
      console.log(`⏭️ Skipping seeding: ${reason}`);
      return {
        success: true,
        message: `Seeding skipped: ${reason}`
      };
    }

    console.log("🚀 Beginning initial database seeding...");

    // Step 1: Create Kanban Admin user
    const adminUserId = await createKanbanAdmin();

    // Step 2: Create demo board with content
    const demoBoardId = await createDemoBoard(adminUserId);

    const duration = Date.now() - startTime;
    const successMessage = `✨ Seeding completed successfully in ${duration}ms!\n🤖 Kanban Admin created (ID: ${adminUserId})\n📋 Demo board created (ID: ${demoBoardId})`;
    
    console.log(successMessage);

    return {
      success: true,
      message: "Database seeded successfully with Kanban Admin and demo board"
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = `❌ Seeding failed after ${duration}ms`;
    
    console.error(errorMessage, error);

    return {
      success: false,
      message: `Seeding failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Run seeding and exit (for CLI usage)
 */
export async function runSeedingAndExit(): Promise<void> {
  const result = await runSeeding();
  
  if (result.success) {
    console.log("🎉 Seeding process completed successfully!");
    process.exit(0);
  } else {
    console.error("💥 Seeding process failed!");
    console.error(result.message);
    process.exit(1);
  }
}
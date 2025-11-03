import { db } from "~/server/db";
import { boards, columns, cards } from "~/server/db/schema";
import { generateDemoBoardContent } from "./demo-content";

/**
 * Create the demo board with all its content for the Kanban Admin
 */
export async function createDemoBoard(adminUserId: string): Promise<string> {
  console.log("🎨 Creating demo board with engaging content...");

  try {
    const demoContent = generateDemoBoardContent();

    // Create the demo board
    const [demoBoard] = await db
      .insert(boards)
      .values({
        title: demoContent.boardTitle,
        description: demoContent.boardDescription,
        userId: adminUserId,
        isArchived: false,
      })
      .returning();

    if (!demoBoard) {
      throw new Error("Failed to create demo board");
    }

    console.log(`📋 Demo board created: "${demoBoard.title}"`);

    // Create columns and cards in a transaction for consistency
    await db.transaction(async (tx) => {
      for (const columnData of demoContent.columns) {
        // Create the column
        const [column] = await tx
          .insert(columns)
          .values({
            boardId: demoBoard.id,
            name: columnData.name,
            position: columnData.position,
            isCollapsed: false,
          })
          .returning();

        if (!column) {
          throw new Error(`Failed to create column: ${columnData.name}`);
        }

        console.log(`  📝 Created column: "${column.name}" with ${columnData.cards.length} cards`);

        // Create cards for this column
        if (columnData.cards.length > 0) {
          await tx.insert(cards).values(
            columnData.cards.map((cardData) => ({
              columnId: column.id,
              title: cardData.title,
              description: cardData.description,
              position: cardData.position,
              createdBy: adminUserId,
            }))
          );
        }
      }
    });

    console.log("✅ Demo board creation completed successfully!");
    return demoBoard.id;
  } catch (error) {
    console.error("❌ Failed to create demo board:", error);
    throw error;
  }
}
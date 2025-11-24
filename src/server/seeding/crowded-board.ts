import { db } from "~/server/db";
import { boards, cards, columns } from "~/server/db/schema";

const CROWDED_BOARD_TITLE = "🌪️ Crowded Board";
const CROWDED_BOARD_DESCRIPTION =
  "This chaotic board is where a bunch of people dropped their daily tasks, coffee cups, and doodles before sprinting away. Scroll through the pile, laugh at the mayhem, and use it to stress-test every nook of the app.";

const CARDS_PER_COLUMN = 500;
const CARD_BATCH_SIZE = 100;

const CROWDED_COLUMNS = [
  { name: "🗂️ Backlog Avalanche", position: 1000 },
  { name: "⚙️ In-Progress Traffic Jam", position: 2000 },
  { name: "🔍 Review Bottleneck", position: 3000 },
  { name: "🏁 Done Mountain", position: 4000 },
];

const CHAOS_SNIPPETS = [
  "Mismatched sticky notes flutter in the imaginary breeze while every passerby adds another scribble that only makes sense to them.",
  "Somebody dropped their grocery list next to a sprint goal, and now the team debates whether avocados are part of the acceptance criteria.",
  "Half of these todos reference a pet llama, the other half reference quarterly OKRs, and somehow both are equally urgent.",
  "Water bottle rings turned bullet points into meteorological symbols, so no one knows if a checkbox means completed or cloudy with a chance of revisiting.",
  "Every notification ping spawned another subtask, and those subtasks spawned optimistic timeline charts that look suspiciously like spaghetti.",
];

const OVERFLOW_PARAGRAPH =
  "People keep tossing daily tasks here because it feels safer than a group chat. The pile loops between personal errands, ambitious product launches, chore lists, and random shower thoughts. Every line hums with that joyful panic of working together in the middle of a confetti storm.";

function createCardDescription(columnName: string, cardNumber: number): string {
  const header =
    `Card #${cardNumber} lounges inside ${columnName} on the Crowded board. ` +
    "This is the communal drop zone where a bunch of people abandoned their daily tasks and swore they'd circle back after lunch. Spoiler: they didn't, so now you get to explore the debris.";

  const snippetStory = CHAOS_SNIPPETS.map(
    (snippet, index) =>
      `Scene ${index + 1}: ${snippet} The mystery somehow points back to card #${cardNumber}, so ${columnName} keeps it safe until someone claims it.`
  ).join("\n\n");

  const fauxTimeline = Array.from({ length: 8 }, (_, index) => {
    const hour = ((index + (cardNumber % 5)) % 12) + 1;
    const meridiem = (index + cardNumber) % 2 === 0 ? "AM" : "PM";
    return `• ${hour}:0${index} ${meridiem} – Another teammate dropped fresh context, which only made the puzzle spicier.`;
  }).join("\n");

  const overflowNotes = Array.from({ length: 4 }, (_, index) =>
    `Overflow Note ${index + 1}: ${OVERFLOW_PARAGRAPH}`
  ).join("\n\n");

  return [
    header,
    snippetStory,
    "Daily Task Avalanche Log:",
    fauxTimeline,
    overflowNotes,
  ].join("\n\n");
}

function chunkArray<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function createCrowdedBoard(
  boardOwnerId: string,
  cardCreatorId: string
): Promise<string> {
  console.log("🌪️ Creating crowded board carnage...");

  const [crowdedBoard] = await db
    .insert(boards)
    .values({
      title: CROWDED_BOARD_TITLE,
      description: CROWDED_BOARD_DESCRIPTION,
      userId: boardOwnerId,
      isArchived: false,
    })
    .returning();

  if (!crowdedBoard) {
    throw new Error("Failed to create crowded board");
  }

  await db.transaction(async (tx) => {
    for (const columnConfig of CROWDED_COLUMNS) {
      const [column] = await tx
        .insert(columns)
        .values({
          boardId: crowdedBoard.id,
          name: columnConfig.name,
          position: columnConfig.position,
          isCollapsed: false,
        })
        .returning();

      if (!column) {
        throw new Error(`Failed to create crowded column: ${columnConfig.name}`);
      }

      const cardsForColumn = Array.from({ length: CARDS_PER_COLUMN }, (_, index) => ({
        columnId: column.id,
        title: `${columnConfig.name} #${index + 1}`,
        description: createCardDescription(columnConfig.name, index + 1),
        position: (index + 1) * 1000,
        createdBy: cardCreatorId,
      }));

      for (const batch of chunkArray(cardsForColumn, CARD_BATCH_SIZE)) {
        await tx.insert(cards).values(batch);
      }

      console.log(
        `  ➕ Packed column "${column.name}" with ${CARDS_PER_COLUMN} cards of pure chaos`
      );
    }
  });

  console.log("✅ Crowded board is overflowing nicely");
  return crowdedBoard.id;
}

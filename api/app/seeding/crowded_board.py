from sqlalchemy.orm import Session

from app.models import Board, BoardColumn, Card

CROWDED_BOARD_TITLE = "🌪️ Crowded Board"
CROWDED_BOARD_DESCRIPTION = (
    "This chaotic board is where a bunch of people dropped their daily tasks, coffee "
    "cups, and doodles before sprinting away. Scroll through the pile, laugh at the "
    "mayhem, and use it to stress-test every nook of the app."
)

CARDS_PER_COLUMN = 500

CROWDED_COLUMNS = [
    {"name": "🗂️ Backlog Avalanche", "position": 1000},
    {"name": "⚙️ In-Progress Traffic Jam", "position": 2000},
    {"name": "🔍 Review Bottleneck", "position": 3000},
    {"name": "🏁 Done Mountain", "position": 4000},
]

CHAOS_SNIPPETS = [
    "Mismatched sticky notes flutter in the imaginary breeze while every passerby adds another scribble that only makes sense to them.",
    "Somebody dropped their grocery list next to a sprint goal, and now the team debates whether avocados are part of the acceptance criteria.",
    "Half of these todos reference a pet llama, the other half reference quarterly OKRs, and somehow both are equally urgent.",
    "Water bottle rings turned bullet points into meteorological symbols, so no one knows if a checkbox means completed or cloudy with a chance of revisiting.",
    "Every notification ping spawned another subtask, and those subtasks spawned optimistic timeline charts that look suspiciously like spaghetti.",
]

OVERFLOW_PARAGRAPH = (
    "People keep tossing daily tasks here because it feels safer than a group chat. The "
    "pile loops between personal errands, ambitious product launches, chore lists, and "
    "random shower thoughts. Every line hums with that joyful panic of working together "
    "in the middle of a confetti storm."
)


def _create_card_description(column_name: str, card_number: int) -> str:
    header = (
        f"Card #{card_number} lounges inside {column_name} on the Crowded board. "
        "This is the communal drop zone where a bunch of people abandoned their daily "
        "tasks and swore they'd circle back after lunch. Spoiler: they didn't, so now "
        "you get to explore the debris."
    )

    snippet_story = "\n\n".join(
        f"Scene {index + 1}: {snippet} The mystery somehow points back to card "
        f"#{card_number}, so {column_name} keeps it safe until someone claims it."
        for index, snippet in enumerate(CHAOS_SNIPPETS)
    )

    faux_timeline_lines = []
    for index in range(8):
        hour = ((index + (card_number % 5)) % 12) + 1
        meridiem = "AM" if (index + card_number) % 2 == 0 else "PM"
        faux_timeline_lines.append(
            f"• {hour}:0{index} {meridiem} – Another teammate dropped fresh context, "
            "which only made the puzzle spicier."
        )
    faux_timeline = "\n".join(faux_timeline_lines)

    overflow_notes = "\n\n".join(
        f"Overflow Note {index + 1}: {OVERFLOW_PARAGRAPH}" for index in range(4)
    )

    return "\n\n".join(
        [
            header,
            snippet_story,
            "Daily Task Avalanche Log:",
            faux_timeline,
            overflow_notes,
        ]
    )


def create_crowded_board(db: Session, board_owner_id: str, card_creator_id: str) -> str:
    board = Board(
        title=CROWDED_BOARD_TITLE,
        description=CROWDED_BOARD_DESCRIPTION,
        user_id=board_owner_id,
        is_archived=False,
    )
    db.add(board)
    db.flush()

    for column_config in CROWDED_COLUMNS:
        column = BoardColumn(
            board_id=board.id,
            name=column_config["name"],
            position=column_config["position"],
            is_collapsed=False,
        )
        db.add(column)
        db.flush()

        db.bulk_save_objects(
            [
                Card(
                    column_id=column.id,
                    title=f"{column_config['name']} #{index + 1}",
                    description=_create_card_description(column_config["name"], index + 1),
                    position=(index + 1) * 1000,
                    created_by=card_creator_id,
                )
                for index in range(CARDS_PER_COLUMN)
            ]
        )

    db.commit()
    return board.id

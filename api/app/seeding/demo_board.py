from sqlalchemy.orm import Session

from app.models import Board, BoardColumn, Card
from app.seeding.demo_content import generate_demo_board_content


def create_demo_board(db: Session, board_owner_id: str, card_creator_id: str) -> str:
    """Create the demo board with all its columns and cards. Returns board id."""
    content = generate_demo_board_content()

    board = Board(
        title=content["boardTitle"],
        description=content["boardDescription"],
        user_id=board_owner_id,
        is_archived=False,
    )
    db.add(board)
    db.flush()

    for column_data in content["columns"]:
        column = BoardColumn(
            board_id=board.id,
            name=column_data["name"],
            position=column_data["position"],
            is_collapsed=False,
        )
        db.add(column)
        db.flush()

        for card_data in column_data["cards"]:
            db.add(
                Card(
                    column_id=column.id,
                    title=card_data["title"],
                    description=card_data["description"],
                    position=card_data["position"],
                    created_by=card_creator_id,
                )
            )

    db.commit()
    return board.id

from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import Board, BoardColumn
from app.services.card_service import duplicate_cards, list_cards
from app.services.column_service import list_board_columns, map_column
from app.services.errors import ServiceError
from app.utils import iso

DEFAULT_COLUMNS = [
    {"name": "To Do", "position": 1000},
    {"name": "In Progress", "position": 2000},
    {"name": "Done", "position": 3000},
]


def map_board_summary(record: Board, column_count: int) -> dict[str, Any]:
    return {
        "id": record.id,
        "title": record.title,
        "description": record.description,
        "isArchived": record.is_archived,
        "createdAt": iso(record.created_at),
        "updatedAt": iso(record.updated_at),
        "columnCount": column_count,
    }


def _get_board_or_raise(db: Session, board_id: str) -> Board:
    board = db.scalar(select(Board).where(Board.id == board_id).limit(1))
    if board is None:
        raise ServiceError("Board not found", 404, "BOARD_NOT_FOUND")
    return board


def _assert_owner(board: Board, user_id: str) -> None:
    if board.user_id != user_id:
        raise ServiceError(
            "Only the board owner can perform this action", 403, "BOARD_OWNER_REQUIRED"
        )


def _column_count(db: Session, board_id: str) -> int:
    return int(
        db.scalar(
            select(func.count())
            .select_from(BoardColumn)
            .where(BoardColumn.board_id == board_id)
        )
        or 0
    )


def list_boards_for_user(db: Session, user_id: str) -> list[dict[str, Any]]:
    column_count_subq = (
        select(func.count())
        .select_from(BoardColumn)
        .where(BoardColumn.board_id == Board.id)
        .scalar_subquery()
    )
    rows = db.execute(
        select(Board, column_count_subq)
        .where(Board.user_id == user_id)
        .order_by(Board.title.asc())
    ).all()
    return [map_board_summary(board, int(count or 0)) for board, count in rows]


def create_board(
    db: Session, title: str, description: str | None, owner_id: str
) -> dict[str, Any]:
    board = Board(title=title, description=description, user_id=owner_id)
    db.add(board)
    db.flush()

    inserted_columns: list[BoardColumn] = []
    for col in DEFAULT_COLUMNS:
        column = BoardColumn(
            board_id=board.id, name=col["name"], position=col["position"]
        )
        db.add(column)
        inserted_columns.append(column)

    db.commit()
    db.refresh(board)
    for column in inserted_columns:
        db.refresh(column)

    summary = map_board_summary(board, len(inserted_columns))
    return {
        "board": summary,
        "columns": [
            {**map_column(column, 0), "cards": []} for column in inserted_columns
        ],
    }


def get_board_detail(db: Session, board_id: str, user_id: str) -> dict[str, Any]:
    board = _get_board_or_raise(db, board_id)

    columns_data = list_board_columns(db, board_id, user_id)
    columns_with_cards = [
        {**column, "cards": list_cards(db, column["id"], user_id)}
        for column in columns_data
    ]

    summary = map_board_summary(board, len(columns_data))
    return {"board": summary, "columns": columns_with_cards}


def update_board(
    db: Session, board_id: str, user_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    board = _get_board_or_raise(db, board_id)
    _assert_owner(board, user_id)

    if "title" in data and data["title"] is not None:
        board.title = data["title"]
    if "description" in data:
        board.description = data["description"]

    db.commit()
    db.refresh(board)

    return map_board_summary(board, _column_count(db, board_id))


def set_board_archive(
    db: Session, board_id: str, user_id: str, is_archived: bool
) -> dict[str, Any]:
    board = _get_board_or_raise(db, board_id)
    _assert_owner(board, user_id)

    board.is_archived = is_archived
    db.commit()
    db.refresh(board)

    return map_board_summary(board, _column_count(db, board_id))


def delete_board(db: Session, board_id: str, user_id: str) -> None:
    board = _get_board_or_raise(db, board_id)
    _assert_owner(board, user_id)

    db.delete(board)
    db.commit()


def duplicate_board(
    db: Session, board_id: str, user_id: str, title: str | None = None
) -> dict[str, Any]:
    board = _get_board_or_raise(db, board_id)
    _assert_owner(board, user_id)

    columns_data = db.scalars(
        select(BoardColumn)
        .where(BoardColumn.board_id == board_id)
        .order_by(BoardColumn.position.asc())
    ).all()

    new_board = Board(
        title=title or f"{board.title} (Copy)",
        description=board.description,
        user_id=user_id,
    )
    db.add(new_board)
    db.flush()

    for column in columns_data:
        db.add(
            BoardColumn(
                board_id=new_board.id,
                name=column.name,
                position=column.position,
                is_collapsed=column.is_collapsed,
            )
        )
    db.commit()

    new_board_id = new_board.id
    duplicate_cards(db, board_id, new_board_id)

    return get_board_detail(db, new_board_id, user_id)

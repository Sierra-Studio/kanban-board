from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import BoardColumn, Card
from app.services.errors import ServiceError
from app.utils import iso


def map_column(record: BoardColumn, card_count: int = 0) -> dict[str, Any]:
    return {
        "id": record.id,
        "boardId": record.board_id,
        "name": record.name,
        "position": record.position,
        "isCollapsed": record.is_collapsed,
        "createdAt": iso(record.created_at),
        "updatedAt": iso(record.updated_at),
        "cardCount": card_count,
    }


def _get_column(db: Session, column_id: str) -> BoardColumn | None:
    return db.scalar(select(BoardColumn).where(BoardColumn.id == column_id).limit(1))


def _card_count(db: Session, column_id: str) -> int:
    return int(
        db.scalar(select(func.count()).select_from(Card).where(Card.column_id == column_id))
        or 0
    )


def list_board_columns(
    db: Session, board_id: str, _user_id: str
) -> list[dict[str, Any]]:
    card_count_subq = (
        select(func.count())
        .select_from(Card)
        .where(Card.column_id == BoardColumn.id)
        .scalar_subquery()
    )
    rows = db.execute(
        select(BoardColumn, card_count_subq)
        .where(BoardColumn.board_id == board_id)
        .order_by(BoardColumn.position.asc())
    ).all()
    return [map_column(column, int(count or 0)) for column, count in rows]


def rename_column(
    db: Session, column_id: str, _user_id: str, name: str
) -> dict[str, Any]:
    column = _get_column(db, column_id)
    if column is None:
        raise ServiceError("Column not found", 404, "COLUMN_NOT_FOUND")

    trimmed = name.strip()
    if len(trimmed) == 0 or len(trimmed) > 100:
        raise ServiceError("Invalid column name", 400, "INVALID_COLUMN_NAME")

    column.name = trimmed
    db.commit()
    db.refresh(column)

    return map_column(column, _card_count(db, column_id))


def toggle_column_collapse(
    db: Session, column_id: str, _user_id: str, is_collapsed: bool
) -> dict[str, Any]:
    column = _get_column(db, column_id)
    if column is None:
        raise ServiceError("Column not found", 404, "COLUMN_NOT_FOUND")

    column.is_collapsed = is_collapsed
    db.commit()
    db.refresh(column)

    return map_column(column, _card_count(db, column_id))


def reorder_columns(
    db: Session, board_id: str, _user_id: str, ordered_column_ids: list[str]
) -> list[dict[str, Any]]:
    if not ordered_column_ids:
        raise ServiceError("No columns provided", 400, "INVALID_COLUMN_ORDER")

    existing = db.scalars(
        select(BoardColumn)
        .where(BoardColumn.board_id == board_id)
        .order_by(BoardColumn.position.asc())
    ).all()
    existing_ids = {column.id for column in existing}

    if len(existing_ids) != len(ordered_column_ids):
        raise ServiceError("Column order mismatch", 400, "INVALID_COLUMN_ORDER")

    if any(column_id not in existing_ids for column_id in ordered_column_ids):
        raise ServiceError("Invalid column identifiers", 400, "INVALID_COLUMN_ORDER")

    by_id = {column.id: column for column in existing}
    for index, column_id in enumerate(ordered_column_ids):
        by_id[column_id].position = (index + 1) * 1000

    db.commit()

    return list_board_columns(db, board_id, _user_id)

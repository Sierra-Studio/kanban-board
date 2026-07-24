import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Any

from sqlalchemy import delete, select, update
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import BoardColumn, Card
from app.services.errors import ServiceError
from app.utils import iso

logger = logging.getLogger(__name__)

POSITION_GAP = 1000


def map_card(record: Card) -> dict[str, Any]:
    return {
        "id": record.id,
        "columnId": record.column_id,
        "title": record.title,
        "description": record.description,
        "position": record.position,
        "createdBy": record.created_by,
        "createdAt": iso(record.created_at),
        "updatedAt": iso(record.updated_at),
    }


def _get_column_or_raise(db: Session, column_id: str) -> BoardColumn:
    column = db.scalar(select(BoardColumn).where(BoardColumn.id == column_id).limit(1))
    if column is None:
        raise ServiceError("Column not found", 404, "COLUMN_NOT_FOUND")
    return column


def _get_card(db: Session, card_id: str) -> Card | None:
    return db.scalar(select(Card).where(Card.id == card_id).limit(1))


def list_cards(db: Session, column_id: str, _user_id: str) -> list[dict[str, Any]]:
    rows = db.scalars(
        select(Card).where(Card.column_id == column_id).order_by(Card.position.asc())
    ).all()
    return [map_card(row) for row in rows]


def create_card(
    db: Session, column_id: str, user_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    _get_column_or_raise(db, column_id)

    trimmed = (data.get("title") or "").strip()
    if not trimmed or len(trimmed) > 500:
        raise ServiceError("Invalid card title", 400, "INVALID_CARD_TITLE")

    description: str | None = None
    if "description" in data:
        raw = data.get("description")
        trimmed_description = (raw or "").strip()
        if len(trimmed_description) > 10_000:
            raise ServiceError("Description too long", 400, "INVALID_CARD_DESCRIPTION")
        description = trimmed_description or None

    last = db.scalar(
        select(Card.position)
        .where(Card.column_id == column_id)
        .order_by(Card.position.desc())
        .limit(1)
    )
    position = last + POSITION_GAP if last is not None else POSITION_GAP

    card = Card(
        column_id=column_id,
        title=trimmed,
        description=description,
        position=position,
        created_by=user_id,
    )
    db.add(card)
    db.commit()
    db.refresh(card)
    return map_card(card)


def get_card_detail(db: Session, card_id: str, _user_id: str) -> dict[str, Any]:
    card = _get_card(db, card_id)
    if card is None:
        raise ServiceError("Card not found", 404, "CARD_NOT_FOUND")
    return map_card(card)


def update_card(
    db: Session, card_id: str, _user_id: str, data: dict[str, Any]
) -> dict[str, Any]:
    card = _get_card(db, card_id)
    if card is None:
        raise ServiceError("Card not found", 404, "CARD_NOT_FOUND")

    changed = False
    if "title" in data and data["title"] is not None:
        trimmed = data["title"].strip()
        if not trimmed or len(trimmed) > 500:
            raise ServiceError("Invalid card title", 400, "INVALID_CARD_TITLE")
        card.title = trimmed
        changed = True

    if "description" in data:
        raw = data["description"]
        trimmed_description = (raw or "").strip()
        if len(trimmed_description) > 10_000:
            raise ServiceError("Description too long", 400, "INVALID_CARD_DESCRIPTION")
        card.description = trimmed_description or None
        changed = True

    if changed:
        db.commit()
        db.refresh(card)

    return map_card(card)


def delete_card(db: Session, card_id: str, _user_id: str) -> None:
    card = _get_card(db, card_id)
    if card is None:
        raise ServiceError("Card not found", 404, "CARD_NOT_FOUND")
    db.delete(card)
    db.commit()


def _rebalance_positions(db: Session, column_id: str) -> None:
    rows = db.scalars(
        select(Card).where(Card.column_id == column_id).order_by(Card.position.asc())
    ).all()
    for index, card in enumerate(rows):
        card.position = (index + 1) * POSITION_GAP
    db.commit()


def _calculate_position(db: Session, column_id: str, index: int) -> int:
    ordered = db.scalars(
        select(Card).where(Card.column_id == column_id).order_by(Card.position.asc())
    ).all()

    if not ordered:
        return POSITION_GAP

    # Always maintain fixed gaps - just rebalance all positions. The new card will
    # be inserted at the given index.
    _rebalance_positions(db, column_id)

    return (index + 1) * POSITION_GAP


def move_card(
    db: Session, card_id: str, _user_id: str, target_column_id: str, position_index: int
) -> dict[str, Any]:
    card = _get_card(db, card_id)
    if card is None:
        raise ServiceError("Card not found", 404, "CARD_NOT_FOUND")

    source_column = _get_column_or_raise(db, card.column_id)
    target_column = _get_column_or_raise(db, target_column_id)

    if source_column.board_id != target_column.board_id:
        raise ServiceError("Cannot move card across boards", 400, "CARD_CROSS_BOARD_MOVE")

    original_column_id = card.column_id
    card_snapshot = map_card(card)
    position = _calculate_position(db, target_column_id, position_index)

    def remove_from_source() -> dict[str, Any]:
        session = SessionLocal()
        try:
            session.execute(
                delete(Card).where(
                    Card.id == card_id, Card.column_id == original_column_id
                )
            )
            session.commit()
            return {"status": "removed"}
        except Exception as error:  # noqa: BLE001
            session.rollback()
            return {"status": "remove_failed", "error": error}
        finally:
            session.close()

    def add_to_target() -> dict[str, Any]:
        session = SessionLocal()
        try:
            result = session.execute(
                update(Card)
                .where(Card.id == card_id, Card.column_id == original_column_id)
                .values(column_id=target_column_id, position=position)
            )
            session.commit()
            status = "inserted" if result.rowcount > 0 else "insert_skipped"
            return {"status": status}
        except Exception as error:  # noqa: BLE001
            session.rollback()
            return {"status": "insert_failed", "error": error}
        finally:
            session.close()

    with ThreadPoolExecutor(max_workers=2) as executor:
        futures = [
            executor.submit(remove_from_source),
            executor.submit(add_to_target),
        ]
        outcome = next(as_completed(futures)).result()

    if "error" in outcome:
        logger.warning("Card move operation reported an issue: %s", outcome["error"])

    db.expire_all()
    latest = _get_card(db, card_id)
    if latest is None:
        return {**card_snapshot, "columnId": target_column_id, "position": position}

    return map_card(latest)


def reorder_cards(
    db: Session, column_id: str, _user_id: str, ordered_card_ids: list[str]
) -> list[dict[str, Any]]:
    if not ordered_card_ids:
        raise ServiceError("No cards provided", 400, "INVALID_CARD_ORDER")

    existing = db.scalars(select(Card).where(Card.column_id == column_id)).all()
    existing_ids = {card.id for card in existing}

    if len(existing_ids) != len(ordered_card_ids):
        raise ServiceError("Card order mismatch", 400, "INVALID_CARD_ORDER")

    if any(card_id not in existing_ids for card_id in ordered_card_ids):
        raise ServiceError("Invalid card identifiers", 400, "INVALID_CARD_ORDER")

    by_id = {card.id: card for card in existing}
    for index, card_id in enumerate(ordered_card_ids):
        by_id[card_id].position = (index + 1) * POSITION_GAP

    db.commit()

    reordered = db.scalars(
        select(Card).where(Card.column_id == column_id).order_by(Card.position.asc())
    ).all()
    return [map_card(card) for card in reordered]


def duplicate_cards(db: Session, source_board_id: str, target_board_id: str) -> None:
    if source_board_id == target_board_id:
        return

    source_columns = db.scalars(
        select(BoardColumn).where(BoardColumn.board_id == source_board_id)
    ).all()
    if not source_columns:
        return

    target_columns = db.scalars(
        select(BoardColumn).where(BoardColumn.board_id == target_board_id)
    ).all()
    target_by_position = {column.position: column.id for column in target_columns}

    for source_column in source_columns:
        target_column_id = target_by_position.get(source_column.position)
        if not target_column_id:
            continue

        source_cards = db.scalars(
            select(Card)
            .where(Card.column_id == source_column.id)
            .order_by(Card.position.asc())
        ).all()
        for card in source_cards:
            db.add(
                Card(
                    column_id=target_column_id,
                    title=card.title,
                    description=card.description,
                    position=card.position,
                    created_by=card.created_by,
                    created_at=card.created_at,
                    updated_at=card.updated_at,
                )
            )
    db.commit()


def duplicate_card(db: Session, card_id: str) -> dict[str, Any]:
    card = _get_card(db, card_id)
    if card is None:
        raise ServiceError("Card not found", 404, "CARD_NOT_FOUND")

    return create_card(
        db,
        card.column_id,
        card.created_by,
        {"title": f"{card.title} (Copy)", "description": card.description},
    )

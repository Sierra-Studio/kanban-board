from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_user
from app.responses import json_success
from app.schemas import CreateCardBody, MoveCardBody, ReorderCardsBody, UpdateCardBody
from app.services import card_service

router = APIRouter(tags=["cards"])


@router.get("/api/columns/{column_id}/cards")
def list_cards(
    column_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    cards = card_service.list_cards(db, column_id, user["id"])
    return json_success({"cards": cards})


@router.post("/api/columns/{column_id}/cards")
def create_card(
    column_id: str,
    body: CreateCardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card = card_service.create_card(
        db, column_id, user["id"], body.model_dump(exclude_unset=True)
    )
    return json_success({"card": card}, status=201)


@router.post("/api/cards/reorder")
def reorder_cards(
    body: ReorderCardsBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    cards = card_service.reorder_cards(db, body.columnId, user["id"], body.cardIds)
    return json_success({"cards": cards})


@router.get("/api/cards/{card_id}")
def get_card(
    card_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card = card_service.get_card_detail(db, card_id, user["id"])
    return json_success({"card": card})


@router.patch("/api/cards/{card_id}")
def update_card(
    card_id: str,
    body: UpdateCardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card = card_service.update_card(
        db, card_id, user["id"], body.model_dump(exclude_unset=True)
    )
    return json_success({"card": card})


@router.delete("/api/cards/{card_id}")
def delete_card(
    card_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card_service.delete_card(db, card_id, user["id"])
    return json_success({})


@router.post("/api/cards/{card_id}/move")
def move_card(
    card_id: str,
    body: MoveCardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card = card_service.move_card(
        db, card_id, user["id"], body.toColumnId, body.index
    )
    return json_success({"card": card})


@router.post("/api/cards/{card_id}/duplicate")
def duplicate_card(
    card_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    card = card_service.duplicate_card(db, card_id)
    return json_success({"card": card})

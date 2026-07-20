from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_user
from app.responses import json_error, json_list, json_success
from app.schemas import (
    ArchiveBoardBody,
    CreateBoardBody,
    DuplicateBoardBody,
    UpdateBoardBody,
)
from app.services import board_service
from app.services.column_service import list_board_columns

router = APIRouter(prefix="/api/boards", tags=["boards"])


@router.get("")
def list_boards(
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    boards = board_service.list_boards_for_user(db, user["id"])
    return json_list(boards, len(boards), 1)


@router.post("")
def create_board(
    body: CreateBoardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    result = board_service.create_board(db, body.title, body.description, user["id"])
    return json_success(result, status=201)


@router.get("/{board_id}")
def get_board(
    board_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    detail = board_service.get_board_detail(db, board_id, user["id"])
    return json_success(detail)


@router.patch("/{board_id}")
def update_board(
    board_id: str,
    body: UpdateBoardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    board = board_service.update_board(
        db, board_id, user["id"], body.model_dump(exclude_unset=True)
    )
    return json_success({"board": board})


@router.post("/{board_id}/archive")
def archive_board(
    board_id: str,
    body: ArchiveBoardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    board = board_service.set_board_archive(db, board_id, user["id"], body.isArchived)
    return json_success({"board": board})


@router.post("/{board_id}/duplicate")
def duplicate_board(
    board_id: str,
    body: DuplicateBoardBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    detail = board_service.duplicate_board(db, board_id, user["id"], body.title)
    return json_success(detail, status=201)


@router.get("/{board_id}/columns")
def get_board_columns(
    board_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    columns = list_board_columns(db, board_id, user["id"])
    return json_success({"columns": columns})


@router.post("/{board_id}/columns")
def create_column_disabled(
    board_id: str,
    user: dict[str, Any] = Depends(require_user),
) -> JSONResponse:
    return json_error(
        "Column creation is not available", 405, "COLUMN_CREATE_DISABLED"
    )


@router.delete("/{board_id}")
def delete_board(
    board_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    board_service.delete_board(db, board_id, user["id"])
    return json_success({})

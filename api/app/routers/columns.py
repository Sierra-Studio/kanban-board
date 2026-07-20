from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_user
from app.responses import json_error, json_success
from app.schemas import ReorderColumnsBody, RenameColumnBody, ToggleCollapseBody
from app.services import column_service

router = APIRouter(prefix="/api/columns", tags=["columns"])


@router.post("/reorder")
def reorder_columns(
    body: ReorderColumnsBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    columns = column_service.reorder_columns(
        db, body.boardId, user["id"], body.columnIds
    )
    return json_success({"columns": columns})


@router.patch("/{column_id}")
def rename_column(
    column_id: str,
    body: RenameColumnBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    column = column_service.rename_column(db, column_id, user["id"], body.name)
    return json_success({"column": column})


@router.delete("/{column_id}")
def delete_column_disabled(
    column_id: str,
    user: dict[str, Any] = Depends(require_user),
) -> JSONResponse:
    return json_error(
        "Column deletion is not available", 405, "COLUMN_DELETE_DISABLED"
    )


@router.post("/{column_id}/collapse")
def collapse_column(
    column_id: str,
    body: ToggleCollapseBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    column = column_service.toggle_column_collapse(
        db, column_id, user["id"], body.isCollapsed
    )
    return json_success({"column": column})

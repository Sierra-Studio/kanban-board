from typing import Any

from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import require_user
from app.responses import json_error, json_success
from app.schemas import UpdateProfileBody
from app.seeding.onboarding import onboard_new_user
from app.services.user_service import get_user_by_id, update_user_profile

router = APIRouter(prefix="/api/user", tags=["user"])


@router.get("/me")
def get_me(
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    record = get_user_by_id(db, user["id"])
    payload = record or {
        "id": user["id"],
        "email": user["email"],
        "name": user.get("name"),
        "image": user.get("image"),
        "emailVerified": user.get("emailVerified"),
        "createdAt": user.get("createdAt"),
    }
    return json_success({"user": payload})


@router.patch("/me")
def update_me(
    body: UpdateProfileBody,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    updates = body.model_dump(exclude_unset=True)
    updated = update_user_profile(db, user["id"], updates)
    if updated is None:
        return json_error("User not found", 404, "USER_NOT_FOUND")
    return json_success({"user": updated})


@router.post("/onboard")
def onboard(
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    try:
        onboard_new_user(db, user["id"])
        return json_success({"onboarded": True})
    except Exception:  # noqa: BLE001 - never fail onboarding
        return json_success({"onboarded": False})


@router.get("/{user_id}")
def get_user(
    user_id: str,
    user: dict[str, Any] = Depends(require_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    record = get_user_by_id(db, user_id)
    if record is None:
        return json_error("User not found", 404, "USER_NOT_FOUND")
    return json_success({"user": record})

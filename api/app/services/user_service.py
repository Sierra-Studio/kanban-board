from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import User
from app.utils import iso


def map_user(record: User) -> dict[str, Any]:
    return {
        "id": record.id,
        "email": record.email,
        "name": record.name,
        "image": record.image,
        "emailVerified": record.email_verified,
        "createdAt": iso(record.created_at),
    }


def get_user_by_id(db: Session, user_id: str) -> dict[str, Any] | None:
    record = db.scalar(select(User).where(User.id == user_id).limit(1))
    if record is None:
        return None
    return map_user(record)


def get_user_by_email(db: Session, email: str) -> dict[str, Any] | None:
    record = db.scalar(select(User).where(User.email == email).limit(1))
    if record is None:
        return None
    return map_user(record)


def update_user_profile(
    db: Session, user_id: str, data: dict[str, Any]
) -> dict[str, Any] | None:
    record = db.scalar(select(User).where(User.id == user_id).limit(1))
    if record is None:
        return None

    changed = False
    if "name" in data and data["name"] is not None:
        record.name = data["name"]
        changed = True
    if "image" in data:
        record.image = data["image"]
        changed = True

    if changed:
        db.commit()
        db.refresh(record)

    return map_user(record)

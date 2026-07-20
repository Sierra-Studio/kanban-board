from datetime import datetime, timedelta
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session as DBSession

from app.config import settings
from app.models import Account, Session, User
from app.security import (
    generate_session_token,
    hash_password,
    verify_password,
)
from app.services.errors import ServiceError
from app.utils import iso

CREDENTIAL_PROVIDER = "credential"


def _map_session_user(user: User) -> dict[str, Any]:
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "image": user.image,
        "emailVerified": user.email_verified,
        "createdAt": iso(user.created_at),
        "updatedAt": iso(user.updated_at),
    }


def _create_session(db: DBSession, user_id: str) -> tuple[str, datetime]:
    token = generate_session_token()
    expires_at = datetime.utcnow() + timedelta(days=settings.SESSION_EXPIRES_DAYS)
    db.add(Session(token=token, user_id=user_id, expires_at=expires_at))
    db.commit()
    return token, expires_at


def sign_up(
    db: DBSession, name: str, email: str, password: str
) -> tuple[dict[str, Any], str, datetime]:
    existing = db.scalar(select(User).where(User.email == email).limit(1))
    if existing is not None:
        raise ServiceError("An account with this email already exists", 409, "USER_EXISTS")

    user = User(name=name, email=email, email_verified=False)
    db.add(user)
    db.flush()

    db.add(
        Account(
            account_id=user.id,
            provider_id=CREDENTIAL_PROVIDER,
            user_id=user.id,
            password=hash_password(password),
        )
    )
    db.commit()
    db.refresh(user)

    token, expires_at = _create_session(db, user.id)
    return _map_session_user(user), token, expires_at


def sign_in(
    db: DBSession, email: str, password: str
) -> tuple[dict[str, Any], str, datetime]:
    user = db.scalar(select(User).where(User.email == email).limit(1))
    if user is None:
        raise ServiceError("Invalid email or password", 401, "INVALID_CREDENTIALS")

    account = db.scalar(
        select(Account)
        .where(Account.user_id == user.id)
        .where(Account.provider_id == CREDENTIAL_PROVIDER)
        .limit(1)
    )
    if account is None or not verify_password(password, account.password):
        raise ServiceError("Invalid email or password", 401, "INVALID_CREDENTIALS")

    token, expires_at = _create_session(db, user.id)
    return _map_session_user(user), token, expires_at


def get_session(db: DBSession, token: str | None) -> dict[str, Any] | None:
    if not token:
        return None

    session = db.scalar(select(Session).where(Session.token == token).limit(1))
    if session is None:
        return None

    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        return None

    user = db.scalar(select(User).where(User.id == session.user_id).limit(1))
    if user is None:
        return None

    return {
        "user": _map_session_user(user),
        "session": {
            "id": session.id,
            "token": session.token,
            "userId": session.user_id,
            "expiresAt": iso(session.expires_at),
        },
    }


def sign_out(db: DBSession, token: str | None) -> None:
    if not token:
        return
    session = db.scalar(select(Session).where(Session.token == token).limit(1))
    if session is not None:
        db.delete(session)
        db.commit()

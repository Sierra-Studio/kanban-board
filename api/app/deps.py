import time
from typing import Any

from fastapi import Depends, Request, Response
from sqlalchemy.orm import Session

from app.auth_service import get_session
from app.config import settings
from app.database import get_db
from app.services.errors import ServiceError

_WINDOW_MS = 60_000
_MAX_REQUESTS = 120

# Simple in-memory fixed-window rate limiter, mirroring the original Hono middleware.
_rate_store: dict[str, dict[str, float]] = {}


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return f"ip:{forwarded.split(',')[0].strip()}"
    real_ip = request.headers.get("x-real-ip")
    if real_ip:
        return f"ip:{real_ip}"
    cf = request.headers.get("cf-connecting-ip")
    if cf:
        return f"ip:{cf}"
    client = request.client.host if request.client else "anonymous"
    return f"ip:{client}"


def _enforce_rate_limit(request: Request, response: Response, user_id: str | None) -> None:
    key = f"user:{user_id}" if user_id else _client_ip(request)
    now = time.time() * 1000
    existing = _rate_store.get(key)

    if existing is None or now - existing["windowStart"] >= _WINDOW_MS:
        _rate_store[key] = {"windowStart": now, "hits": 1}
    else:
        if existing["hits"] >= _MAX_REQUESTS:
            reset_at = existing["windowStart"] + _WINDOW_MS
            response.headers["x-rate-limit-limit"] = str(_MAX_REQUESTS)
            response.headers["x-rate-limit-remaining"] = "0"
            response.headers["x-rate-limit-reset"] = str(int(reset_at))
            raise ServiceError("Too Many Requests", 429, "RATE_LIMITED")
        existing["hits"] += 1

    current = _rate_store[key]
    reset_at = current["windowStart"] + _WINDOW_MS
    remaining = max(0, _MAX_REQUESTS - int(current["hits"]))
    response.headers["x-rate-limit-limit"] = str(_MAX_REQUESTS)
    response.headers["x-rate-limit-remaining"] = str(remaining)
    response.headers["x-rate-limit-reset"] = str(int(reset_at))


def get_token_from_request(request: Request) -> str | None:
    return request.cookies.get(settings.SESSION_COOKIE_NAME)


def require_user(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
) -> dict[str, Any]:
    token = get_token_from_request(request)
    session_data = get_session(db, token)
    if session_data is None:
        raise ServiceError("Unauthorized", 401)

    user = session_data["user"]
    _enforce_rate_limit(request, response, user_id=user["id"])
    return user

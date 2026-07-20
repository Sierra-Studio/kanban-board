from datetime import datetime

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from app import auth_service
from app.config import settings
from app.database import get_db
from app.deps import get_token_from_request
from app.responses import json_success
from app.schemas import SignInBody, SignUpBody

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _set_session_cookie(
    response: JSONResponse, token: str, expires_at: datetime
) -> None:
    max_age = settings.SESSION_EXPIRES_DAYS * 24 * 60 * 60
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=token,
        max_age=max_age,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite="lax",
        path="/",
    )


@router.post("/sign-up")
def sign_up(body: SignUpBody, db: Session = Depends(get_db)) -> JSONResponse:
    user, token, expires_at = auth_service.sign_up(
        db, body.name, body.email, body.password
    )
    response = json_success({"user": user}, status=201)
    _set_session_cookie(response, token, expires_at)
    return response


@router.post("/sign-in")
def sign_in(body: SignInBody, db: Session = Depends(get_db)) -> JSONResponse:
    user, token, expires_at = auth_service.sign_in(db, body.email, body.password)
    response = json_success({"user": user})
    _set_session_cookie(response, token, expires_at)
    return response


@router.post("/sign-out")
def sign_out(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    token = get_token_from_request(request)
    auth_service.sign_out(db, token)
    response = json_success({})
    response.delete_cookie(settings.SESSION_COOKIE_NAME, path="/")
    return response


@router.get("/get-session")
def get_session(request: Request, db: Session = Depends(get_db)) -> JSONResponse:
    token = get_token_from_request(request)
    session_data = auth_service.get_session(db, token)
    return json_success(session_data)

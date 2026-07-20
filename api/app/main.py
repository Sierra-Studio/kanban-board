import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.responses import json_error, json_success
from app.routers import auth, boards, cards, columns, users
from app.services.errors import ServiceError

logger = logging.getLogger("kanban.api")

app = FastAPI(title="Kanban Board API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=[
        "x-rate-limit-limit",
        "x-rate-limit-remaining",
        "x-rate-limit-reset",
    ],
)


@app.exception_handler(ServiceError)
async def _service_error_handler(_request: Request, exc: ServiceError):
    return json_error(exc.message, exc.status, exc.code)


@app.exception_handler(RequestValidationError)
async def _validation_error_handler(_request: Request, exc: RequestValidationError):
    errors = exc.errors()
    message = "Invalid request"
    if errors:
        first = errors[0]
        location = ".".join(str(part) for part in first.get("loc", []) if part != "body")
        detail = first.get("msg", "Invalid value")
        message = f"{location}: {detail}" if location else detail
    return json_error(message, 400, "VALIDATION_ERROR")


@app.exception_handler(Exception)
async def _unhandled_error_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled API error: %s", exc)
    return json_error("Internal Server Error", 500)


@app.get("/api/health")
def health():
    from datetime import datetime

    return json_success(
        {"status": "ok", "timestamp": datetime.utcnow().isoformat() + "Z"}
    )


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(boards.router)
app.include_router(columns.router)
app.include_router(cards.router)

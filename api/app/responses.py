from typing import Any

from fastapi.responses import JSONResponse


def json_success(data: Any, status: int = 200) -> JSONResponse:
    return JSONResponse({"success": True, "data": data}, status_code=status)


def json_list(
    data: list[Any], total: int, page: int, status: int = 200
) -> JSONResponse:
    return JSONResponse(
        {"success": True, "data": data, "total": total, "page": page},
        status_code=status,
    )


def json_error(
    error: str, status: int = 400, code: str | None = None
) -> JSONResponse:
    body: dict[str, Any] = {"success": False, "error": error}
    if code is not None:
        body["code"] = code
    return JSONResponse(body, status_code=status)

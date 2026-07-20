from datetime import datetime


def iso(value: datetime | None) -> str | None:
    """Serialize a naive UTC datetime to an ISO-8601 string with a trailing Z.

    Matches the format the original Node API produced (``Date`` -> JSON).
    """
    if value is None:
        return None
    return value.isoformat() + "Z"

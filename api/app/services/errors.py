class ServiceError(Exception):
    """Domain error carrying an HTTP status code and an optional machine code.

    Mirrors the ``ServiceError`` class from the original Node service layer.
    """

    def __init__(self, message: str, status: int, code: str | None = None) -> None:
        super().__init__(message)
        self.message = message
        self.status = status
        self.code = code

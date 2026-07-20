from pydantic import BaseModel, Field, field_validator


class SignUpBody(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    email: str = Field(min_length=1)
    password: str = Field(min_length=8)

    @field_validator("email")
    @classmethod
    def _valid_email(cls, value: str) -> str:
        value = value.strip()
        if "@" not in value or "." not in value.split("@")[-1]:
            raise ValueError("Invalid email address")
        return value.lower()


class SignInBody(BaseModel):
    email: str = Field(min_length=1)
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class UpdateProfileBody(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    image: str | None = Field(default=None)


class CreateBoardBody(BaseModel):
    title: str = Field(min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class UpdateBoardBody(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = Field(default=None, max_length=2000)


class ArchiveBoardBody(BaseModel):
    isArchived: bool


class DuplicateBoardBody(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)


class RenameColumnBody(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class ReorderColumnsBody(BaseModel):
    boardId: str = Field(min_length=1)
    columnIds: list[str] = Field(min_length=1)


class ToggleCollapseBody(BaseModel):
    isCollapsed: bool


class CreateCardBody(BaseModel):
    title: str = Field(min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10_000)

    @field_validator("title")
    @classmethod
    def _trim_title(cls, value: str) -> str:
        trimmed = value.strip()
        if not trimmed:
            raise ValueError("Title cannot be empty")
        return trimmed


class UpdateCardBody(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=500)
    description: str | None = Field(default=None, max_length=10_000)


class MoveCardBody(BaseModel):
    toColumnId: str = Field(min_length=1)
    index: int = Field(ge=0)


class ReorderCardsBody(BaseModel):
    columnId: str = Field(min_length=1)
    cardIds: list[str] = Field(min_length=1)

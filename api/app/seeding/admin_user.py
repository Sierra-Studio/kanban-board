from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import Account, User

KANBAN_ADMIN_EMAIL = "kanban-admin@system.local"
KANBAN_ADMIN_NAME = "🤖 Kanban Admin"


def kanban_admin_exists(db: Session) -> bool:
    admin = db.scalar(select(User.id).where(User.email == KANBAN_ADMIN_EMAIL).limit(1))
    return admin is not None


def should_run_seeding(db: Session) -> tuple[bool, str]:
    if kanban_admin_exists(db):
        return (
            False,
            "Kanban Admin already exists. Seeding has already been completed.",
        )
    return True, "Database is ready for initial seeding"


def create_kanban_admin(db: Session) -> str:
    """Create the special Kanban Admin system user and return its id."""
    admin = User(
        email=KANBAN_ADMIN_EMAIL,
        name=KANBAN_ADMIN_NAME,
        email_verified=True,
        image=None,
    )
    db.add(admin)
    db.flush()

    # System user: credential account with no password (cannot log in).
    db.add(
        Account(
            user_id=admin.id,
            account_id=admin.id,
            provider_id="credential",
            password=None,
        )
    )
    db.commit()
    db.refresh(admin)
    return admin.id

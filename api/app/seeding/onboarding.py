import logging

from sqlalchemy.orm import Session

from app.seeding.admin_user import KANBAN_ADMIN_EMAIL
from app.seeding.crowded_board import create_crowded_board
from app.seeding.demo_board import create_demo_board
from app.services.user_service import get_user_by_email

logger = logging.getLogger(__name__)


def onboard_new_user(db: Session, user_id: str) -> None:
    """Provision demo + crowded boards for a newly registered user.

    Boards are owned by the new user, but cards are attributed to the Kanban
    Admin system user. Errors are swallowed so signup never fails on seeding.
    """
    try:
        admin = get_user_by_email(db, KANBAN_ADMIN_EMAIL)
        if admin is None:
            raise RuntimeError(
                "Kanban Admin user not found - database may not be seeded"
            )

        create_demo_board(db, user_id, admin["id"])
        create_crowded_board(db, user_id, admin["id"])
    except Exception as error:  # noqa: BLE001
        logger.warning("Failed to onboard user %s: %s", user_id, error)

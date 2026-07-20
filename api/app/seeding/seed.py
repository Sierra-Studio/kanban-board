"""CLI entry point for initial database seeding.

Usage (after running Alembic migrations):

    python -m app.seeding.seed
    # or, if installed as a package:
    kanban-seed

Safe to run multiple times: it only seeds when the Kanban Admin does not exist.
"""

import sys

from app.database import SessionLocal
from app.seeding.admin_user import create_kanban_admin, should_run_seeding
from app.seeding.demo_board import create_demo_board


def run_seeding() -> tuple[bool, str]:
    print("🌱 Starting Kanban seeding process...")
    db = SessionLocal()
    try:
        should_run, reason = should_run_seeding(db)
        if not should_run:
            print(f"⏭️  Skipping seeding: {reason}")
            return True, f"Seeding skipped: {reason}"

        print("🚀 Beginning initial database seeding...")
        admin_id = create_kanban_admin(db)
        demo_board_id = create_demo_board(db, admin_id, admin_id)

        print("✨ Seeding completed successfully!")
        print(f"🤖 Kanban Admin created (ID: {admin_id})")
        print(f"📋 Demo board created (ID: {demo_board_id})")
        return True, "Database seeded successfully with Kanban Admin and demo board"
    except Exception as error:  # noqa: BLE001
        db.rollback()
        print(f"❌ Seeding failed: {error}")
        return False, f"Seeding failed: {error}"
    finally:
        db.close()


def main() -> None:
    print("🌱 Kanban Database Seeding CLI")
    print("==============================")
    success, _message = run_seeding()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()

from getpass import getpass

from pydantic import ValidationError
from sqlalchemy import select, text
from sqlalchemy.exc import IntegrityError

from tbo_inventory.infrastructure.database.database import SessionLocal
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.modules.auth.schemas import RegisterRequest
from tbo_inventory.modules.auth.security import hash_password


def create_admin() -> None:
    print("TBO Inventory Intelligence - Initial Admin Setup")
    print("This command only works when no active Admin exists.\n")

    email = input("Admin email: ")
    full_name = input("Admin full name: ")
    password = getpass("Admin password (minimum 12 characters): ")
    confirmation = getpass("Confirm password: ")

    if password != confirmation:
        raise SystemExit("Passwords do not match.")

    try:
        payload = RegisterRequest(
            email=email,
            full_name=full_name,
            password=password,
        )
    except ValidationError as exc:
        for error in exc.errors():
            print(f"Validation error: {error['msg']}")
        raise SystemExit(1) from exc

    with SessionLocal() as db:
        db.execute(text('SELECT pg_advisory_xact_lock(7420612026)'))
        existing_admin = db.scalar(
            select(User.id)
            .where(User.role == "admin", User.is_active.is_(True))
            .limit(1)
        )

        if existing_admin is not None:
            raise SystemExit(
                "An active Admin already exists. Bootstrap refused."
            )

        admin = User(
            email=payload.email,
            full_name=payload.full_name,
            password_hash=hash_password(payload.password),
            role="admin",
            is_active=True,
        )
        db.add(admin)

        try:
            db.commit()
        except IntegrityError as exc:
            db.rollback()
            raise SystemExit(
                "Admin creation failed. The email may already be registered."
            ) from exc

    print(f"\nInitial Admin created successfully: {payload.email}")


if __name__ == "__main__":
    create_admin()

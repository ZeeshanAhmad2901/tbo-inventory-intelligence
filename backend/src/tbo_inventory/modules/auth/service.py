from datetime import UTC, datetime, timedelta
from uuid import UUID

from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.models.password_reset_token import (
    PasswordResetToken,
)
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.infrastructure.database.models.user_session import UserSession
from tbo_inventory.modules.auth.security import (
    generate_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_password,
)


def create_user(
    db: Session,
    email: str,
    full_name: str,
    password: str,
) -> User:
    user = User(
        email=normalize_email(email),
        full_name=full_name.strip(),
        password_hash=hash_password(password),
        role="viewer",
        is_active=True,
    )
    db.add(user)

    try:
        db.commit()
        db.refresh(user)
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail="An account with this email already exists.",
        ) from exc

    return user


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.scalar(
        select(User).where(User.email == normalize_email(email))
    )

    if user is None or not user.is_active:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def create_session(db: Session, user: User) -> tuple[UserSession, str]:
    raw_token = generate_token()
    now = datetime.now(UTC)

    session = UserSession(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=now + timedelta(minutes=settings.session_ttl_minutes),
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return session, raw_token


def get_active_session(
    db: Session,
    raw_token: str,
) -> tuple[UserSession, User] | None:
    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == hash_token(raw_token),
            UserSession.revoked_at.is_(None),
            UserSession.expires_at > datetime.now(UTC),
        )
    )

    if session is None:
        return None

    user = db.get(User, session.user_id)
    if user is None or not user.is_active:
        return None

    return session, user


def revoke_session(db: Session, raw_token: str) -> None:
    session = db.scalar(
        select(UserSession).where(
            UserSession.token_hash == hash_token(raw_token),
            UserSession.revoked_at.is_(None),
        )
    )

    if session is not None:
        session.revoked_at = datetime.now(UTC)
        db.commit()


def revoke_all_user_sessions(db: Session, user_id: UUID) -> None:
    now = datetime.now(UTC)

    sessions = db.scalars(
        select(UserSession).where(
            UserSession.user_id == user_id,
            UserSession.revoked_at.is_(None),
        )
    ).all()

    for session in sessions:
        session.revoked_at = now

    db.commit()


def create_password_reset_token(
    db: Session,
    user: User,
) -> str:
    raw_token = generate_token()
    now = datetime.now(UTC)

    token = PasswordResetToken(
        user_id=user.id,
        token_hash=hash_token(raw_token),
        expires_at=now + timedelta(minutes=settings.password_reset_ttl_minutes),
    )
    db.add(token)
    db.commit()

    return raw_token


def reset_password(
    db: Session,
    raw_token: str,
    new_password: str,
) -> bool:
    token = db.scalar(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.token_hash == hash_token(raw_token),
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > datetime.now(UTC),
        )
        .with_for_update()
    )

    if token is None:
        return False

    user = db.get(User, token.user_id)
    if user is None or not user.is_active:
        return False

    now = datetime.now(UTC)
    user.password_hash = hash_password(new_password)

    outstanding_tokens = db.scalars(
        select(PasswordResetToken)
        .where(
            PasswordResetToken.user_id == user.id,
            PasswordResetToken.used_at.is_(None),
        )
        .with_for_update()
    ).all()

    for reset_token in outstanding_tokens:
        reset_token.used_at = now

    sessions = db.scalars(
        select(UserSession).where(
            UserSession.user_id == user.id,
            UserSession.revoked_at.is_(None),
        )
    ).all()

    for session in sessions:
        session.revoked_at = now

    db.commit()
    return True

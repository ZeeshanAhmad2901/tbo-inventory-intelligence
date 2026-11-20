import logging
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Cookie, Depends, Header, HTTPException, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.modules.auth.email_service import send_password_reset_email
from tbo_inventory.modules.auth.schemas import (
    AuthResponse,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    RoleUpdateRequest,
    UserResponse,
)
from tbo_inventory.modules.auth.security import (
    generate_csrf_token,
    verify_csrf_token,
)
from tbo_inventory.modules.auth.service import (
    authenticate_user,
    create_password_reset_token,
    create_session,
    create_user,
    get_active_session,
    reset_password,
    revoke_session,
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["authentication"])


def _set_auth_cookies(
    response: Response,
    session_token: str,
    csrf_token: str,
) -> None:
    cookie_options = {
        "secure": settings.session_cookie_secure,
        "samesite": settings.session_cookie_samesite,
        "path": "/",
    }

    response.set_cookie(
        key=settings.session_cookie_name,
        value=session_token,
        httponly=True,
        max_age=settings.session_ttl_minutes * 60,
        **cookie_options,
    )
    response.set_cookie(
        key="tbo_csrf",
        value=csrf_token,
        httponly=False,
        max_age=settings.session_ttl_minutes * 60,
        **cookie_options,
    )


def _clear_auth_cookies(response: Response) -> None:
    cookie_options = {
        "secure": settings.session_cookie_secure,
        "samesite": settings.session_cookie_samesite,
        "path": "/",
    }
    response.delete_cookie(
        key=settings.session_cookie_name,
        httponly=True,
        **cookie_options,
    )
    response.delete_cookie(
        key="tbo_csrf",
        httponly=False,
        **cookie_options,
    )


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    session_token: Annotated[str | None, Cookie(alias=settings.session_cookie_name)] = None,
) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="Authentication required.")

    active_session = get_active_session(db, session_token)
    if active_session is None:
        raise HTTPException(status_code=401, detail="Session is invalid or expired.")

    return active_session[1]


def require_same_origin(
    origin: Annotated[str | None, Header()] = None,
) -> None:
    expected_origin = settings.frontend_url.rstrip("/")

    if not origin or origin.rstrip("/") != expected_origin:
        raise HTTPException(
            status_code=403,
            detail="Request origin is not allowed.",
        )


def require_csrf(
    session_token: Annotated[
        str | None, Cookie(alias=settings.session_cookie_name)
    ] = None,
    csrf_cookie: Annotated[str | None, Cookie(alias="tbo_csrf")] = None,
    csrf_header: Annotated[str | None, Header(alias="X-CSRF-Token")] = None,
) -> None:
    if not session_token or not csrf_cookie or not csrf_header:
        raise HTTPException(status_code=403, detail="CSRF validation failed.")

    if csrf_cookie != csrf_header or not verify_csrf_token(
        csrf_header,
        session_token,
        settings.auth_secret_key,
    ):
        raise HTTPException(status_code=403, detail="CSRF validation failed.")


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    dependencies=[Depends(require_same_origin)],
)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    user = create_user(
        db,
        payload.email,
        payload.full_name,
        payload.password,
    )
    session, raw_token = create_session(db, user)
    csrf_token = generate_csrf_token(raw_token, settings.auth_secret_key)

    _set_auth_cookies(response, raw_token, csrf_token)
    return AuthResponse(user=UserResponse.model_validate(user), csrf_token=csrf_token)


@router.post(
    "/login",
    response_model=AuthResponse,
    dependencies=[Depends(require_same_origin)],
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Annotated[Session, Depends(get_db)],
) -> AuthResponse:
    user = authenticate_user(db, payload.email, payload.password)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    session, raw_token = create_session(db, user)
    csrf_token = generate_csrf_token(raw_token, settings.auth_secret_key)

    _set_auth_cookies(response, raw_token, csrf_token)
    return AuthResponse(user=UserResponse.model_validate(user), csrf_token=csrf_token)


@router.get("/me", response_model=UserResponse)
def me(
    current_user: Annotated[User, Depends(get_current_user)],
) -> UserResponse:
    return UserResponse.model_validate(current_user)


@router.post(
    "/logout",
    response_model=MessageResponse,
    dependencies=[Depends(require_same_origin)],
)
def logout(
    response: Response,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[None, Depends(require_csrf)],
    session_token: Annotated[
        str | None, Cookie(alias=settings.session_cookie_name)
    ] = None,
) -> MessageResponse:
    if session_token:
        revoke_session(db, session_token)

    _clear_auth_cookies(response)
    return MessageResponse(message="Logged out successfully.")

@router.post(
    "/forgot-password",
    response_model=MessageResponse,
    dependencies=[Depends(require_same_origin)],
)
def forgot_password(
    payload: ForgotPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    user = db.scalar(
        select(User).where(
            User.email == payload.email,
            User.is_active.is_(True),
        )
    )

    if user is not None:
        try:
            token = create_password_reset_token(db, user)
            send_password_reset_email(user.email, token)
        except Exception:
            logger.exception("Password-reset email could not be processed.")

    return MessageResponse(
        message=(
            "If an active account exists for that email, "
            "password-reset instructions will be sent."
        )
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
    dependencies=[Depends(require_same_origin)],
)
def reset_password_endpoint(
    payload: ResetPasswordRequest,
    db: Annotated[Session, Depends(get_db)],
) -> MessageResponse:
    if not reset_password(db, payload.token, payload.new_password):
        raise HTTPException(
            status_code=400,
            detail="The password-reset link is invalid or expired.",
        )

    return MessageResponse(message="Password reset successfully. Please log in again.")


@router.patch(
    "/users/{user_id}/role",
    response_model=UserResponse,
    dependencies=[Depends(require_same_origin)],
)
def update_user_role(
    user_id: UUID,
    payload: RoleUpdateRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_user)],
    _: Annotated[None, Depends(require_csrf)],
) -> UserResponse:
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")

    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(status_code=404, detail="User not found.")

    if target.role == "admin" and payload.role != "admin":
        active_admins = db.scalar(
            select(func.count())
            .select_from(User)
            .where(User.role == "admin", User.is_active.is_(True))
        ) or 0

        if target.is_active and active_admins <= 1:
            raise HTTPException(
                status_code=409,
                detail="The last active Admin cannot be demoted.",
            )

    target.role = payload.role
    db.commit()
    db.refresh(target)
    return UserResponse.model_validate(target)

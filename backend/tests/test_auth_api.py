import re
from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.main import app
from tbo_inventory.modules.auth.router import get_current_user
from tbo_inventory.modules.auth.security import (
    generate_csrf_token,
    generate_token,
    hash_password,
    hash_token,
    normalize_email,
    verify_csrf_token,
    verify_password,
)
from tbo_inventory.modules.auth.service import create_user


def test_normalize_email_trims_and_casefolds() -> None:
    assert normalize_email("  USER@Example.COM  ") == "user@example.com"


def test_password_hash_is_not_plaintext_and_verifies() -> None:
    password = "Strong-Test-Password-2026!"
    password_hash = hash_password(password)

    assert password_hash != password
    assert verify_password(password, password_hash)
    assert not verify_password("Wrong-Password-2026!", password_hash)


def test_verify_password_rejects_malformed_hash() -> None:
    assert not verify_password("any-password", "not-a-valid-password-hash")


def test_generated_tokens_are_random_and_url_safe() -> None:
    first = generate_token()
    second = generate_token()

    assert first != second
    assert len(first) >= 32
    assert re.fullmatch(r"[A-Za-z0-9_-]+", first)


def test_token_hash_is_deterministic_and_not_plaintext() -> None:
    token = generate_token()
    token_hash = hash_token(token)

    assert token_hash == hash_token(token)
    assert token_hash != token
    assert len(token_hash) == 64


def test_csrf_token_verifies_for_its_session() -> None:
    session_token = generate_token()
    csrf_token = generate_csrf_token(session_token, "test-secret-key")

    assert verify_csrf_token(csrf_token, session_token, "test-secret-key")


def test_csrf_token_rejects_another_session_or_secret() -> None:
    csrf_token = generate_csrf_token("session-one", "test-secret-key")

    assert not verify_csrf_token(csrf_token, "session-two", "test-secret-key")
    assert not verify_csrf_token(csrf_token, "session-one", "different-secret")


def test_csrf_token_rejects_malformed_values() -> None:
    assert not verify_csrf_token("malformed", "session", "secret")
    assert not verify_csrf_token("nonce.invalid", "session", "secret")


@pytest.fixture(autouse=True)
def clear_dependency_overrides():
    app.dependency_overrides.clear()
    yield
    app.dependency_overrides.clear()


def override_database():
    yield MagicMock()


def test_registration_rejects_untrusted_origin() -> None:
    client = TestClient(app)

    response = client.post(
        "/api/auth/register",
        json={
            "email": "viewer@example.com",
            "full_name": "Test Viewer",
            "password": "Strong-Test-Password-2026!",
        },
        headers={"Origin": "https://evil.example"},
    )

    assert response.status_code == 403


def test_me_rejects_unauthenticated_requests() -> None:
    app.dependency_overrides[get_db] = override_database
    client = TestClient(app)

    response = client.get("/api/auth/me")

    assert response.status_code == 401


def test_viewer_cannot_promote_another_user() -> None:
    app.dependency_overrides[get_db] = override_database
    app.dependency_overrides[get_current_user] = (
        lambda: SimpleNamespace(role="viewer")
    )
    client = TestClient(app)
    csrf_token = generate_csrf_token("test-session", settings.auth_secret_key)
    client.cookies.set(settings.session_cookie_name, "test-session")
    client.cookies.set("tbo_csrf", csrf_token)

    response = client.patch(
        f"/api/auth/users/{uuid4()}/role",
        json={"role": "admin"},
        headers={
            "Origin": settings.frontend_url,
            "X-CSRF-Token": csrf_token,
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "Admin access required."


def test_logout_rejects_invalid_csrf_token() -> None:
    app.dependency_overrides[get_db] = override_database
    app.dependency_overrides[get_current_user] = (
        lambda: SimpleNamespace(role="viewer")
    )
    client = TestClient(app)
    client.cookies.set(settings.session_cookie_name, "test-session")
    client.cookies.set("tbo_csrf", "invalid-token")

    response = client.post(
        "/api/auth/logout",
        headers={
            "Origin": settings.frontend_url,
            "X-CSRF-Token": "invalid-token",
        },
    )

    assert response.status_code == 403
    assert response.json()["detail"] == "CSRF validation failed."

def test_create_user_always_assigns_viewer_role() -> None:
    db = MagicMock()

    user = create_user(
        db,
        email="  NEWUSER@Example.COM ",
        full_name="  New User  ",
        password="Strong-Test-Password-2026!",
    )

    assert user.email == "newuser@example.com"
    assert user.full_name == "New User"
    assert user.role == "viewer"
    assert user.is_active is True
    db.add.assert_called_once_with(user)
    db.commit.assert_called_once()
    db.refresh.assert_called_once_with(user)


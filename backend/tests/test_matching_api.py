from types import SimpleNamespace
from unittest.mock import MagicMock
from uuid import uuid4

from tbo_inventory.modules.matching.router import (
    _normalise,
    _pair_key,
    _score_pair,
)


def make_product(name: str, attributes: dict | None = None):
    return SimpleNamespace(
        name=name,
        normalized_name=_normalise(name),
        attributes=attributes or {},
    )


def test_normalise_collapses_whitespace_and_case() -> None:
    assert _normalise("  GRAND   HOTEL  ") == "grand hotel"


def test_pair_key_is_order_independent() -> None:
    left_id = uuid4()
    right_id = uuid4()

    assert _pair_key(left_id, right_id) == _pair_key(right_id, left_id)


def test_identical_products_with_matching_attributes_score_highly() -> None:
    left = make_product(
        "Grand Hotel Kolkata",
        {"city": "Kolkata", "country": "India", "category": "Luxury"},
    )
    right = make_product(
        "Grand Hotel Kolkata",
        {"city": "Kolkata", "country": "India", "category": "Luxury"},
    )

    score, evidence = _score_pair(left, right)

    assert score == 100
    assert any(item.startswith("Product name:") for item in evidence)
    assert any(item.startswith("City:") for item in evidence)


def test_different_city_reduces_similarity_score() -> None:
    left = make_product(
        "Grand Hotel",
        {"city": "Kolkata", "country": "India"},
    )
    right = make_product(
        "Grand Hotel",
        {"city": "Mumbai", "country": "India"},
    )

    score, evidence = _score_pair(left, right)

    assert score < 100
    assert "City: 0% similarity" in evidence


def test_missing_attributes_do_not_create_false_evidence() -> None:
    left = make_product("Grand Hotel")
    right = make_product("Grand Hotel")

    score, evidence = _score_pair(left, right)

    assert score == 100
    assert len(evidence) == 1

from fastapi.testclient import TestClient

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.main import app
from tbo_inventory.modules.auth.router import get_current_user
from tbo_inventory.modules.auth.security import generate_csrf_token


def make_user(role: str = "viewer") -> User:
    return User(
        id=uuid4(),
        email=f"{role}-matching@example.com",
        full_name=f"{role.title()} Matching Test",
        password_hash="test-hash",
        role=role,
        is_active=True,
    )


def test_viewer_cannot_approve_or_reject_matching_candidate() -> None:
    user = make_user()
    db = MagicMock()

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = lambda: user

    session_token = "matching-test-session"
    csrf_token = generate_csrf_token(session_token, settings.auth_secret_key)

    client = TestClient(app)
    client.cookies.set(settings.session_cookie_name, session_token)
    client.cookies.set("tbo_csrf", csrf_token)

    try:
        response = client.post(
            f"/api/matching/candidates/{uuid4()}/{uuid4()}/decision",
            json={"decision": "approved"},
            headers={"X-CSRF-Token": csrf_token},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 403
    assert "Admins and Managers" in response.json()["detail"]
    db.query.assert_not_called()


def test_candidate_list_requires_authenticated_user() -> None:
    app.dependency_overrides.clear()
    client = TestClient(app)

    response = client.get("/api/matching/candidates")

    assert response.status_code == 401

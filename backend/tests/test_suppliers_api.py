from datetime import datetime, timezone
from unittest.mock import MagicMock

from fastapi.testclient import TestClient

from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.main import app


def make_client_with_database_result(rows: list[dict]) -> tuple[TestClient, MagicMock]:
    db = MagicMock()
    db.execute.return_value.mappings.return_value.all.return_value = rows

    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app), db


def test_list_suppliers_returns_database_records() -> None:
    supplier = {
        "id": "9a3f7f8e-1234-4567-8901-123456789abc",
        "code": "HOTELBEDS",
        "name": "Hotelbeds",
        "is_active": True,
        "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 1, 2, tzinfo=timezone.utc),
    }
    client, db = make_client_with_database_result([supplier])

    try:
        response = client.get("/api/suppliers")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [
        {
            **supplier,
            "created_at": "2026-01-01T00:00:00Z",
            "updated_at": "2026-01-02T00:00:00Z",
        }
    ]
    db.execute.assert_called_once()


def test_list_suppliers_returns_empty_list_when_no_records_exist() -> None:
    client, db = make_client_with_database_result([])

    try:
        response = client.get("/api/suppliers")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []
    db.execute.assert_called_once()


def test_list_suppliers_orders_records_by_name_and_code() -> None:
    client, db = make_client_with_database_result([])

    try:
        response = client.get("/api/suppliers")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    query = str(db.execute.call_args.args[0])
    assert "ORDER BY name ASC, code ASC" in query

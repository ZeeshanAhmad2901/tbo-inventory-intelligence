from typing import Annotated, Any

from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from tbo_inventory.config import settings
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.modules.ingestion.router import router as ingestion_router

app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Multi-supplier travel inventory intelligence API.",
)


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "name": settings.app_name,
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health", tags=["meta"])
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/suppliers", tags=["suppliers"])
def list_suppliers(db: Annotated[Session, Depends(get_db)]) -> list[dict[str, Any]]:
    """Return persisted supplier directory records."""
    result = db.execute(
        text(
            """
            SELECT id, code, name, is_active, created_at, updated_at
            FROM suppliers
            ORDER BY name ASC, code ASC
            """
        )
    )

    return [dict(row) for row in result.mappings().all()]


app.include_router(ingestion_router)

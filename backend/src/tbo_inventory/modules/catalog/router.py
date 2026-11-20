from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.modules.auth.router import get_current_user

router = APIRouter(prefix="/api/inventory", tags=["inventory"])


@router.get("")
def list_inventory(
    db: Annotated[Session, Depends(get_db)],
    _: Annotated[User, Depends(get_current_user)],
    search: str | None = Query(default=None, max_length=255),
    product_type: str = Query(default="hotel", min_length=1, max_length=32),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> dict[str, Any]:
    """Return paginated canonical inventory with all active supplier listings."""
    filters = ["is_active = true", "lower(product_type) = lower(:product_type)"]
    params: dict[str, Any] = {
        "product_type": product_type,
        "limit": limit,
        "offset": offset,
    }
    if search and search.strip():
        filters.append(
            "(name ILIKE :search OR normalized_name ILIKE :search "
            "OR CAST(attributes AS TEXT) ILIKE :search)"
        )
        params["search"] = f"%{search.strip()}%"

    where_clause = " AND ".join(filters)
    total_rows = db.execute(
        text(f"SELECT COUNT(*) AS total FROM canonical_products WHERE {where_clause}"),
        params,
    ).mappings().all()
    total = int(total_rows[0]["total"]) if total_rows else 0

    canonical_rows = db.execute(
        text(
            f"""
            SELECT id, name, product_type, attributes, updated_at
            FROM canonical_products
            WHERE {where_clause}
            ORDER BY name ASC, id ASC
            LIMIT :limit OFFSET :offset
            """
        ),
        params,
    ).mappings().all()

    products = []
    product_ids = [row["id"] for row in canonical_rows]
    for row in canonical_rows:
        attributes = row["attributes"] or {}
        products.append({
            "id": str(row["id"]),
            "name": row["name"],
            "city": attributes.get("city", ""),
            "country": attributes.get("country", ""),
            "category": attributes.get("category", ""),
            "address": attributes.get("address", ""),
            "status": "Unmatched",
            "listings": [],
            "updated": row["updated_at"].isoformat() if row["updated_at"] else "",
        })

    if product_ids:
        listing_rows = db.execute(
            text(
                """
                SELECT
                    sp.canonical_product_id,
                    sp.id,
                    sp.external_product_key,
                    sp.product_type,
                    sp.updated_at,
                    s.name AS supplier_name
                FROM supplier_products sp
                JOIN suppliers s ON s.id = sp.supplier_id
                WHERE sp.canonical_product_id IN :product_ids
                  AND sp.is_active = true
                ORDER BY s.name ASC, sp.name ASC
                """
            ).bindparams(__import__("sqlalchemy").bindparam("product_ids", expanding=True)),
            {"product_ids": product_ids},
        ).mappings().all()

        by_id = {str(product["id"]): product for product in products}
        for row in listing_rows:
            product = by_id.get(str(row["canonical_product_id"]))
            if product is None:
                continue
            product["listings"].append({
                "supplier": row["supplier_name"] or "",
                "listingId": row["external_product_key"] or str(row["id"]),
                "category": row["product_type"],
                "lastUpdated": row["updated_at"].isoformat() if row["updated_at"] else "",
            })
            product["status"] = "Matched"

    hotels = products
    return {
        "hotels": hotels,
        "countries": sorted({hotel["country"] for hotel in hotels if hotel["country"]}),
        "categories": sorted({hotel["category"] for hotel in hotels if hotel["category"]}),
        "total": total,
        "limit": limit,
        "offset": offset,
    }

from difflib import SequenceMatcher
from itertools import combinations
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from tbo_inventory.infrastructure.database.models.canonical_product import CanonicalProduct
from tbo_inventory.infrastructure.database.models.match_decision import MatchDecision
from tbo_inventory.infrastructure.database.models.supplier import Supplier
from tbo_inventory.infrastructure.database.models.supplier_product import SupplierProduct
from tbo_inventory.infrastructure.database.models.user import User
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.modules.auth.router import get_current_user, require_csrf


router = APIRouter(
    prefix="/api/matching",
    tags=["supplier matching"],
    dependencies=[Depends(get_current_user)],
)


class MatchDecisionRequest(BaseModel):
    decision: Literal["approved", "rejected"]


def _normalise(value: object) -> str:
    if value is None:
        return ""
    return " ".join(str(value).casefold().split())


def _attribute(product: SupplierProduct, *names: str) -> str:
    attributes = product.attributes or {}
    normalized = {
        _normalise(key).replace(" ", "_"): value
        for key, value in attributes.items()
    }

    for name in names:
        value = normalized.get(name)
        if value is not None and str(value).strip():
            return str(value).strip()

    return ""


def _location(product: SupplierProduct) -> str:
    city = _attribute(product, "city", "destination_city")
    country = _attribute(product, "country", "country_name")
    return ", ".join(part for part in (city, country) if part)


def _pair_key(left_id: UUID, right_id: UUID) -> tuple[UUID, UUID]:
    return tuple(sorted((left_id, right_id), key=str))


def _score_pair(
    left: SupplierProduct,
    right: SupplierProduct,
) -> tuple[int, list[str]]:
    left_name = _normalise(left.normalized_name or left.name)
    right_name = _normalise(right.normalized_name or right.name)

    name_similarity = SequenceMatcher(
        None,
        left_name,
        right_name,
    ).ratio()

    components: list[tuple[float, float, str]] = [
        (name_similarity, 0.70, "Product name"),
    ]

    left_city = _normalise(_attribute(left, "city", "destination_city"))
    right_city = _normalise(_attribute(right, "city", "destination_city"))
    left_country = _normalise(_attribute(left, "country", "country_name"))
    right_country = _normalise(_attribute(right, "country", "country_name"))

    if left_city and right_city:
        components.append((
            1.0 if left_city == right_city else 0.0,
            0.10,
            "City",
        ))

    if left_country and right_country:
        components.append((
            1.0 if left_country == right_country else 0.0,
            0.05,
            "Country",
        ))

    left_address = _normalise(_attribute(left, "address", "street_address"))
    right_address = _normalise(_attribute(right, "address", "street_address"))

    if left_address and right_address:
        components.append((
            SequenceMatcher(None, left_address, right_address).ratio(),
            0.10,
            "Address",
        ))

    left_category = _normalise(_attribute(left, "category", "hotel_category"))
    right_category = _normalise(_attribute(right, "category", "hotel_category"))

    if left_category and right_category:
        components.append((
            1.0 if left_category == right_category else 0.0,
            0.05,
            "Category",
        ))

    total_weight = sum(weight for _, weight, _ in components)
    score = round(
        100 * sum(value * weight for value, weight, _ in components)
        / total_weight
    )

    evidence = [
        f"{label}: {round(value * 100)}% similarity"
        for value, _, label in components
    ]

    return score, evidence


def _serialize_product(product: SupplierProduct) -> dict:
    return {
        "id": str(product.id),
        "name": product.name,
        "product_type": product.product_type,
        "supplier_id": str(product.supplier_id),
        "supplier_name": product.supplier.name,
        "canonical_product_id": (
            str(product.canonical_product_id)
            if product.canonical_product_id else None
        ),
        "city": _attribute(product, "city", "destination_city") or None,
        "country": _attribute(product, "country", "country_name") or None,
        "address": _attribute(product, "address", "street_address") or None,
        "category": _attribute(product, "category", "hotel_category") or None,
    }


def _require_editor(user: User) -> None:
    if user.role not in {"admin", "manager"}:
        raise HTTPException(
            status_code=403,
            detail="Only Admins and Managers can make matching decisions.",
        )


@router.get("/candidates")
def list_candidates(
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
    limit: int = Query(default=100, ge=1, le=500),
) -> dict:
    products = (
        db.query(SupplierProduct)
        .join(Supplier)
        .options(joinedload(SupplierProduct.supplier))
        .filter(
            SupplierProduct.is_active.is_(True),
            Supplier.is_active.is_(True),
        )
        .order_by(SupplierProduct.created_at.desc())
        .limit(1000)
        .all()
    )

    rejected_rows = db.query(MatchDecision).all()
    rejected_pairs = {
        _pair_key(row.left_supplier_product_id, row.right_supplier_product_id)
        for row in rejected_rows
    }

    candidates = []

    for left, right in combinations(products, 2):
        if left.supplier_id == right.supplier_id:
            continue

        if _normalise(left.product_type) != _normalise(right.product_type):
            continue

        if (
            left.canonical_product_id is not None
            and left.canonical_product_id == right.canonical_product_id
        ):
            continue

        # Do not propose an automatic merge between two existing
        # canonical identities.
        if (
            left.canonical_product_id is not None
            and right.canonical_product_id is not None
            and left.canonical_product_id != right.canonical_product_id
        ):
            continue

        if _pair_key(left.id, right.id) in rejected_pairs:
            continue

        score, evidence = _score_pair(left, right)

        if score < 45:
            continue

        candidates.append({
            "id": f"{left.id}:{right.id}",
            "left": _serialize_product(left),
            "right": _serialize_product(right),
            "similarity_score": score,
            "evidence": evidence,
            "status": "needs_review",
        })

    candidates.sort(
        key=lambda item: (
            -item["similarity_score"],
            item["left"]["name"].casefold(),
        )
    )

    selected = candidates[:limit]

    return {
        "items": selected,
        "total": len(candidates),
        "returned": len(selected),
        "products_considered": len(products),
        "rejected_pairs_excluded": len(rejected_pairs),
        "score_description": (
            "Heuristic similarity score based on available product "
            "name, location, address and category fields. "
            "It is not a probability of a correct match."
        ),
    }


@router.post(
    "/candidates/{left_id}/{right_id}/decision",
    dependencies=[Depends(require_csrf)],
)
def decide_candidate(
    left_id: UUID,
    right_id: UUID,
    payload: MatchDecisionRequest,
    db: Annotated[Session, Depends(get_db)],
    user: Annotated[User, Depends(get_current_user)],
) -> dict:
    _require_editor(user)

    if left_id == right_id:
        raise HTTPException(
            status_code=422,
            detail="A product cannot be matched with itself.",
        )

    left = db.query(SupplierProduct).filter(
        SupplierProduct.id == left_id,
        SupplierProduct.is_active.is_(True),
    ).with_for_update().one_or_none()

    right = db.query(SupplierProduct).filter(
        SupplierProduct.id == right_id,
        SupplierProduct.is_active.is_(True),
    ).with_for_update().one_or_none()

    if left is None or right is None:
        raise HTTPException(
            status_code=404,
            detail="One or both supplier products were not found.",
        )

    if left.supplier_id == right.supplier_id:
        raise HTTPException(
            status_code=422,
            detail="Matching requires products from different suppliers.",
        )

    if _normalise(left.product_type) != _normalise(right.product_type):
        raise HTTPException(
            status_code=422,
            detail="Products have incompatible product types.",
        )

    pair_left, pair_right = _pair_key(left.id, right.id)

    existing_decision = db.query(MatchDecision).filter_by(
        left_supplier_product_id=pair_left,
        right_supplier_product_id=pair_right,
    ).one_or_none()

    try:
        if payload.decision == "rejected":
            if (
                left.canonical_product_id is not None
                and left.canonical_product_id == right.canonical_product_id
            ):
                raise HTTPException(
                    status_code=409,
                    detail="These products are already linked to the same canonical product.",
                )

            if existing_decision is None:
                db.add(MatchDecision(
                    left_supplier_product_id=pair_left,
                    right_supplier_product_id=pair_right,
                    decision="rejected",
                ))

            db.commit()

            return {
                "status": "rejected",
                "message": "The rejected pair has been saved.",
                "left_id": str(left.id),
                "right_id": str(right.id),
            }

        if (
            left.canonical_product_id is not None
            and right.canonical_product_id is not None
            and left.canonical_product_id != right.canonical_product_id
        ):
            raise HTTPException(
                status_code=409,
                detail=(
                    "These listings already belong to different canonical "
                    "products. Resolve the canonical identities before matching."
                ),
            )

        canonical_id = (
            left.canonical_product_id or right.canonical_product_id
        )

        if canonical_id is not None:
            canonical = db.query(CanonicalProduct).filter(
                CanonicalProduct.id == canonical_id,
                CanonicalProduct.is_active.is_(True),
            ).with_for_update().one_or_none()

            if canonical is None:
                raise HTTPException(
                    status_code=409,
                    detail="The existing canonical product is unavailable.",
                )
        else:
            canonical = CanonicalProduct(
                name=left.name,
                normalized_name=_normalise(left.normalized_name or left.name),
                product_type=left.product_type,
                attributes=dict(left.attributes or {}),
                is_active=True,
            )
            db.add(canonical)
            db.flush()

        left.canonical_product_id = canonical.id
        right.canonical_product_id = canonical.id

        if existing_decision is not None:
            db.delete(existing_decision)

        db.commit()

        return {
            "status": "approved",
            "message": "Both supplier listings are linked to the canonical product.",
            "canonical_product_id": str(canonical.id),
            "left_id": str(left.id),
            "right_id": str(right.id),
        }

    except Exception:
        db.rollback()
        raise

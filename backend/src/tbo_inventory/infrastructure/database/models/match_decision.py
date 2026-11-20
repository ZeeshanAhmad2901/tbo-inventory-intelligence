from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    String,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from tbo_inventory.infrastructure.database.base import Base


class MatchDecision(Base):
    __tablename__ = "supplier_match_decisions"

    __table_args__ = (
        UniqueConstraint(
            "left_supplier_product_id",
            "right_supplier_product_id",
            name="uq_supplier_match_decisions_pair",
        ),
        CheckConstraint(
            "left_supplier_product_id <> right_supplier_product_id",
            name="ck_supplier_match_decisions_distinct_products",
        ),
        CheckConstraint(
            "decision = 'rejected'",
            name="ck_supplier_match_decisions_rejected_only",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    left_supplier_product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("supplier_products.id", ondelete="CASCADE"),
        nullable=False,
    )

    right_supplier_product_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("supplier_products.id", ondelete="CASCADE"),
        nullable=False,
    )

    decision: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="rejected",
        server_default="rejected",
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

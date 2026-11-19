from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Index,
    String,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.types import Uuid

from tbo_inventory.infrastructure.database.base import Base


class CanonicalProduct(Base):
    __tablename__ = "canonical_products"

    __table_args__ = (
        CheckConstraint(
            "length(trim(name)) > 0",
            name="non_empty_name",
        ),
        CheckConstraint(
            "length(trim(normalized_name)) > 0",
            name="non_empty_normalized_name",
        ),
        CheckConstraint(
            "length(trim(product_type)) > 0",
            name="non_empty_product_type",
        ),
        Index(
            "ix_canonical_products_type_normalized_name",
            "product_type",
            "normalized_name",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    normalized_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    product_type: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
    )

    attributes: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
        default=dict,
        server_default=text("'{}'::jsonb"),
    )

    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        server_default=text("true"),
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

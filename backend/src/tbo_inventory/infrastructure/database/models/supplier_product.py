from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    String,
    UniqueConstraint,
    func,
    text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from tbo_inventory.infrastructure.database.base import Base

if TYPE_CHECKING:
    from tbo_inventory.infrastructure.database.models.raw_record import RawRecord
    from tbo_inventory.infrastructure.database.models.supplier import Supplier


class SupplierProduct(Base):
    __tablename__ = "supplier_products"

    __table_args__ = (
        UniqueConstraint(
            "supplier_id",
            "external_product_key",
            name="uq_supplier_products_supplier_external_key",
        ),
        CheckConstraint(
            "length(trim(name)) > 0",
            name="non_empty_name",
        ),
        CheckConstraint(
            "external_product_key IS NULL OR length(trim(external_product_key)) > 0",
            name="non_empty_external_product_key",
        ),
        CheckConstraint(
            "length(trim(product_type)) > 0",
            name="non_empty_product_type",
        ),
        Index(
            "ix_supplier_products_supplier_type",
            "supplier_id",
            "product_type",
        ),
        Index(
            "ix_supplier_products_normalized_name",
            "normalized_name",
        ),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    supplier_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("suppliers.id", ondelete="RESTRICT"),
        nullable=False,
    )

    source_raw_record_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("raw_records.id", ondelete="RESTRICT"),
        nullable=False,
    )

    external_product_key: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    normalized_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
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

    supplier: Mapped["Supplier"] = relationship(
        back_populates="supplier_products",
    )

    source_raw_record: Mapped["RawRecord"] = relationship(
        back_populates="supplier_products",
    )

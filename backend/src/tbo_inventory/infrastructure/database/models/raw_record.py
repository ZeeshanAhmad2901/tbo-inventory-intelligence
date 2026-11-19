from datetime import datetime
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Index,
    Integer,
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
    from tbo_inventory.infrastructure.database.models.import_job import ImportJob
    from tbo_inventory.infrastructure.database.models.supplier_product import SupplierProduct


class RawRecord(Base):
    __tablename__ = "raw_records"
    __table_args__ = (
        UniqueConstraint(
            "import_job_id",
            "row_number",
            name="uq_raw_records_import_job_row",
        ),
        CheckConstraint("row_number > 0", name="positive_row_number"),
        CheckConstraint(
            "validation_status IN ('pending', 'valid', 'invalid')",
            name="valid_validation_status",
        ),
        CheckConstraint(
            "payload_hash ~ '^[0-9a-f]{64}$'",
            name="valid_sha256_hash_length",
        ),
        Index("ix_raw_records_import_job", "import_job_id"),
        Index("ix_raw_records_payload_hash", "payload_hash"),
    )

    id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )
    import_job_id: Mapped[UUID] = mapped_column(
        Uuid(as_uuid=True),
        ForeignKey("import_jobs.id", ondelete="RESTRICT"),
        nullable=False,
    )
    row_number: Mapped[int] = mapped_column(Integer, nullable=False)
    external_record_key: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )
    payload: Mapped[dict] = mapped_column(JSONB, nullable=False)
    payload_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    validation_status: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        default="pending",
        server_default=text("'pending'"),
    )
    validation_errors: Mapped[list] = mapped_column(
        JSONB,
        nullable=False,
        default=list,
        server_default=text("'[]'::jsonb"),
    )
    received_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    import_job: Mapped["ImportJob"] = relationship(
        back_populates="raw_records",
    )

    supplier_products: Mapped[list["SupplierProduct"]] = relationship(
        back_populates="source_raw_record",
    )

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
    func,
    text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.types import Uuid

from tbo_inventory.infrastructure.database.base import Base

if TYPE_CHECKING:
    from tbo_inventory.infrastructure.database.models.raw_record import RawRecord
    from tbo_inventory.infrastructure.database.models.supplier import Supplier


class ImportJob(Base):
    __tablename__ = "import_jobs"
    __table_args__ = (
        CheckConstraint(
            "status IN ('queued', 'running', 'succeeded', 'partial', 'failed', 'cancelled')",
            name="valid_status",
        ),
        CheckConstraint(
            "records_received >= 0 AND records_accepted >= 0 AND records_rejected >= 0",
            name="non_negative_record_counts",
        ),
        CheckConstraint(
            "records_accepted + records_rejected <= records_received",
            name="valid_record_count_totals",
        ),
        CheckConstraint(
            "completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at",
            name="valid_completion_time",
        ),
        Index("ix_import_jobs_supplier_created", "supplier_id", "created_at"),
        Index("ix_import_jobs_status", "status"),
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
    source_filename: Mapped[str | None] = mapped_column(
        String(512),
        nullable=True,
    )
    status: Mapped[str] = mapped_column(
        String(24),
        nullable=False,
        default="queued",
        server_default=text("'queued'"),
    )
    records_received: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    records_accepted: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    records_rejected: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        server_default=text("0"),
    )
    started_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    completed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
    )

    supplier: Mapped["Supplier"] = relationship(
        back_populates="import_jobs",
    )
    raw_records: Mapped[list["RawRecord"]] = relationship(
        back_populates="import_job",
    )

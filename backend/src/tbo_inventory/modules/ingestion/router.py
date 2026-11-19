from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from tbo_inventory.infrastructure.database.models.import_job import ImportJob
from tbo_inventory.infrastructure.database.models.raw_record import RawRecord
from tbo_inventory.infrastructure.database.session import get_db
from tbo_inventory.modules.ingestion.service import (
    MAX_FILE_SIZE,
    process_import,
    serialize_job,
)

router = APIRouter(prefix="/api/ingestion", tags=["ingestion"])


@router.post("/imports", status_code=201)
async def upload_inventory(
    supplier_id: Annotated[UUID, Form()],
    file: Annotated[UploadFile, File()],
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    filename = file.filename or "inventory"
    content = await file.read(MAX_FILE_SIZE + 1)
    await file.close()

    job = process_import(db, supplier_id, filename, content)
    return serialize_job(job)


@router.get("/imports")
def list_imports(
    db: Annotated[Session, Depends(get_db)],
    supplier_id: UUID | None = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 50,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> list[dict]:
    statement = select(ImportJob).order_by(ImportJob.created_at.desc())
    if supplier_id:
        statement = statement.where(ImportJob.supplier_id == supplier_id)

    jobs = db.scalars(statement.limit(limit).offset(offset)).all()
    return [serialize_job(job) for job in jobs]


@router.get("/imports/{job_id}")
def get_import(
    job_id: UUID,
    db: Annotated[Session, Depends(get_db)],
) -> dict:
    job = db.get(ImportJob, job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Import job not found.")

    records = db.scalars(
        select(RawRecord)
        .where(RawRecord.import_job_id == job_id)
        .order_by(RawRecord.row_number.asc())
    ).all()

    result = serialize_job(job)
    result["records"] = [
        {
            "id": str(record.id),
            "row_number": record.row_number,
            "external_record_key": record.external_record_key,
            "validation_status": record.validation_status,
            "validation_errors": record.validation_errors,
            "payload": record.payload,
        }
        for record in records
    ]
    return result

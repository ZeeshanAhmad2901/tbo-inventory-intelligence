import csv
import hashlib
import io
import json
import re
from datetime import UTC, date, datetime
from pathlib import Path
from typing import Any
from uuid import UUID

from fastapi import HTTPException
from openpyxl import load_workbook
from sqlalchemy.orm import Session

from tbo_inventory.infrastructure.database.models.import_job import ImportJob
from tbo_inventory.infrastructure.database.models.raw_record import RawRecord
from tbo_inventory.infrastructure.database.models.supplier import Supplier
from tbo_inventory.infrastructure.database.models.supplier_product import SupplierProduct

MAX_FILE_SIZE = 10 * 1024 * 1024

ALIASES = {
    "name": {"name", "product_name", "title", "hotel_name"},
    "product_type": {"product_type", "type", "category", "inventory_type"},
    "external_product_key": {
        "external_product_key", "sku", "product_id", "external_id", "code",
    },
}

def _header(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "_", str(value or "").strip().lower()).strip("_")


def _json_value(value: Any) -> Any:
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    return str(value)


def parse_inventory_file(filename: str, content: bytes) -> tuple[list[dict], dict[str, str]]:
    suffix = Path(filename).suffix.lower()
    if suffix not in {".csv", ".xlsx"}:
        raise ValueError("Only CSV and XLSX files are supported.")
    if not content:
        raise ValueError("The uploaded file is empty.")
    if len(content) > MAX_FILE_SIZE:
        raise ValueError("The uploaded file exceeds the 10 MB limit.")

    if suffix == ".csv":
        try:
            decoded = content.decode("utf-8-sig")
        except UnicodeDecodeError:
            decoded = content.decode("cp1252")
        sample = decoded[:8192]
        try:
            dialect = csv.Sniffer().sniff(sample, delimiters=",;\t|")
        except csv.Error:
            dialect = csv.excel
        reader = csv.reader(io.StringIO(decoded), dialect)
        rows = list(reader)
    else:
        workbook = load_workbook(io.BytesIO(content), read_only=True, data_only=True)
        try:
            worksheet = workbook.active
            rows = list(worksheet.iter_rows(values_only=True))
        finally:
            workbook.close()

    if not rows:
        raise ValueError("The uploaded file has no header row.")

    headers = [_header(value) for value in rows[0]]
    if not any(headers):
        raise ValueError("The uploaded file has an empty header row.")

    mapping: dict[str, str] = {}
    for canonical, aliases in ALIASES.items():
        match = next((header for header in headers if header in aliases), None)
        if match:
            mapping[canonical] = match

    missing = [field for field in ("name", "product_type") if field not in mapping]
    if missing:
        raise ValueError(
            "Missing required columns: " + ", ".join(missing)
            + ". Required columns are name and product_type."
        )

    records: list[dict] = []
    for row_number, values in enumerate(rows[1:], start=2):
        payload = {
            headers[index]: _json_value(values[index] if index < len(values) else None)
            for index in range(len(headers))
            if headers[index]
        }
        if not any(value not in (None, "") for value in payload.values()):
            continue
        records.append({"row_number": row_number, "payload": payload})

    return records, mapping


def _validate(payload: dict, mapping: dict[str, str]) -> tuple[dict, list[str]]:
    values = {
        field: str(payload.get(header) or "").strip()
        for field, header in mapping.items()
    }
    errors: list[str] = []

    if not values.get("name"):
        errors.append("Product name is required.")
    elif len(values["name"]) > 255:
        errors.append("Product name must be 255 characters or fewer.")

    if not values.get("product_type"):
        errors.append("Product type is required.")
    elif len(values["product_type"]) > 32:
        errors.append("Product type must be 32 characters or fewer.")

    key = values.get("external_product_key") or None
    if key and len(key) > 255:
        errors.append("External product key must be 255 characters or fewer.")

    return values, errors


def _normalise_name(value: str) -> str:
    return " ".join(value.casefold().split())


def process_import(
    db: Session,
    supplier_id: UUID,
    filename: str,
    content: bytes,
) -> ImportJob:
    supplier = db.get(Supplier, supplier_id)
    if supplier is None or not supplier.is_active:
        raise HTTPException(status_code=404, detail="Active supplier not found.")

    try:
        records, mapping = parse_inventory_file(filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=422, detail="Unable to read the uploaded file.") from exc

    if not records:
        raise HTTPException(status_code=422, detail="The file contains no inventory rows.")

    now = datetime.now(UTC)
    job = ImportJob(
        supplier_id=supplier_id,
        source_filename=Path(filename).name[:512],
        status="running",
        started_at=now,
    )
    db.add(job)

    accepted = 0
    rejected = 0
    products_by_key: dict[str, SupplierProduct] = {}

    try:
        db.flush()

        for item in records:
            payload = item["payload"]
            canonical, errors = _validate(payload, mapping)
            payload_hash = hashlib.sha256(
                json.dumps(payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
            ).hexdigest()

            raw_record = RawRecord(
                import_job_id=job.id,
                row_number=item["row_number"],
                external_record_key=canonical.get("external_product_key") or None,
                payload=payload,
                payload_hash=payload_hash,
                validation_status="invalid" if errors else "valid",
                validation_errors=errors,
            )
            db.add(raw_record)
            db.flush()

            if errors:
                rejected += 1
                continue

            name = canonical["name"]
            product_type = canonical["product_type"]
            external_key = canonical.get("external_product_key") or None

            # Retain supplier identity and update the existing source product by key.
            product = None
            if external_key:
                product = products_by_key.get(external_key)
                if product is None:
                    product = (
                        db.query(SupplierProduct)
                        .filter(
                            SupplierProduct.supplier_id == supplier_id,
                            SupplierProduct.external_product_key == external_key,
                        )
                        .one_or_none()
                    )
                    if product is not None:
                        products_by_key[external_key] = product

            known_headers = set(mapping.values())
            attributes = {
                key: value for key, value in payload.items()
                if key not in known_headers
            }

            if product is None:
                product = SupplierProduct(
                    supplier_id=supplier_id,
                    source_raw_record_id=raw_record.id,
                    external_product_key=external_key,
                    name=name,
                    normalized_name=_normalise_name(name),
                    product_type=product_type,
                    attributes=attributes,
                    is_active=True,
                )
                db.add(product)
                if external_key:
                    products_by_key[external_key] = product
            else:
                product.source_raw_record_id = raw_record.id
                product.name = name
                product.normalized_name = _normalise_name(name)
                product.product_type = product_type
                product.attributes = attributes
                product.is_active = True

            accepted += 1

        job.records_received = len(records)
        job.records_accepted = accepted
        job.records_rejected = rejected
        job.status = (
            "succeeded" if rejected == 0
            else "partial" if accepted > 0
            else "failed"
        )
        job.completed_at = datetime.now(UTC)
        db.commit()
        db.refresh(job)
        return job
    except Exception:
        db.rollback()
        raise


def serialize_job(job: ImportJob) -> dict:
    return {
        "id": str(job.id),
        "supplier_id": str(job.supplier_id),
        "source_filename": job.source_filename,
        "status": job.status,
        "records_received": job.records_received,
        "records_accepted": job.records_accepted,
        "records_rejected": job.records_rejected,
        "started_at": job.started_at.isoformat() if job.started_at else None,
        "completed_at": job.completed_at.isoformat() if job.completed_at else None,
        "created_at": job.created_at.isoformat() if job.created_at else None,
    }

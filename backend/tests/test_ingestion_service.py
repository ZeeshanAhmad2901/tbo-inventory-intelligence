from io import BytesIO

import pytest
from openpyxl import Workbook

from tbo_inventory.modules.ingestion.service import parse_inventory_file


def test_parse_csv_with_supplier_headers() -> None:
    content = (
        b"SKU,Product Name,Category,Location\n"
        b"HTL-001,Grand Hotel,hotel,Goa\n"
        b"HTL-002,Beach Resort,resort,Kerala\n"
    )

    records, mapping = parse_inventory_file("inventory.csv", content)

    assert mapping["name"] == "product_name"
    assert mapping["product_type"] == "category"
    assert mapping["external_product_key"] == "sku"
    assert len(records) == 2
    assert records[0]["row_number"] == 2
    assert records[0]["payload"]["location"] == "Goa"


def test_parse_xlsx_file() -> None:
    workbook = Workbook()
    worksheet = workbook.active
    worksheet.append(["name", "product_type", "sku"])
    worksheet.append(["City Hotel", "hotel", "HTL-100"])

    output = BytesIO()
    workbook.save(output)
    workbook.close()

    records, mapping = parse_inventory_file("inventory.xlsx", output.getvalue())

    assert mapping["name"] == "name"
    assert len(records) == 1
    assert records[0]["payload"]["sku"] == "HTL-100"


def test_parse_csv_skips_blank_rows() -> None:
    content = (
        b"name,product_type\n"
        b"Hotel One,hotel\n"
        b",\n"
        b"Hotel Two,resort\n"
    )

    records, _ = parse_inventory_file("inventory.csv", content)

    assert len(records) == 2
    assert [record["row_number"] for record in records] == [2, 4]


@pytest.mark.parametrize(
    ("filename", "content", "message"),
    [
        ("inventory.txt", b"name,product_type\nHotel,hotel", "Only CSV and XLSX"),
        ("inventory.csv", b"", "uploaded file is empty"),
        ("inventory.csv", b"name,location\nHotel,Goa", "Missing required columns"),
    ],
)
def test_parse_rejects_invalid_files(
    filename: str,
    content: bytes,
    message: str,
) -> None:
    with pytest.raises(ValueError, match=message):
        parse_inventory_file(filename, content)
